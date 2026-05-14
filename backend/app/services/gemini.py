"""
Gemini service — builds a grounded answer from retrieved context chunks
using the Gemini 1.5 Flash model via the Google Generative AI SDK.
"""

from __future__ import annotations

import logging

from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from app.config import get_settings

logger = logging.getLogger(__name__)

MODEL_FALLBACKS = [
    "models/gemini-2.5-flash",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-001",
    "models/gemini-2.5-pro",
]

GENERATION_MODEL = "models/gemini-2.5-flash"

_genai_client: genai.Client | None = None


def _get_genai_client() -> genai.Client:
    global _genai_client
    if _genai_client is None:
        settings = get_settings()
        _genai_client = genai.Client(api_key=settings.gemini_api_key)
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

    settings = get_settings()
    model_candidates = [
        settings.gemini_model,
        *(m for m in MODEL_FALLBACKS if m != settings.gemini_model),
    ]

    last_error: Exception | None = None
    for model in model_candidates:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    systemInstruction=(
                        "You are VeriDoc, an enterprise knowledge truth engine. "
                        "Answer questions strictly based on the provided document context. "
                        "If the context does not contain enough information to answer, "
                        "say so clearly — do NOT hallucinate. "
                        "Be concise, factual, and cite which source chunk supports each claim."
                    ),
                    temperature=0.1,
                    topP=0.95,
                    maxOutputTokens=2048,
                ),
            )
            logger.info("Using Gemini model %s", model)
            return response.text.strip()
        except genai_errors.ClientError as exc:
            last_error = exc
            error_str = str(exc)
            # Check if it's a 404 model not found error
            if "404" in error_str or "NOT_FOUND" in error_str:
                logger.warning(
                    "Gemini model %s unavailable, trying next fallback", model
                )
                continue
            # Check if it's a quota exceeded error
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                logger.warning("Gemini quota exceeded for model %s", model)
                # Don't try fallbacks for quota issues - they're account-wide
                raise RuntimeError(
                    f"Gemini API quota exceeded. Please check your Google AI Studio billing/plan at https://ai.google.dev/gemini-api/docs/rate-limits. "
                    f"Free tier limits have been reached for model {model}."
                ) from exc
            raise
        except Exception as exc:
            last_error = exc
            break

    model_list = ", ".join(model_candidates)
    raise RuntimeError(
        f"No Gemini model available. Tried: {model_list}. Last error: {last_error}"
    )
