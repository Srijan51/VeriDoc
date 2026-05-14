"""
Gemini service — builds a grounded answer from retrieved context chunks
using the Gemini 1.5 Flash model via the Google Generative AI SDK.
"""

from __future__ import annotations

import json
import logging

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

GENERATION_MODEL = "gemini-1.5-flash"

_genai_client: genai.Client | None = None


def _get_genai_client() -> genai.Client:
    global _genai_client
    if _genai_client is None:
        settings = get_settings()
        _genai_client = genai.Client(
            api_key=settings.gemini_api_key,
            http_options={"api_version": "v1"},
        )
    return _genai_client


# ── Prompt builder ────────────────────────────────────────────────────────────

def _build_prompt(question: str, context_chunks: list[dict]) -> str:
    context_parts = []
    for i, chunk in enumerate(context_chunks, start=1):
        context_parts.append(
            f"[Source {i} | {chunk['filename']} | chunk {chunk['chunk_index']}]\n"
            f"{chunk['text']}"
        )

    context_str = "\n\n---\n\n".join(context_parts)

    return (
        f"## Context\n\n{context_str}\n\n"
        f"## Question\n\n{question}\n\n"
        f"## Answer\n\n"
        "Using ONLY the context above, provide a precise and well-structured answer. "
        "Reference the source numbers (e.g. [Source 1]) where relevant."
    )


# ── Public API ────────────────────────────────────────────────────────────────

def generate_answer(question: str, context_chunks: list[dict]) -> str:
    """
    Generate a grounded answer given a question and retrieved context chunks.

    Args:
        question:       The user's natural-language question.
        context_chunks: List of chunk dicts from Pinecone similarity search.

    Returns:
        A string containing the model's answer.
    """
    if not context_chunks:
        return (
            "I could not find relevant information in the uploaded documents "
            "to answer your question. Please try rephrasing or upload additional documents."
        )

    client = _get_genai_client()
    prompt = _build_prompt(question, context_chunks)

    logger.info(
        "Generating answer for question=%r using %d chunks",
        question[:80],
        len(context_chunks),
    )

    response = client.models.generate_content(
        model=GENERATION_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            systemInstruction=(
                "You are VeriDoc, an enterprise knowledge truth engine. "
                "Answer questions strictly based on the provided document context. "
                "If the context does not contain enough information to answer, "
                "say so clearly — do NOT hallucinate. "
                "Be concise, factual, and cite which source chunk supports each claim."
            ),
            temperature=0.2,
            topP=0.95,
            maxOutputTokens=2048,
        ),
    )
    return response.text.strip()


def generate_audit_answer(question: str, context_chunks: list[dict]) -> dict:
    """
    Generate an audited answer with citations and contradiction detection.

    Args:
        question:       The user's natural-language question.
        context_chunks: List of chunk dicts from similarity search.

    Returns:
        A dict with audit results.
    """
    if not context_chunks:
        return {
            "no_answer_found": True,
            "no_answer_reason": "No context provided",
            "answer": "",
            "confidence_score": 0.0,
            "citations": [],
            "contradictions": [],
        }

    # Build formatted context
    context_parts = []
    for chunk in context_chunks:
        doc_type = chunk.get("doc_type", "unknown")
        doc_date = chunk.get("doc_date", "unknown")
        context_parts.append(
            f"SOURCE_NAME: {chunk['filename']} | DOC_TYPE: {doc_type} | DOC_DATE: {doc_date}\n{chunk['text']}"
        )
    context_str = "\n\n---\n\n".join(context_parts)

    prompt = f"## Context\n\n{context_str}\n\n## Question\n\n{question}\n\n## Audit Response\n\nProvide a JSON response with audit analysis."

    client = _get_genai_client()

    logger.info(
        "Generating audit answer for question=%r using %d chunks",
        question[:80],
        len(context_chunks),
    )

    response = client.models.generate_content(
        model=GENERATION_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            systemInstruction=(
                "You are VERIDOC, an enterprise knowledge truth auditor. "
                "Analyze the provided document context to answer the question. "
                "Perform contradiction detection by identifying conflicting claims across sources. "
                "Return a JSON object with exactly these fields: "
                "answer (string: the answer based on context), "
                "confidence_score (float 0.0-1.0: confidence in the answer), "
                "citations (array of objects: each with source (filename), doc_type, doc_date, claim (relevant excerpt)), "
                "contradictions (array of objects: each with topic, source_a, claim_a, source_b, claim_b, severity (CRITICAL/HIGH/MEDIUM/LOW), authoritative_source, reason), "
                "no_answer_found (boolean: true if no answer possible), "
                "no_answer_reason (string or null: reason if no answer). "
                "If contradictions exist, list them with severity. "
                "Be factual and cite sources accurately."
            ),
            temperature=0.1,
            topP=0.95,
            maxOutputTokens=2048,
        ),
    )

    raw_text = response.text.strip()
    # Strip markdown fences
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    if raw_text.startswith("```"):
        raw_text = raw_text[3:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
    raw_text = raw_text.strip()

    try:
        result = json.loads(raw_text)
        return result
    except json.JSONDecodeError:
        return {
            "no_answer_found": True,
            "no_answer_reason": f"Model returned malformed JSON: {raw_text[:200]}",
            "answer": "",
            "confidence_score": 0.0,
            "citations": [],
            "contradictions": [],
        }
