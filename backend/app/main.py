"""
VeriDoc — Enterprise Knowledge Truth Engine
FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import upload, query, documents

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
    app.include_router(upload.router)
    app.include_router(query.router)
    app.include_router(documents.router)

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["health"], summary="Health check")
    async def health() -> JSONResponse:
        return JSONResponse({"status": "ok", "service": "veridoc-api"})

    @app.get("/", tags=["health"], include_in_schema=False)
    async def root() -> JSONResponse:
        return JSONResponse(
            {
                "service": "VeriDoc API",
                "version": "1.0.0",
                "docs": "/docs",
                "health": "/health",
            }
        )

    return app


app = create_app()
