"""
POST /upload
Accepts a multipart file upload, processes the document,
indexes it in Pinecone, and persists metadata in Supabase.
"""

import uuid
import logging

from fastapi import APIRouter, File, UploadFile, HTTPException, status

from app.models.schemas import UploadResponse
from app.services.document_processor import process_document, SUPPORTED_TYPES
from app.services.embeddings import upsert_chunks
from app.services.storage import save_document_metadata

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])


@router.post(
    "",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document for indexing",
)
async def upload_document(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload a PDF, DOCX, or TXT file.

    - Extracts raw text.
    - Splits into overlapping chunks.
    - Embeds and indexes in Pinecone.
    - Saves metadata to Supabase.
    - Returns a **doc_id** for subsequent queries.
    """
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
    filename = file.filename or f"{doc_id}.bin"

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

    try:
        upsert_chunks(
            doc_id=doc_id,
            filename=filename,
            chunks=chunks,
        )
    except Exception as exc:
        logger.exception("Failed to index document in Pinecone")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vector indexing failed: {exc}",
        )

    try:
        save_document_metadata(
            doc_id=doc_id,
            filename=filename,
            file_type=processed["file_type"],
            chunk_count=len(chunks),
            size_bytes=len(file_bytes),
        )
    except Exception as exc:
        # Non-fatal — vectors already indexed
        logger.warning("Metadata save failed (non-fatal): %s", exc)

    return UploadResponse(
        doc_id=doc_id,
        filename=filename,
        file_type=processed["file_type"],
        chunk_count=len(chunks),
    )
