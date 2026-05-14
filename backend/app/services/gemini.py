"""
Gemini service — builds a grounded answer from retrieved context chunks
using the Gemini 1.5 Flash model via the Google Generative AI SDK.
"""

from __future__ import annotations

import logging

import google.genai as genai

from app.config import get_settings

logger = logging.getLogger(__name__)

GENERATION_MODEL = "gemini-1.5-flash"

_model: genai.GenerativeModel | None = None


def _get_model() -> genai.GenerativeModel:
    global _model
    if _model is None:
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        _model = genai.GenerativeModel(
            model_name=GENERATION_MODEL,
            generation_config={
                "temperature": 0.2,
                "top_p": 0.95,
                "max_output_tokens": 2048,
            },
            system_instruction=(
                "You are VeriDoc, an enterprise knowledge truth engine. "
                "Answer questions strictly based on the provided document context. "
                "If the context does not contain enough information to answer, "
                "say so clearly — do NOT hallucinate. "
                "Be concise, factual, and cite which source chunk supports each claim."
            ),
        )
    return _model


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

    model = _get_model()
    prompt = _build_prompt(question, context_chunks)

    logger.info(
        "Generating answer for question=%r using %d chunks",
        question[:80],
        len(context_chunks),
    )

    response = model.generate_content(prompt)
    return response.text.strip()
