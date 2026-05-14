"""
VeriDoc — Enterprise Knowledge Truth Engine
FastAPI application entry point.
"""

import logging
import tempfile
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import query, documents
from app.services.document_processor import SUPPORTED_TYPES, extract_text, chunk_text
from app.services.embeddings import embed_chunks, upsert_chunks
from app.services.storage import store_in_supabase

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("🚀 VeriDoc backend starting (env=%s)", settings.environment)
    logger.info("📌 Allowed origins: %s", settings.origins_list)
    yield
    logger.info("🛑 VeriDoc backend shutting down")


# ── App factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="VeriDoc API",
        description=(
            "Enterprise Knowledge Truth Engine — upload documents, "
            "query them with natural language, and get grounded, cited answers."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(query.router)
    app.include_router(documents.router)

    @app.post(
        "/upload",
        status_code=status.HTTP_201_CREATED,
        summary="Upload a document for indexing",
    )
    async def upload_document(
        file: UploadFile = File(...),
        doc_type: str = Form(...),
        doc_date: str = Form(...),
    ) -> dict:
        allowed_doc_types = {"policy", "handbook", "sop", "memo"}
        if doc_type not in allowed_doc_types:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"doc_type must be one of: {', '.join(sorted(allowed_doc_types))}",
            )

        try:
            datetime.strptime(doc_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="doc_date must be formatted as YYYY-MM-DD.",
            )

        content_type = file.content_type or ""
        if content_type not in SUPPORTED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(
                    f"Unsupported file type '{content_type}'. "
                    "Accepted types: PDF, DOCX, TXT."
                ),
            )

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        doc_id = str(uuid.uuid4())
        filename = Path(file.filename).name if file.filename else f"{doc_id}.bin"
        tmp_dir = Path(tempfile.gettempdir())
        tmp_dir.mkdir(parents=True, exist_ok=True)
        tmp_path = tmp_dir / f"{doc_id}_{filename}"

        try:
            tmp_path.write_bytes(file_bytes)

            try:
                raw_text = extract_text(file_bytes, content_type)
            except ValueError as exc:
                logger.exception("Failed to extract text")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Could not extract text from document: {exc}",
                )

            chunks = chunk_text(raw_text)
            if not chunks:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No extractable text found in the document.",
                )
            
            base_metadata = {
                "filename": filename,
                "doc_type": doc_type,
                "doc_date": doc_date,
            }

            try:
                store_in_supabase(
                    doc_id=doc_id,
                    chunks=chunks,
                    base_metadata=base_metadata,
                    file_type=SUPPORTED_TYPES[content_type],
                    chunk_count=len(chunks),
                    size_bytes=len(file_bytes),
                )
            except Exception as exc:
                logger.exception("Failed to persist metadata in Supabase")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Metadata persistence failed: {exc}",
                )
            

            try:
                upsert_chunks(
                    doc_id=doc_id,
                    filename=filename,
                    chunks=chunks,
                )
            except Exception as exc:
                logger.exception("Failed to index document vectors")
                print("REAL ERROR:", repr(exc))
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Vector indexing failed: {exc}",
                )
            
            return {
                "filename": filename,
                "chunk_count": len(chunks),
                "status": "indexed",
            }
        finally:
            try:
                if tmp_path.exists():
                    tmp_path.unlink()
            except Exception:
                logger.warning("Could not remove temporary file %s", tmp_path)

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["health"], summary="Health check")
    async def health() -> JSONResponse:
        return JSONResponse({"status": "ok", "service": "veridoc-api"})

    @app.get("/models", tags=["health"], summary="List available Gemini models")
    async def list_models() -> JSONResponse:
        """List available Gemini models for debugging API key issues."""
        try:
            from google import genai
            settings = get_settings()
            client = genai.Client(api_key=settings.gemini_api_key)
            models = list(client.models.list())
            model_names = [m.name for m in models]
            return JSONResponse({
                "available_models": model_names,
                "count": len(model_names),
            })
        except Exception as exc:
            logger.exception("Failed to list models")
            return JSONResponse(
                {
                    "error": str(exc),
                    "detail": "Could not list available Gemini models",
                },
                status_code=503,
            )

    @app.get("/", tags=["health"], include_in_schema=False)
    async def root() -> JSONResponse:
        return JSONResponse(
            {
                "service": "VeriDoc API",
                "version": "1.0.0",
                "docs": "/docs",
                "health": "/health",
                "models": "/models",
            }
        )

    return app


app = create_app()
