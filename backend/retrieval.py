
# Query Pinecone for the top 8 most similar chunks to a query embedding.
# Filter by doc_ids list if provided (use Pinecone metadata filter).
# Return list of dicts: { text, source, doc_type, doc_date, chunk_index, score }
def retrieve_chunks(query_embedding: list[float], doc_ids: list[str] = None, top_k: int = 8) -> list[dict]:

# Group retrieved chunks by their source document.
# Return dict keyed by source filename, value is list of chunk texts from that source.
def group_by_source(chunks: list[dict]) -> dict[str, list[str]]: