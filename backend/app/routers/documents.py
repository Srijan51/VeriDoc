"""
GET /documents
Returns metadata for documents belonging to the authenticated user.
GET /documents/{doc_id}/url
Returns a signed URL to view/download a document.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request, status

from app.models.schemas import DocumentMeta, DocumentListResponse
from app.services.storage import get_all_documents, get_document_by_id, get_file_signed_url
from app.services.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List uploaded documents for the current user",
)
async def list_documents(request: Request) -> DocumentListResponse:
    """
    Retrieve metadata for documents uploaded by the authenticated user.

    Returns documents ordered newest-first.
    """
    user_id = get_current_user(request)

    try:
        rows = get_all_documents(user_id=user_id)
    except Exception as exc:
        logger.exception("Failed to fetch documents from Supabase")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not retrieve documents: {exc}",
        )

    docs = [
        DocumentMeta(
            doc_id=row["doc_id"],
            filename=row["filename"],
            file_type=row["file_type"],
            doc_type=row.get("doc_type"),
            doc_date=row.get("doc_date"),
            chunk_count=row["chunk_count"],
            uploaded_at=datetime.fromisoformat(row["uploaded_at"]),
            size_bytes=row.get("size_bytes"),
        )
        for row in rows
    ]

    return DocumentListResponse(documents=docs, total=len(docs))


@router.get(
    "/{doc_id}/url",
    summary="Get a signed URL to view/download a document",
)
async def get_document_url(doc_id: str, request: Request) -> dict:
    """
    Returns a time-limited signed URL for viewing/downloading the original document.
    The URL expires after 1 hour.
    """
    user_id = get_current_user(request)

    # Fetch the document and verify ownership
    doc = get_document_by_id(doc_id)
    if not doc or doc.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    file_path = doc.get("file_path")
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original file is not available for this document",
        )

    try:
        signed_url = get_file_signed_url(file_path)
        return {
            "url": signed_url,
            "filename": doc.get("filename", ""),
            "file_type": doc.get("file_type", ""),
        }
    except Exception as exc:
        logger.exception("Failed to generate signed URL for doc_id=%s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not generate file URL: {exc}",
        )
