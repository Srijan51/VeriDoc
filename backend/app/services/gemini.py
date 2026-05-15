"""
Gemini service — builds a grounded answer from retrieved context chunks
using the Gemini 2.5 Flash model via the Google Generative AI SDK.
Includes contradiction detection across source documents.
"""

from __future__ import annotations

import json
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


# ── Prompt builders ───────────────────────────────────────────────────────────

def _format_chunks_with_metadata(context_chunks: list[dict]) -> str:
    """
    Format chunks with SOURCE, TYPE, DATE headers for contradiction detection.
    """
    formatted_parts = []
    for chunk in context_chunks:
        part = (
            f"SOURCE: {chunk.get('filename', 'unknown')}\n"
            f"TYPE: {chunk.get('doc_type', 'unknown')}\n"
            f"DATE: {chunk.get('doc_date', 'unknown')}\n"
            f"\n{chunk.get('text', '')}\n"
            f"---"
        )
        formatted_parts.append(part)
    
    return "\n\n".join(formatted_parts)


SYSTEM_PROMPT = """You are VERIDOC, an enterprise knowledge truth auditor. Your job is NOT just to answer questions — your primary function is to detect when different company documents give conflicting information.

You will receive:
- A user question
- Retrieved text chunks from multiple source documents, each labelled with SOURCE, TYPE (policy/handbook/sop/memo), and DATE

YOUR TASK:
1. Answer the question using the retrieved context
2. Identify ALL factual claims relevant to the question across ALL sources
3. Compare claims: if two sources state different facts for the same topic, that is a CONTRADICTION
4. For each contradiction found, assess severity:
   - CRITICAL: Legal, compliance, or safety implications
   - HIGH: Official policy differences (leave days, salary, rights)
   - MEDIUM: Process or procedure differences
   - LOW: Wording differences with same intent
5. Determine the authoritative source using this hierarchy: policy > sop > handbook > memo, and newer date wins when types match

OUTPUT: Respond ONLY with valid JSON. No preamble, no markdown fences, no explanation outside the JSON.

{
  "answer": "Direct answer to the question in 2-3 sentences",
  "confidence_score": 0.0,
  "citations": [
    {
      "source": "filename.pdf",
      "doc_type": "policy",
      "doc_date": "2024-01-15",
      "claim": "Exact relevant claim from this source"
    }
  ],
  "contradictions": [
    {
      "topic": "What the contradiction is about",
      "source_a": "filename_a.pdf",
      "claim_a": "What source A says",
      "source_b": "filename_b.pdf",
      "claim_b": "What source B says",
      "severity": "HIGH",
      "authoritative_source": "filename_a.pdf",
      "reason": "Policy doc from 2024 supersedes handbook from 2021"
    }
  ],
  "no_answer_found": false,
  "no_answer_reason": null
}

If no relevant information exists in the documents, set no_answer_found to true and explain why in no_answer_reason. Never hallucinate facts not present in the retrieved chunks."""


# ── Public API ────────────────────────────────────────────────────────────────

def generate_answer(question: str, context_chunks: list[dict]) -> dict:
    """
    Generate a grounded answer with contradiction detection.

    Args:
        question:       The user's natural-language question.
        context_chunks: List of chunk dicts from similarity_search (now includes doc_type, doc_date).

    Returns:
        A dict with keys: answer, confidence_score, citations, contradictions, no_answer_found, no_answer_reason
    """
    if not context_chunks:
        return {
            "answer": "I could not find relevant information in the uploaded documents to answer your question. Please try rephrasing or upload additional documents.",
            "confidence_score": 0.0,
            "citations": [],
            "contradictions": [],
            "no_answer_found": True,
            "no_answer_reason": "No relevant documents found in the knowledge base.",
        }

    client = _get_genai_client()
    formatted_context = _format_chunks_with_metadata(context_chunks)
    
    user_prompt = f"Question: {question}\n\n---\n\nDocument Chunks:\n\n{formatted_context}"

    logger.info(
        "Generating answer with contradiction detection for question=%r using %d chunks",
        question[:80],
        len(context_chunks),
    )

    settings = get_settings()
    model_candidates = [
        settings.gemini_model,
        *(m for m in MODEL_FALLBACKS if m != settings.gemini_model),
    ]

    last_error: Exception | None = None
    last_response_text: str | None = None
    
    for attempt in range(2):  # Try up to 2 attempts per model (for JSON retry)
        for model in model_candidates:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        systemInstruction=SYSTEM_PROMPT,
                        temperature=0.2,
                        topP=0.95,
                        maxOutputTokens=4096,
                    ),
                )
                logger.info("Using Gemini model %s", model)
                response_text = response.text.strip()
                last_response_text = response_text
                
                # Try to parse JSON (strip markdown fences if present)
                json_text = response_text
                if json_text.startswith("```json"):
                    json_text = json_text[7:]  # Remove ```json
                if json_text.startswith("```"):
                    json_text = json_text[3:]  # Remove ```
                if json_text.endswith("```"):
                    json_text = json_text[:-3]  # Remove trailing ```
                
                result = json.loads(json_text.strip())
                logger.info("Successfully parsed contradiction detection response")
                return result
                
            except json.JSONDecodeError as exc:
                if attempt == 0:
                    logger.warning(
                        "JSON parsing failed on attempt 1, will retry with reminder. Error: %s",
                        exc
                    )
                    # On second attempt, add a reminder to the system prompt
                    continue
                else:
                    logger.error(
                        "JSON parsing failed on attempt 2. Response was: %s",
                        last_response_text[:500]
                    )
                    last_error = exc
                    break
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
                    raise RuntimeError(
                        f"Gemini API quota exceeded. Please check your Google AI Studio billing/plan at https://ai.google.dev/gemini-api/docs/rate-limits. "
                        f"Free tier limits have been reached for model {model}."
                    ) from exc
                raise
            except Exception as exc:
                last_error = exc
                logger.error("Unexpected error during answer generation: %s", exc)
                break
    
    # If we get here, all attempts failed
    error_msg = f"Failed to generate answer with contradiction detection. Last error: {last_error}"
    logger.error(error_msg)
    raise RuntimeError(error_msg)
