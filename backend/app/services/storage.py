"""
Supabase storage service — persists document metadata in the
`documents` table and provides CRUD helpers for the API layer.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from supabase import create_client, Client

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: Client | None = None

# Expected table DDL (run once in Supabase SQL editor):
#
#   CREATE TABLE IF NOT EXISTS documents (
#     doc_id      TEXT PRIMARY KEY,
#     filename    TEXT NOT NULL,
#     doc_type    TEXT NOT NULL,
#     doc_date    DATE NOT NULL,
#     file_type   TEXT NOT NULL,
#     chunk_count INTEGER NOT NULL DEFAULT 0,
#     size_bytes  INTEGER,
#     uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
#   );


def _get_client() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Public API ────────────────────────────────────────────────────────────────

def save_document_metadata(
    doc_id: str,
    filename: str,
    file_type: str,
    chunk_count: int,
    size_bytes: int | None = None,
) -> dict:
    """
    Insert a new document record.

    Returns the inserted row as a dict.
    """
    client = _get_client()
    row = {
        "doc_id": doc_id,
        "filename": filename,
        "file_type": file_type,
        "chunk_count": chunk_count,
        "size_bytes": size_bytes,
        "uploaded_at": _now_iso(),
    }
    response = client.table("documents").insert(row).execute()
    logger.info("Saved metadata for doc_id=%s", doc_id)
    return response.data[0] if response.data else row


def get_all_documents() -> list[dict]:
    """
    Fetch all documents ordered by upload time (newest first).
    """
    client = _get_client()
    response = (
        client.table("documents")
        .select("*")
        .order("uploaded_at", desc=True)
        .execute()
    )
    return response.data or []


def get_document_by_id(doc_id: str) -> dict | None:
    """
    Fetch a single document record by its ID.
    Returns None if not found.
    """
    client = _get_client()
    response = (
        client.table("documents")
        .select("*")
        .eq("doc_id", doc_id)
        .single()
        .execute()
    )
    return response.data


def delete_document_metadata(doc_id: str) -> None:
    """Remove a document record from Supabase."""
    client = _get_client()
    client.table("documents").delete().eq("doc_id", doc_id).execute()
    logger.info("Deleted metadata for doc_id=%s", doc_id)


def store_in_supabase(
    doc_id: str,
    chunks: list[dict],
    base_metadata: dict,
    file_type: str,
    chunk_count: int,
    size_bytes: int | None = None,
) -> dict:
    """Persist document metadata into Supabase."""
    client = _get_client()
    row = {
        "doc_id": doc_id,
        "filename": base_metadata.get("filename"),
        "doc_type": base_metadata.get("doc_type"),
        "doc_date": base_metadata.get("doc_date"),
        "file_type": file_type,
        "chunk_count": chunk_count,
        "size_bytes": size_bytes,
        "uploaded_at": _now_iso(),
    }
    response = client.table("documents").insert(row).execute()
    logger.info("Stored document metadata for doc_id=%s", doc_id)
    return response.data[0] if response.data else row
