"""
POST /query
Accepts a question + optional list of doc_ids,
retrieves relevant chunks from Supabase,
and generates a grounded answer via Gemini with contradiction detection.
"""

import logging

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import QueryRequest, QueryResponse, Citation, Contradiction
from app.services.embeddings import similarity_search
from app.services.groq import generate_answer, GENERATION_MODEL

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
    Returns an answer with contradiction detection across sources.

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
        response_dict = generate_answer(question=body.question, context_chunks=chunks)
    except Exception as exc:
        logger.exception("Answer generation failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Answer generation failed: {exc}",
        )

    # Parse citations from response
    citations = [
        Citation(
            source=c["source"],
            doc_type=c["doc_type"],
            doc_date=c["doc_date"],
            claim=c["claim"],
        )
        for c in response_dict.get("citations", [])
    ]

    # Parse contradictions from response
    contradictions = [
        Contradiction(
            topic=c["topic"],
            source_a=c["source_a"],
            claim_a=c["claim_a"],
            source_b=c["source_b"],
            claim_b=c["claim_b"],
            severity=c["severity"],
            authoritative_source=c["authoritative_source"],
            reason=c["reason"],
        )
        for c in response_dict.get("contradictions", [])
    ]

    return QueryResponse(
        question=body.question,
        answer=response_dict.get("answer", ""),
        confidence_score=response_dict.get("confidence_score", 0.0),
        citations=citations,
        contradictions=contradictions,
        no_answer_found=response_dict.get("no_answer_found", False),
        no_answer_reason=response_dict.get("no_answer_reason"),
        model=GENERATION_MODEL,
    )
