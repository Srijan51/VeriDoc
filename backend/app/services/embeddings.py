"""
Supabase pgvector service — upserts document chunk embeddings and performs
similarity search using Google's text-embedding-004 model.
"""

from __future__ import annotations

import logging
from typing import Any

from google import genai
from google.genai import types

from app.config import get_settings
from app.services.storage import _get_client

logger = logging.getLogger(__name__)

# ── Embedding config ──────────────────────────────────────────────────────────
EMBEDDING_DIM = 768
EMBED_MODEL = "models/gemini-embedding-001"
BATCH_SIZE = 50


# ── Lazy singleton ────────────────────────────────────────────────────────────

_genai_client: genai.Client | None = None


def _get_genai_client() -> genai.Client:
    global _genai_client
    if _genai_client is None:
        settings = get_settings()
        _genai_client = genai.Client(api_key=settings.gemini_api_key)
    return _genai_client


# ── Helpers ───────────────────────────────────────────────────────────────────

import concurrent.futures

def _embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of strings using Google's text-embedding model.
    Since google-genai 1.x does not support batched embed_content reliably,
    we run the single-text calls in parallel using a ThreadPoolExecutor.
    """
    client = _get_genai_client()

    def _embed_single(text: str) -> list[float]:
        result = client.models.embed_content(
            model=EMBED_MODEL,
            contents=text,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=EMBEDDING_DIM,
            ),
        )
        return result.embeddings[0].values

    # Run up to 15 concurrent requests to speed up embedding massively
    with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
        embeddings = list(executor.map(_embed_single, texts))

    return embeddings


def _embed_query(text: str) -> list[float]:
    """Embed a single query string."""
    client = _get_genai_client()
    result = client.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=EMBEDDING_DIM,
        ),
    )
    return result.embeddings[0].values


# ── Public API ────────────────────────────────────────────────────────────────

def upsert_chunks(doc_id: str, filename: str, chunks: list[dict]) -> int:
    """
    Embed all chunks and insert them into Supabase `document_chunks` table.
    Returns the number of vectors inserted.
    """
    supabase = _get_client()
    texts = [c["text"] for c in chunks]

    all_vectors: list[dict] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch_texts = texts[i : i + BATCH_SIZE]
        embeddings = _embed_texts(batch_texts)

        for chunk, emb in zip(chunks[i : i + BATCH_SIZE], embeddings):
            all_vectors.append(
                {
                    "doc_id": doc_id,
                    "filename": filename,
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"],
                    "embedding": emb,
                }
            )

    for i in range(0, len(all_vectors), BATCH_SIZE):
        supabase.table("document_chunks").insert(all_vectors[i : i + BATCH_SIZE]).execute()

    logger.info("Upserted %d vectors for doc_id=%s", len(all_vectors), doc_id)
    return len(all_vectors)


def embed_chunks(chunks: list[dict]) -> list[list[float]]:
    """Embed a list of document chunks."""
    texts = [chunk["text"] for chunk in chunks]
    return _embed_texts(texts)


def similarity_search(
    query: str,
    doc_ids: list[str] | None = None,
    top_k: int = 5,
) -> list[dict]:
    """
    Query Supabase (pgvector) for the most relevant chunks using RPC.
    The RPC now returns doc_type and doc_date directly via JOIN with documents table.
    Returns a list of dicts with keys: doc_id, filename, chunk_index, text, score, doc_type, doc_date
    """
    supabase = _get_client()
    query_emb = _embed_query(query)

    rpc_params = {
        "query_embedding": query_emb,
        "match_threshold": -1.0,
        "match_count": top_k,
        "filter_doc_ids": doc_ids if doc_ids else [],
    }

    logger.info("Running similarity search with top_k=%d, filter_doc_ids=%s", top_k, doc_ids)
    response = supabase.rpc("match_document_chunks", rpc_params).execute()
    logger.info("RPC returned %d results", len(response.data))

    results = []
    for match in response.data:
        results.append(
            {
                "doc_id": match.get("doc_id", ""),
                "filename": match.get("filename", ""),
                "chunk_index": int(match.get("chunk_index", 0)),
                "text": match.get("text", ""),
                "score": float(match.get("similarity", 0.0)),
                "doc_type": match.get("doc_type", "unknown"),
                "doc_date": match.get("doc_date", "unknown"),
            }
        )

    # Log unique documents found for debugging
    unique_files = set(r["filename"] for r in results)
    logger.info("Unique documents in results: %s", unique_files)

    return results


def delete_document_vectors(doc_id: str) -> None:
    """Delete all vectors belonging to a document."""
    supabase = _get_client()
    supabase.table("document_chunks").delete().eq("doc_id", doc_id).execute()
    logger.info("Deleted vectors for doc_id=%s", doc_id)