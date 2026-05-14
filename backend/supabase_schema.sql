-- ============================================================
-- VeriDoc — Supabase Schema
-- Run this once in the Supabase SQL Editor
-- ============================================================

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

CREATE TABLE IF NOT EXISTS documents (
    doc_id      TEXT PRIMARY KEY,
    filename    TEXT        NOT NULL,
    doc_type    TEXT        NOT NULL,
    doc_date    DATE        NOT NULL,
    file_type   TEXT        NOT NULL,          -- pdf | docx | txt
    chunk_count INTEGER     NOT NULL DEFAULT 0,
    size_bytes  INTEGER,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for time-ordered listing
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at
    ON documents (uploaded_at DESC);

-- Table for document chunks and their vectors
CREATE TABLE IF NOT EXISTS document_chunks (
    id          BIGSERIAL PRIMARY KEY,
    doc_id      TEXT REFERENCES documents(doc_id) ON DELETE CASCADE,
    filename    TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    text        TEXT NOT NULL,
    embedding   vector(768)
);

-- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_doc_ids text[] DEFAULT '{}'
)
RETURNS TABLE (
    doc_id text,
    filename text,
    chunk_index int,
    text text,
    similarity float
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        doc_id,
        filename,
        chunk_index,
        text,
        1 - (document_chunks.embedding <=> query_embedding) AS similarity
    FROM document_chunks
    WHERE
        1 - (document_chunks.embedding <=> query_embedding) > match_threshold
        AND (
            array_length(filter_doc_ids, 1) IS NULL
            OR document_chunks.doc_id = ANY(filter_doc_ids)
        )
    ORDER BY document_chunks.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Optional: Enable Row Level Security (recommended for production)
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for service role" ON documents USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for service role" ON document_chunks USING (true) WITH CHECK (true);
