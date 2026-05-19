# VeriDoc

VeriDoc is an Enterprise Knowledge Truth Engine that helps organizations detect contradictions, outdated policies, and inconsistencies across large document collections. It combines document ingestion, vector search, and generative AI to surface evidence-backed conflicts and provide actionable summaries for policy review.

## Project Summary

- Purpose: Continuously analyze an organization's documents (policies, manuals, guides, reports) to detect conflicting statements, policy drift, and high-impact inconsistencies. VeriDoc highlights sources, severity, and suggested resolutions so teams can efficiently triage and fix issues.
- Audience: Compliance teams, knowledge managers, legal reviewers, and product teams who need to maintain a single source of truth across many documents.

## Key Features

- Document ingestion: PDF, DOCX, and plain text extraction with chunking for granular retrieval.
- Vector search: Store embeddings in Supabase pgvector and perform fast semantic retrieval.
- Contradiction scanning: Automated scans that surface conflicting claims and rank them by severity and confidence.
- Source attribution: Each signal links back to document chunks with provenance and relevance scores.
- One-click resolve actions: UI hooks to mark conflicts resolved or create tasks for reviewers.
- Targeted search: Run focused scans against selected documents or subsets.
- Extensible model layer: Pluggable generation and embedding backends (Gemini / Google embeddings by default).

## Architecture & Tech Stack

- API: FastAPI (Python)
- Frontend: Next.js (React, TypeScript)
- Embeddings: Google `text-embedding-004` (configurable)
- Vector store & Metadata: Supabase (PostgreSQL + pgvector)
- Document parsing: PyMuPDF, python-docx
- Hosting / Deployment: Designed for environment-variable based deploys (Vercel, Azure, etc.)

## Project Structure

```
.
├── backend/            # FastAPI service, ingestion, embeddings, Supabase integration
│   ├── app/
│   ├── run.py
│   └── README.md       # Backend-specific run & setup instructions

├── frontend/           # Next.js app: UI for uploads, scans, contradictions
│   ├── app/
│   └── README.md       # Frontend-specific run & setup instructions

├── ACTION_ITEMS.md
├── INTEGRATION_COMPLETE.md
├── QUICK_START.md
└── README.md           # This file: project overview, features, structure
```

## Where to find run & deployment instructions

Run and deployment steps live inside the service folders:

- See [backend/README.md](backend/README.md) for backend setup and `uvicorn` instructions.
- See [frontend/README.md](frontend/README.md) for frontend development and environment notes.

If you'd like I can expand any section (architecture diagram, data-flow, or component responsibilities).

