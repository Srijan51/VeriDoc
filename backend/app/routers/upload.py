"""
POST /upload
Accepts a multipart file upload, processes the document,
indexes it in Supabase, and persists metadata.
"""

import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status
from datetime import datetime

from app.models.schemas import UploadResponse
from app.services.document_processor import process_document, SUPPORTED_TYPES
from app.services.embeddings import upsert_chunks
from app.services.storage import store_in_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])


@router.post(
    "",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document for indexing",
)
async def upload_document(
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
    # Validate doc_type
    allowed_doc_types = {"policy", "handbook", "sop", "memo"}
    if doc_type not in allowed_doc_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"doc_type must be one of: {', '.join(sorted(allowed_doc_types))}",
        )

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

    return UploadResponse(
        doc_id=doc_id,
        filename=filename,
        file_type=processed["file_type"],
        chunk_count=len(chunks),
    )