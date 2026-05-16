-- =============================================================================
-- VeriDoc RLS Fix — Run this in Supabase SQL Editor
-- This ONLY adds the RLS policies without touching existing tables
-- =============================================================================

-- Documents table: allow full CRUD for anon key
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on documents" ON documents;
CREATE POLICY "Allow all on documents" ON documents
    FOR ALL USING (true) WITH CHECK (true);

-- Document chunks table: allow full CRUD for anon key
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on document_chunks" ON document_chunks;
CREATE POLICY "Allow all on document_chunks" ON document_chunks
    FOR ALL USING (true) WITH CHECK (true);

-- Update RPC to use SECURITY DEFINER so it bypasses RLS
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
    similarity float,
    doc_type text,
    doc_date text
)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
    SELECT
        dc.doc_id,
        dc.filename,
        dc.chunk_index,
        dc.text,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        COALESCE(d.doc_type, 'unknown') AS doc_type,
        COALESCE(d.doc_date::text, 'unknown') AS doc_date
    FROM document_chunks dc
    LEFT JOIN documents d ON dc.doc_id = d.doc_id
    WHERE
        1 - (dc.embedding <=> query_embedding) > match_threshold
        AND (
            array_length(filter_doc_ids, 1) IS NULL
            OR dc.doc_id = ANY(filter_doc_ids)
        )
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
$$;
