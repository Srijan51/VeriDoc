# VeriDoc Backend

> Enterprise Knowledge Truth Engine — FastAPI + Gemini + Supabase pgvector

---

## Stack

| Layer | Technology |
|---|---|
| API Framework | FastAPI 0.111 |
| AI / Generation | Gemini 1.5 Flash (`google-generativeai`) |
| Embeddings | Google `text-embedding-004` |
| Vector Store | Supabase pgvector (cosine, dim=768) |
| Metadata Store | Supabase (PostgreSQL) |
| Document Parsing | PyMuPDF (PDF), python-docx (DOCX) |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app factory + CORS + routers
│   ├── config.py               # Pydantic settings loaded from .env
│   ├── models/
│   │   └── schemas.py          # Request / Response Pydantic models
│   ├── routers/
│   │   ├── upload.py           # POST /upload
│   │   ├── query.py            # POST /query
│   │   └── documents.py        # GET  /documents
│   └── services/
│       ├── document_processor.py   # Text extraction + chunking
│       ├── embeddings.py         # Supabase pgvector insert + search
│       ├── gemini.py               # Gemini answer generation
│       └── storage.py              # Supabase CRUD
├── run.py                      # Dev server entry point
├── requirements.txt
├── supabase_schema.sql         # Run once in Supabase SQL editor
├── .env.example                # Copy → .env and fill in keys
└── .gitignore
```

---

## Quick Start

### 1. Clone & enter directory
```bash
git clone <repo-url>
cd backend
```

### 2. Create virtual environment
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
```bash
cp .env.example .env
# Edit .env and fill in your API keys
```

Required keys in `.env`:

```env
GEMINI_API_KEY=...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=...
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

### 5. Set up Supabase table & pgvector
Open the **Supabase SQL Editor** and run the contents of `supabase_schema.sql`.
This will enable the `vector` extension, create the tables, and add the search function.

### 6. Start the server
```bash
python run.py
# or
uvicorn app.main:app --reload --port 8000
```

Server runs at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

---

## API Reference

### `POST /upload`
Upload a PDF, DOCX, or TXT file for indexing.

**Request** — `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | PDF, DOCX, or TXT |

**Response** `201`
```json
{
  "doc_id": "uuid",
  "filename": "report.pdf",
  "file_type": "pdf",
  "chunk_count": 42,
  "message": "Document processed and indexed successfully"
}
```

---

### `POST /query`
Ask a natural-language question against your indexed documents.

**Request** — `application/json`
```json
{
  "question": "What is the refund policy?",
  "doc_ids": [],          // empty = search all docs
  "top_k": 5
}
```

**Response** `200`
```json
{
  "question": "What is the refund policy?",
  "answer": "According to [Source 1], the refund policy states...",
  "sources": [
    {
      "doc_id": "uuid",
      "filename": "policy.pdf",
      "chunk_index": 3,
      "text": "...chunk text...",
      "score": 0.91
    }
  ],
  "model": "gemini-1.5-flash"
}
```

---

### `GET /documents`
List all uploaded documents with metadata.

**Response** `200`
```json
{
  "documents": [
    {
      "doc_id": "uuid",
      "filename": "report.pdf",
      "file_type": "pdf",
      "chunk_count": 42,
      "uploaded_at": "2026-05-14T07:00:00Z",
      "size_bytes": 204800
    }
  ],
  "total": 1
}
```

---

### `GET /health`
```json
{ "status": "ok", "service": "veridoc-api" }
```

---

## Deployment Notes

- Set `ENVIRONMENT=production` in your hosting environment.
- Add your Vercel frontend URL to `ALLOWED_ORIGINS`.
- Supabase tables, vector extension, and RPC functions must be created manually via `supabase_schema.sql`.
