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

# ── Embedding dimension for text-embedding-004 ──────────────────────────────────────────────────────────
EMBEDDING_DIM = 768
EMBED_MODEL = "text-embedding-004"
BATCH_SIZE = 50   # vectors per upsert batch


# ── Lazy singletons ───────────────────────────────────────────────────────────

_genai_client: genai.Client | None = None


def _get_genai_client() -> genai.Client:
    global _genai_client
    if _genai_client is None:
        settings = get_settings()
        _genai_client = genai.Client(api_key=settings.gemini_api_key)
    return _genai_client


# ── Helpers ───────────────────────────────────────────────────────────────────

def _embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings using Google's embedding API."""
    client = _get_genai_client()
    result = client.models.embed_content(
        model=EMBED_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
    )
    return [embedding.values for embedding in result.embeddings]


def _embed_query(text: str) -> list[float]:
    """Embed a single query string."""
    client = _get_genai_client()
    result = client.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    return result.embeddings[0].values


# ── Public API ────────────────────────────────────────────────────────────────

def upsert_chunks(doc_id: str, filename: str, chunks: list[dict]) -> int:
    """
    Embed all chunks and insert them into Supabase `document_chunks` table.

    Metadata stored: doc_id, filename, chunk_index, text.

    Returns the number of vectors inserted.
    """
    supabase = _get_client()
    texts = [c["text"] for c in chunks]

    all_vectors: list[dict] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch_texts = texts[i : i + BATCH_SIZE]
        embeddings = _embed_texts(batch_texts)

        for j, (chunk, emb) in enumerate(zip(chunks[i:], embeddings)):
            chunk_idx = chunk["chunk_index"]
            all_vectors.append(
                {
                    "doc_id": doc_id,
                    "filename": filename,
                    "chunk_index": chunk_idx,
                    "text": chunk["text"],
                    "embedding": emb,
                }
            )

    # Insert in batches
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

    Args:
        query:   Natural-language question.
        doc_ids: Optional list of doc_ids to restrict search to.
        top_k:   Number of results to return.

    Returns a list of dicts with keys:
        doc_id, filename, chunk_index, text, score
    """
    supabase = _get_client()
    query_emb = _embed_query(query)

    rpc_params = {
        "query_embedding": query_emb,
        "match_threshold": 0.0,
        "match_count": top_k,
        "filter_doc_ids": doc_ids if doc_ids else [],
    }

    response = supabase.rpc("match_document_chunks", rpc_params).execute()
    
    results = []
    for match in response.data:
        results.append(
            {
                "doc_id": match.get("doc_id", ""),
                "filename": match.get("filename", ""),
                "chunk_index": int(match.get("chunk_index", 0)),
                "text": match.get("text", ""),
                "score": float(match.get("similarity", 0.0)),
            }
        )

    return results


def delete_document_vectors(doc_id: str) -> None:
    """Delete all vectors belonging to a document. Handled automatically via ON DELETE CASCADE in Postgres if we delete the document, but this gives manual control."""
    supabase = _get_client()
    supabase.table("document_chunks").delete().eq("doc_id", doc_id).execute()
    logger.info("Deleted vectors for doc_id=%s", doc_id)
