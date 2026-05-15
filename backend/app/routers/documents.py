"""
GET /documents
Returns metadata for all uploaded documents from Supabase.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import DocumentMeta, DocumentListResponse
from app.services.storage import get_all_documents

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List all uploaded documents",
)
async def list_documents() -> DocumentListResponse:
    """
    Retrieve metadata for every document that has been uploaded and indexed.

    Returns documents ordered newest-first.
    """
    try:
        rows = get_all_documents()
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
            chunk_count=row["chunk_count"],
            uploaded_at=datetime.fromisoformat(row["uploaded_at"]),
            size_bytes=row.get("size_bytes"),
        )
        for row in rows
    ]

    return DocumentListResponse(documents=docs, total=len(docs))
