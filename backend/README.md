# VeriDoc Backend

> Enterprise Knowledge Truth Engine — FastAPI + Gemini + Supabase pgvector

🎛️  What this service does

VeriDoc's backend is responsible for ingesting documents, extracting and chunking text, generating embeddings, storing vectors and metadata in Supabase, and orchestrating contradiction scans. It exposes a small, well-documented HTTP API used by the frontend to upload files, trigger scans, and retrieve results with provenance.

✨ Key backend responsibilities

- Ingest & parse PDFs, DOCX, and TXT into searchable chunks
- Generate embeddings and persist them in a `pgvector` index
- Run scan jobs that aggregate retrieval results and surface contradictions
- Provide APIs for fetching documents, running targeted scans, and health checks
- Minimal orchestration for background jobs (scan lifecycle)

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

---

## Quick overview: flow

1. Client uploads a document via `POST /upload`.
2. Backend extracts text and chunks the document.
3. Chunks are embedded and stored in Supabase `pgvector`.
4. A scan job retrieves relevant chunks and runs contradiction detection.
5. Results are stored and surfaced via `GET /documents` and custom scan endpoints.
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
SUPABASE_KEY=...   # service role key required for account deletion
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

> Supabase email templates are managed in the Supabase Dashboard: **Authentication → Email Templates**. Keep custom HTML there instead of in this README.

## Environment & Secrets

- Copy `.env.example` to `.env` and fill in keys before running locally. Do not commit files containing secrets.
- If you use a local-only env file such as `.env.local`, keep it out of version control (it should be listed in `.gitignore`). To remove it from git tracking if it was committed accidentally:

```bash
git rm --cached backend/.env.local
```

Refer to the root README for full-stack development and deployment notes.

---

## Operational notes

- Background jobs: scans can be long-running. In production, run scan workers separately or use a job queue.
- Rate limits: be mindful of embedding and generation API quotas; batch embeddings where possible.
- Monitoring: add basic Prometheus metrics or AppInsights to track scan durations and queue sizes.

## Troubleshooting

- 500s on upload: ensure file parsers (PyMuPDF, python-docx) are installed and the uploaded file is valid.
- Missing vectors: confirm Supabase `pgvector` extension is enabled and `supabase_schema.sql` was applied.
- Auth errors: verify `GEMINI_API_KEY` and `SUPABASE_KEY` are set in `.env`.

## Contributing

- Open issues for bugs or feature requests, include sample documents when possible.
- For code changes, run tests (if any), open a PR against `main`, and include a short description of the change and why.

---
© VeriDoc Team

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


