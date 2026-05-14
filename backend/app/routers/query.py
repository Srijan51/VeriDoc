"""
POST /query
Accepts a question + optional list of doc_ids,
retrieves relevant chunks from Pinecone,
and generates a grounded answer via Gemini.
"""

import logging

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import QueryRequest, QueryResponse, SourceChunk
from app.services.embeddings import similarity_search
from app.services.gemini import generate_answer, GENERATION_MODEL

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/query", tags=["query"])


@router.post(
    "",
    response_model=QueryResponse,
    summary="Query the knowledge base",
)
async def query_documents(body: QueryRequest) -> QueryResponse:
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
            top_k=body.top_k,
        )
    except Exception as exc:
        logger.exception("Similarity search failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vector search failed: {exc}",
        )

    try:
        answer = generate_answer(question=body.question, context_chunks=chunks)
    except Exception as exc:
        logger.exception("Answer generation failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Answer generation failed: {exc}",
        )

    sources = [
        SourceChunk(
            doc_id=c["doc_id"],
            filename=c["filename"],
            chunk_index=c["chunk_index"],
            text=c["text"],
            score=c["score"],
        )
        for c in chunks
    ]

    return QueryResponse(
        question=body.question,
        answer=answer,
        sources=sources,
        model=GENERATION_MODEL,
    )
