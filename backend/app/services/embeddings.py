"""
Pinecone service — upserts document chunk embeddings and performs
similarity search using Google's text-embedding-004 model.
"""

from __future__ import annotations

import time
import logging
from typing import Any

import google.generativeai as genai
from pinecone import Pinecone, ServerlessSpec

from app.config import get_settings

logger = logging.getLogger(__name__)

# ── Embedding dimension for text-embedding-004 ────────────────────────────────
EMBEDDING_DIM = 768
EMBED_MODEL = "models/text-embedding-004"
BATCH_SIZE = 50   # vectors per upsert batch


# ── Lazy singletons ───────────────────────────────────────────────────────────

_pc: Pinecone | None = None
_index = None


def _get_pinecone_index():
    global _pc, _index
    if _index is not None:
        return _index

    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)

    _pc = Pinecone(api_key=settings.pinecone_api_key)

    existing = [i.name for i in _pc.list_indexes()]
    if settings.pinecone_index not in existing:
        logger.info("Creating Pinecone index '%s'…", settings.pinecone_index)
        _pc.create_index(
            name=settings.pinecone_index,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        # Wait until ready
        while not _pc.describe_index(settings.pinecone_index).status["ready"]:
            time.sleep(1)

    _index = _pc.Index(settings.pinecone_index)
    return _index


# ── Helpers ───────────────────────────────────────────────────────────────────

def _embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings using Google's embedding API."""
    result = genai.embed_content(
        model=EMBED_MODEL,
        content=texts,
        task_type="retrieval_document",
    )
    return result["embedding"]


def _embed_query(text: str) -> list[float]:
    """Embed a single query string."""
    result = genai.embed_content(
        model=EMBED_MODEL,
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]


# ── Public API ────────────────────────────────────────────────────────────────

def upsert_chunks(doc_id: str, filename: str, chunks: list[dict]) -> int:
    """
    Embed all chunks and upsert into Pinecone.

    Each vector ID is  ``{doc_id}#{chunk_index}``.
    Metadata stored: doc_id, filename, chunk_index, text (truncated to 512 chars).

    Returns the number of vectors upserted.
    """
    index = _get_pinecone_index()
    texts = [c["text"] for c in chunks]

    all_vectors: list[dict] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch_texts = texts[i : i + BATCH_SIZE]
        embeddings = _embed_texts(batch_texts)

        for j, (chunk, emb) in enumerate(zip(chunks[i:], embeddings)):
            chunk_idx = chunk["chunk_index"]
            all_vectors.append(
                {
                    "id": f"{doc_id}#{chunk_idx}",
                    "values": emb,
                    "metadata": {
                        "doc_id": doc_id,
                        "filename": filename,
                        "chunk_index": chunk_idx,
                        "text": chunk["text"][:512],
                    },
                }
            )

    # Upsert in batches
    for i in range(0, len(all_vectors), BATCH_SIZE):
        index.upsert(vectors=all_vectors[i : i + BATCH_SIZE])

    logger.info("Upserted %d vectors for doc_id=%s", len(all_vectors), doc_id)
    return len(all_vectors)


def similarity_search(
    query: str,
    doc_ids: list[str] | None = None,
    top_k: int = 5,
) -> list[dict]:
    """
    Query Pinecone for the most relevant chunks.

    Args:
        query:   Natural-language question.
        doc_ids: Optional list of doc_ids to restrict search to.
        top_k:   Number of results to return.

    Returns a list of dicts with keys:
        doc_id, filename, chunk_index, text, score
    """
    index = _get_pinecone_index()
    query_emb = _embed_query(query)

    filter_expr: dict | None = None
    if doc_ids:
        filter_expr = {"doc_id": {"$in": doc_ids}}

    response = index.query(
        vector=query_emb,
        top_k=top_k,
        include_metadata=True,
        filter=filter_expr,
    )

    results = []
    for match in response.matches:
        meta = match.metadata or {}
        results.append(
            {
                "doc_id": meta.get("doc_id", ""),
                "filename": meta.get("filename", ""),
                "chunk_index": int(meta.get("chunk_index", 0)),
                "text": meta.get("text", ""),
                "score": float(match.score),
            }
        )

    return results


def delete_document_vectors(doc_id: str) -> None:
    """Delete all vectors belonging to a document."""
    index = _get_pinecone_index()
    # Pinecone supports delete by prefix only in some tiers; use metadata filter
    index.delete(filter={"doc_id": {"$eq": doc_id}})
    logger.info("Deleted vectors for doc_id=%s", doc_id)
