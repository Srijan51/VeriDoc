"""
POST /upload
Accepts a multipart file upload, processes the document,
indexes it in Supabase, and persists metadata.
"""

import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status, Request
from datetime import datetime

from app.models.schemas import UploadResponse
from app.services.document_processor import process_document, SUPPORTED_TYPES
from app.services.embeddings import upsert_chunks
from app.services.storage import store_in_supabase, upload_file_to_storage, update_document_file_path
from app.services.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["upload"])


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document for indexing",
)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    doc_date: str = Form(...),
) -> UploadResponse:
    """
    Upload a PDF, DOCX, or TXT file.

    - Extracts raw text.
    - Splits into overlapping chunks.
    - Embeds and indexes in Supabase pgvector.
    - Saves metadata to Supabase.
    - Returns a doc_id for subsequent queries.
    """
    # Normalize doc_type to Title Case so it matches backend conventions
    # Frontend sends lowercase: "policy", "handbook", "sop", "memo"
    # Backend stores as Title Case: "Policy", "Handbook", "SOP", "Memo"
    doc_type_map = {
        "policy": "Policy",
        "handbook": "Handbook",
        "sop": "SOP",
        "memo": "Memo",
    }
    normalized = doc_type_map.get(doc_type.strip().lower())
    if normalized is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"doc_type must be one of: {', '.join(sorted(doc_type_map.keys()))} (case-insensitive)",
        )
    doc_type = normalized

    # Validate doc_date
    try:
        datetime.strptime(doc_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="doc_date must be formatted as YYYY-MM-DD.",
        )

    # Validate file type
    content_type = file.content_type or ""
    if content_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type '{content_type}'. "
                f"Accepted types: PDF, DOCX, TXT."
            ),
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    doc_id = str(uuid.uuid4())
    filename = Path(file.filename).name if file.filename else f"{doc_id}.bin"
    user_id = get_current_user(request)

    # Process document
    try:
        logger.info("Processing document '%s' (doc_id=%s)", filename, doc_id)
        processed = process_document(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
            doc_id=doc_id,
        )
    except Exception as exc:
        logger.exception("Failed to process document")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not extract text from document: {exc}",
        )

    chunks = processed["chunks"]
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No extractable text found in the document.",
        )

    base_metadata = {
        "filename": filename,
        "doc_type": doc_type,
        "doc_date": doc_date,
    }

    # Save metadata to Supabase documents table
    try:
        store_in_supabase(
            doc_id=doc_id,
            chunks=chunks,
            base_metadata=base_metadata,
            file_type=SUPPORTED_TYPES[content_type],
            chunk_count=len(chunks),
            size_bytes=len(file_bytes),
            user_id=user_id,
        )
    except Exception as exc:
        logger.exception("Failed to persist metadata in Supabase")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Metadata persistence failed: {exc}",
        )

    # Embed and index chunks in Supabase pgvector
    try:
        upsert_chunks(
            doc_id=doc_id,
            filename=filename,
            chunks=chunks,
        )
    except Exception as exc:
        logger.exception("Failed to index document vectors")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vector indexing failed: {exc}",
        )

    # Store original file in Supabase Storage for later viewing
    try:
        file_path = upload_file_to_storage(
            user_id=user_id,
            doc_id=doc_id,
            filename=filename,
            file_bytes=file_bytes,
            content_type=content_type,
        )
        update_document_file_path(doc_id, file_path)
    except Exception as exc:
        # Non-fatal — document is still indexed, just can't be viewed
        logger.warning("Failed to store file in storage (doc_id=%s): %s", doc_id, exc)

    return UploadResponse(
        doc_id=doc_id,
        filename=filename,
        file_type=processed["file_type"],
        chunk_count=len(chunks),
    )