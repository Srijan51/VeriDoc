"""
POST /query
Accepts a question + optional list of doc_ids,
retrieves relevant chunks from Supabase,
and generates a grounded answer via Gemini with contradiction detection.
"""

import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.models.schemas import QueryRequest, QueryResponse, Citation, Contradiction
from app.services.embeddings import similarity_search
from app.services.groq import generate_answer, GENERATION_MODEL
from app.services.auth import get_current_user
from app.services.storage import get_all_documents

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/query", tags=["query"])


@router.post(
    "",
    response_model=QueryResponse,
    summary="Query the knowledge base",
)
async def query_documents(body: QueryRequest, request: Request) -> QueryResponse:
    """
    Ask a natural-language question against your indexed documents.
    Returns an answer with contradiction detection across sources.

    - **question**: The question to answer.
    - **doc_ids**: (Optional) Restrict search to specific documents.
    - **top_k**: (Optional) How many source chunks to retrieve (1-20, default 5).
    """
    user_id = get_current_user(request)

    # Get user's document IDs to scope the query
    user_docs = get_all_documents(user_id=user_id)
    user_doc_ids = [d["doc_id"] for d in user_docs]

    # If user specified doc_ids, filter to only their documents
    if body.doc_ids:
        query_doc_ids = [did for did in body.doc_ids if did in user_doc_ids]
    else:
        query_doc_ids = user_doc_ids

    if not query_doc_ids:
        return QueryResponse(
            question=body.question,
            answer="You don't have any documents uploaded yet. Please upload documents first.",
            confidence_score=0.0,
            citations=[],
            contradictions=[],
            no_answer_found=True,
            no_answer_reason="No documents available for the current user.",
            model=GENERATION_MODEL,
        )

    try:
        chunks = similarity_search(
            query=body.question,
            doc_ids=query_doc_ids,
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
