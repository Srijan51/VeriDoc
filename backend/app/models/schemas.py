from pydantic import BaseModel, Field
from typing import Optional, Literal
import uuid
from datetime import datetime


# ── Upload ────────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    chunk_count: int
    message: str = "Document processed and indexed successfully"


# ── Query ─────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="Natural-language question")
    doc_ids: list[str] = Field(default=[], description="Scope query to specific document IDs (empty = all docs)")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of context chunks to retrieve")


class SourceChunk(BaseModel):
    doc_id: str
    filename: str
    chunk_index: int
    text: str
    score: float


class QueryResponse(BaseModel):
    question: str
    answer: Optional[str] = None
    sources: list[SourceChunk]
    model: str = "gemini-1.5-flash"


class Citation(BaseModel):
    source: str
    doc_type: str
    doc_date: str
    claim: str


class Contradiction(BaseModel):
    topic: str
    source_a: str
    claim_a: str
    source_b: str
    claim_b: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    authoritative_source: str
    reason: str


class AuditQueryResponse(BaseModel):
    answer: str
    confidence_score: float
    citations: list[Citation]
    contradictions: list[Contradiction]
    no_answer_found: bool
    no_answer_reason: Optional[str] = None


# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentMeta(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    chunk_count: int
    uploaded_at: datetime
    size_bytes: Optional[int] = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentMeta]
    total: int


# ── Error ─────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
