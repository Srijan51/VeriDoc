"""
Document processor — extracts raw text from PDF and DOCX files,
then splits the text into overlapping chunks ready for embedding.
"""

import io
import uuid
from typing import Generator

import fitz  # PyMuPDF
from docx import Document as DocxDocument


# ── Constants ─────────────────────────────────────────────────────────────────

CHUNK_SIZE = 800          # characters per chunk
CHUNK_OVERLAP = 150       # overlap between consecutive chunks
SUPPORTED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}


# ── Text extraction ───────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF byte stream using PyMuPDF."""
    text_parts: list[str] = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text_parts.append(page.get_text())
    return "\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract paragraph text from a DOCX byte stream."""
    docx = DocxDocument(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in docx.paragraphs if p.text.strip())


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Decode plain-text file."""
    return file_bytes.decode("utf-8", errors="replace")


def extract_text(file_bytes: bytes, content_type: str) -> str:
    """Dispatch to the correct extractor based on MIME type."""
    file_type = SUPPORTED_TYPES.get(content_type)
    if file_type == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif file_type == "docx":
        return extract_text_from_docx(file_bytes)
    elif file_type == "txt":
        return extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {content_type}")


# ── Chunking ──────────────────────────────────────────────────────────────────

def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[dict]:
    """
    Split *text* into overlapping chunks.

    Returns a list of dicts:
      { "chunk_index": int, "text": str }
    """
    text = text.strip()
    if not text:
        return []

    chunks: list[dict] = []
    start = 0
    idx = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append({"chunk_index": idx, "text": chunk})
        idx += 1
        start += chunk_size - overlap

    return chunks


# ── Public entry-point ────────────────────────────────────────────────────────

def process_document(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    doc_id: str | None = None,
) -> dict:
    """
    Extract text and split into chunks.

    Returns:
    {
        "doc_id": str,
        "filename": str,
        "file_type": str,
        "chunks": [{"chunk_index": int, "text": str}, ...]
    }
    """
    if doc_id is None:
        doc_id = str(uuid.uuid4())

    raw_text = extract_text(file_bytes, content_type)
    chunks = chunk_text(raw_text)

    file_type = SUPPORTED_TYPES.get(content_type, "unknown")

    return {
        "doc_id": doc_id,
        "filename": filename,
        "file_type": file_type,
        "chunks": chunks,
    }
