"""
POST /query
Accepts a question + optional list of doc_ids,
retrieves relevant chunks from Pinecone,
and generates a grounded answer via Gemini.
"""

import logging

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import QueryRequest, QueryResponse, SourceChunk, AuditQueryResponse
from app.services.embeddings import similarity_search
from app.services.gemini import generate_answer, generate_audit_answer, GENERATION_MODEL

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/query", tags=["query"])


def group_by_source(chunks: list[dict]) -> dict[str, list[dict]]:
    grouped = {}
    for chunk in chunks:
        filename = chunk["filename"]
        if filename not in grouped:
            grouped[filename] = []
        grouped[filename].append(chunk)
    for filename in grouped:
        grouped[filename].sort(key=lambda c: c["chunk_index"])
    return grouped


@router.post(
    "",
    response_model=AuditQueryResponse,
    summary="Query the knowledge base",
)
async def query_documents(body: QueryRequest) -> AuditQueryResponse:
    """
    Ask a natural-language question against your indexed documents.

    - **question**: The question to answer.
    - **doc_ids**: (Optional) Restrict search to specific documents.
    - **top_k**: (Optional) How many source chunks to retrieve (1-20, default 5).
    """
    try:
        chunks = similarity_search(
            query=body.question,
            doc_ids=body.doc_ids if body.doc_ids else None,
            top_k=8,
        )
    except Exception as exc:
        logger.exception("Similarity search failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vector search failed: {exc}",
        )

    try:
        audit_result = generate_audit_answer(question=body.question, context_chunks=chunks)
    except Exception as exc:
        logger.exception("Audit answer generation failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Audit generation failed: {exc}",
        )

    return AuditQueryResponse(**audit_result)
