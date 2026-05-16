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
    user_id: str | None = None,
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
    if user_id:
        row["user_id"] = user_id
    response = client.table("documents").insert(row).execute()
    logger.info("Saved metadata for doc_id=%s (user=%s)", doc_id, user_id)
    return response.data[0] if response.data else row


def get_all_documents(user_id: str | None = None) -> list[dict]:
    """
    Fetch documents ordered by upload time (newest first).
    If user_id is provided, only return documents for that user.
    Selects only the columns needed by the frontend for performance.
    """
    client = _get_client()
    query = client.table("documents").select(
        "doc_id, filename, file_type, chunk_count, uploaded_at, size_bytes"
    )
    if user_id:
        query = query.eq("user_id", user_id)
    response = query.order("uploaded_at", desc=True).execute()
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
    user_id: str | None = None,
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
    if user_id:
        row["user_id"] = user_id
    response = client.table("documents").insert(row).execute()
    logger.info("Stored document metadata for doc_id=%s (user=%s)", doc_id, user_id)
    return response.data[0] if response.data else row


# ── File Storage (Supabase Storage Bucket) ────────────────────────────────────

STORAGE_BUCKET = "documents"


def upload_file_to_storage(
    user_id: str,
    doc_id: str,
    filename: str,
    file_bytes: bytes,
    content_type: str,
) -> str:
    """
    Upload the original file to Supabase Storage.
    Returns the storage path (used to generate signed URLs later).
    """
    client = _get_client()
    file_path = f"{user_id}/{doc_id}/{filename}"

    client.storage.from_(STORAGE_BUCKET).upload(
        path=file_path,
        file=file_bytes,
        file_options={"content-type": content_type},
    )

    logger.info("Uploaded file to storage: %s", file_path)
    return file_path


def get_file_signed_url(file_path: str, expires_in: int = 3600) -> str:
    """
    Generate a time-limited signed URL for a file in Supabase Storage.
    Default expiry: 1 hour (3600 seconds).
    """
    client = _get_client()
    result = client.storage.from_(STORAGE_BUCKET).create_signed_url(
        path=file_path,
        expires_in=expires_in,
    )

    if result and "signedURL" in result:
        return result["signedURL"]

    # Fallback for different response shapes
    if isinstance(result, dict) and "signedUrl" in result:
        return result["signedUrl"]

    raise ValueError(f"Could not generate signed URL for {file_path}")


def update_document_file_path(doc_id: str, file_path: str) -> None:
    """Update the file_path column for a document."""
    client = _get_client()
    client.table("documents").update({"file_path": file_path}).eq("doc_id", doc_id).execute()
    logger.info("Updated file_path for doc_id=%s", doc_id)

