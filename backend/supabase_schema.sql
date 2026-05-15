-- Drop existing index and table
DROP INDEX IF EXISTS idx_document_chunks_embedding;
DROP TABLE IF EXISTS document_chunks;

-- Recreate with 3072 dimensions
CREATE TABLE document_chunks (
    id          BIGSERIAL PRIMARY KEY,
    doc_id      TEXT REFERENCES documents(doc_id) ON DELETE CASCADE,
    filename    TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    text        TEXT NOT NULL,
    embedding   vector(3072)
);

CREATE INDEX idx_document_chunks_embedding
    ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Recreate the search function with new dimension
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(3072),
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
LANGUAGE sql STABLE AS $$
    SELECT
        doc_id, filename, chunk_index, text,
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