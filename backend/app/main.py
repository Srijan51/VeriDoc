"""
VeriDoc — Enterprise Knowledge Truth Engine
FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import query, documents, upload
from app.services.storage import get_all_documents, delete_document_metadata, delete_file_from_storage
from app.services.embeddings import delete_document_vectors
from app.services.auth import get_current_user, delete_user_account, email_exists

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def _delete_all_user_documents(user_id: str) -> int:
    rows = get_all_documents(user_id=user_id)
    deleted = 0

    for row in rows:
        doc_id = row["doc_id"]
        file_path = row.get("file_path")
        try:
            delete_document_vectors(doc_id)
        except Exception:
            logger.warning("Failed to delete vectors for doc_id=%s", doc_id)
        if file_path:
            try:
                delete_file_from_storage(file_path)
            except Exception:
                logger.warning("Failed to delete storage file for doc_id=%s", doc_id)
        try:
            delete_document_metadata(doc_id)
        except Exception:
            logger.warning("Failed to delete metadata for doc_id=%s", doc_id)
        deleted += 1

    return deleted


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
    app.include_router(upload.router)
    app.include_router(query.router)
    app.include_router(documents.router)

    # ── Delete all documents ──────────────────────────────────────────────────
    @app.delete(
        "/documents",
        status_code=status.HTTP_200_OK,
        summary="Delete all documents for the current user",
        tags=["documents"],
    )
    async def delete_all_documents(request: Request) -> dict:
        """Remove all documents and their associated vector embeddings for the authenticated user."""
        user_id = get_current_user(request)
        try:
            deleted = _delete_all_user_documents(user_id)
            return {"deleted": deleted, "message": f"Deleted {deleted} document(s)"}
        except Exception as exc:
            logger.exception("Failed to delete all documents")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to delete documents: {exc}",
            )

    @app.delete(
        "/account",
        status_code=status.HTTP_200_OK,
        summary="Delete the current user's account and data",
        tags=["auth"],
    )
    async def delete_account(request: Request) -> dict:
        """Delete the authenticated user's documents and Supabase auth account."""
        user_id = get_current_user(request)
        deleted_documents = _delete_all_user_documents(user_id)
        delete_user_account(user_id)
        return {
            "deleted_documents": deleted_documents,
            "message": "Account deleted successfully",
        }

    @app.get(
        "/auth/email-exists",
        status_code=status.HTTP_200_OK,
        summary="Check whether an email already has an account",
        tags=["auth"],
    )
    async def check_email_exists(email: str) -> dict:
        exists = email_exists(email)
        return {"exists": exists}

    # ── Delete single document ────────────────────────────────────────────────
    @app.delete(
        "/documents/{doc_id}",
        status_code=status.HTTP_200_OK,
        summary="Delete a single document and its vectors",
        tags=["documents"],
    )
    async def delete_single_document(doc_id: str, request: Request) -> dict:
        """Remove a specific document and its associated vector embeddings."""
        user_id = get_current_user(request)
        try:
            # Verify the document belongs to the current user
            from app.services.storage import get_document_by_id
            doc = get_document_by_id(doc_id)
            if not doc or doc.get("user_id") != user_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Document not found",
                )
            try:
                delete_document_vectors(doc_id)
            except Exception:
                logger.warning("Failed to delete vectors for doc_id=%s", doc_id)
            file_path = doc.get("file_path")
            if file_path:
                try:
                    delete_file_from_storage(file_path)
                except Exception:
                    logger.warning("Failed to delete storage file for doc_id=%s", doc_id)
            delete_document_metadata(doc_id)
            return {"deleted": 1, "message": f"Deleted document {doc_id}"}
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Failed to delete document %s", doc_id)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to delete document: {exc}",
            )

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["health"], summary="Health check")
    async def health() -> JSONResponse:
        return JSONResponse({"status": "ok", "service": "veridoc-api"})

    @app.get("/models", tags=["health"], summary="List configured model")
    async def list_models() -> JSONResponse:
        """Return the configured generation model (Groq) for debugging."""
        try:
            settings = get_settings()
            model = settings.groq_model
            return JSONResponse({
                "available_models": [model],
                "count": 1,
            })
        except Exception as exc:
            logger.exception("Failed to read configured model")
            return JSONResponse(
                {
                    "error": str(exc),
                    "detail": "Could not read configured model",
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
