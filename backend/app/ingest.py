import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from the .env file
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# Extract text from uploaded file. Support PDF (PyMuPDF), DOCX (python-docx), and TXT.
# Return plain string of all extracted text.
def extract_text(file_path: str, file_type: str) -> str:

# Split text into chunks of 512 tokens with 50-token overlap using LangChain RecursiveCharacterTextSplitter.
# Return list of chunk strings.
def chunk_text(text: str) -> list[str]:

# Generate embeddings for a list of text chunks using Gemini text-embedding-004 model.
# Batch in groups of 20 to respect rate limits.
# Return list of embedding vectors (list of floats).
def embed_chunks(chunks: list[str]) -> list[list[float]]:

# Insert chunk text, embeddings, and metadata into the Supabase 'documents' table.
# Prepare a list of dictionaries, each containing: 'content' (chunk text), 'embedding' (vector), and 'metadata' (dict with filename, doc_type, doc_date, chunk_index).
# Use the supabase-py client to insert the list. Return the number of rows inserted.
def store_in_supabase(chunks: list[str], embeddings: list[list[float]], base_metadata: dict) -> int:

def store_in_supabase(chunks: list[str], embeddings: list[list[float]], base_metadata: dict) -> int:
    """
    Inserts chunk text, embeddings, and metadata into the Supabase 'documents' table.
    """
    data_to_insert = []
    
    # Loop through all chunks and package them into a list of dictionaries
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        # Copy base metadata and add the specific chunk index
        chunk_metadata = base_metadata.copy()
        chunk_metadata["chunk_index"] = i
        
        data_to_insert.append({
            "content": chunk,
            "embedding": embedding,
            "metadata": chunk_metadata
        })
    
    # Execute the insert query to Supabase
    response = supabase.table("documents").insert(data_to_insert).execute()
    
    # Return how many rows were successfully inserted
    return len(response.data)