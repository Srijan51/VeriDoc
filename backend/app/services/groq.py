"""
Groq service — builds a grounded answer from retrieved context chunks
using Groq's OpenAI-compatible Chat Completions API.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

# Real Groq model names
MODEL_FALLBACKS: list[str] = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]

GENERATION_MODEL = "llama-3.3-70b-versatile"


def _format_chunks_with_metadata(context_chunks: list[dict]) -> str:
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


SYSTEM_PROMPT = """You are VERIDOC, an enterprise knowledge truth auditor. Your job is to answer questions AND resolve any conflicts found in the documents by determining which source is authoritative.

You will receive:
- A user question
- Retrieved text chunks from multiple source documents, each labelled with SOURCE, TYPE (Policy/Handbook/SOP/Memo), and DATE

YOUR TASK:
1. Answer the question using the retrieved context
2. Compare claims across ALL sources for the topic asked about
3. If sources DISAGREE on facts, you MUST:
   a. Identify the contradiction
   b. Determine the authoritative source using this hierarchy: Policy > Handbook > SOP > Memo (newer date wins if same type)
   c. Give a DEFINITIVE answer based on the authoritative source
   d. Explain in your answer which document is correct and why
4. For severity, use:
   - CRITICAL: Legal, compliance, or safety differences
   - HIGH: Official policy differences (leave days, salary, benefits)
   - MEDIUM: Process or procedure differences
   - LOW: Wording differences with same intent
5. IMPORTANT: Report only ONE contradiction per topic. Do NOT create multiple entries for the same conflicting topic.

OUTPUT: Respond ONLY with valid JSON matching this schema. No preamble, no markdown fences.

{
  "answer": "A definitive answer resolving any conflicts. If contradictions exist, state which document is authoritative and give the correct answer based on document priority and date.",
  "confidence_score": 0.85,
  "citations": [
    {
      "source": "filename.pdf",
      "doc_type": "Policy",
      "doc_date": "2024-01-15",
      "claim": "Exact relevant claim from this source"
    }
  ],
  "contradictions": [
    {
      "topic": "Concise topic name (e.g. 'Annual leave days')",
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

RULES:
- Never list the same contradiction topic twice. One entry per conflicting topic.
- Always give a definitive answer that RESOLVES the conflict
- The answer must clearly state: what the correct information is, which document it comes from, and why
- If no relevant information exists, set no_answer_found to true
- Never hallucinate facts not present in the retrieved chunks
- CRITICAL: You MUST adhere STRICTLY to the following document hierarchy to resolve conflicts: 1. Policy 2. Handbook 3. SOP 4. Memo. Within the same type, the NEWEST document (by DATE) ALWAYS wins. Any contradiction resolution that violates this hierarchy or ignores the date is incorrect."""


def _call_groq_api(system_prompt: str, user_prompt: str, model: str, api_key: str, timeout: int = 60) -> str:
    """Call the real Groq OpenAI-compatible Chat Completions API."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_completion_tokens": 4096,
        "response_format": {"type": "json_object"},
    }

    logger.debug("Calling Groq API with model=%s", model)
    resp = httpx.post(url, json=payload, headers=headers, timeout=timeout)

    if resp.status_code == 429:
        raise RuntimeError(
            f"Groq API rate limit exceeded for model {model}. Please wait and retry."
        )

    if resp.status_code == 404:
        raise RuntimeError(f"Groq model {model} not found.")

    resp.raise_for_status()

    data = resp.json()

    # OpenAI-compatible response: data.choices[0].message.content
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        logger.warning("Unexpected Groq response shape: %s", json.dumps(data)[:500])
        return json.dumps(data)


def generate_answer(question: str, context_chunks: list[dict]) -> dict:
    if not context_chunks:
        return {
            "answer": "I could not find relevant information in the uploaded documents to answer your question. Please try rephrasing or upload additional documents.",
            "confidence_score": 0.0,
            "citations": [],
            "contradictions": [],
            "no_answer_found": True,
            "no_answer_reason": "No relevant documents found in the knowledge base.",
        }

    settings = get_settings()
    api_key = settings.groq_api_key
    if not api_key:
        raise RuntimeError("Groq API key not configured (GROQ_API_KEY missing)")

    formatted_context = _format_chunks_with_metadata(context_chunks)
    user_prompt = f"Question: {question}\n\n---\n\nDocument Chunks:\n\n{formatted_context}\n\nRespond with JSON as specified."

    logger.info("Generating answer via Groq for question=%r using %d chunks", question[:80], len(context_chunks))

    model_candidates = [settings.groq_model, *(m for m in MODEL_FALLBACKS if m != settings.groq_model)]

    last_error: Exception | None = None

    for model in model_candidates:
        try:
            response_text = _call_groq_api(SYSTEM_PROMPT, user_prompt, model, api_key)

            # Strip markdown fences if present (some models still add them)
            json_text = response_text.strip()
            if json_text.startswith("```json"):
                json_text = json_text[7:]
            if json_text.startswith("```"):
                json_text = json_text[3:]
            if json_text.endswith("```"):
                json_text = json_text[:-3]

            result = json.loads(json_text.strip())

            # Update the global for response tracking
            global GENERATION_MODEL
            GENERATION_MODEL = model

            logger.info("Successfully parsed Groq response using model=%s", model)
            return result

        except json.JSONDecodeError as exc:
            logger.warning("JSON parsing failed for model %s: %s", model, exc)
            last_error = exc
            continue
        except RuntimeError as exc:
            err_str = str(exc)
            if "not found" in err_str.lower():
                logger.warning("Model %s not found, trying next fallback", model)
                last_error = exc
                continue
            if "rate limit" in err_str.lower() or "429" in err_str:
                logger.warning("Rate limited on model %s, trying next fallback", model)
                last_error = exc
                continue
            raise
        except Exception as exc:
            last_error = exc
            logger.error("Unexpected error during Groq answer generation with model %s: %s", model, exc)
            continue

    error_msg = f"Failed to generate answer with Groq. Last error: {last_error}"
    logger.error(error_msg)
    raise RuntimeError(error_msg)
