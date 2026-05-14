-- ============================================================
-- VeriDoc — Supabase Schema
-- Run this once in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    doc_id      TEXT PRIMARY KEY,
    filename    TEXT        NOT NULL,
    file_type   TEXT        NOT NULL,          -- pdf | docx | txt
    chunk_count INTEGER     NOT NULL DEFAULT 0,
    size_bytes  INTEGER,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for time-ordered listing
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at
    ON documents (uploaded_at DESC);

-- Optional: Enable Row Level Security (recommended for production)
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for service role" ON documents
--     USING (true) WITH CHECK (true);
