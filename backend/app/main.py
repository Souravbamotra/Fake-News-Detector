"""
Fake News Detector — FastAPI application entry point.

Startup sequence:
  1. Load environment variables from .env
  2. Configure logging
  3. Build the FastAPI app with CORS middleware
  4. Include all routers
  5. On startup: load + warm up the language model (module-level singleton)
     so the first real request doesn't pay the cold-start penalty.

Running locally:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Production (Render/Railway):
    uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
    (single worker to avoid loading the model multiple times)
"""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env before any other module reads environment variables
load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Application ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Fake News Detector API",
    description=(
        "AI-powered fake news detection tool.\n\n"
        "Accepts plain text, article URLs, screenshot images, and YouTube URLs. "
        "Returns a combined analysis from three independent signals:\n"
        "- **Language model verdict** (DistilRoBERTa fine-tuned for fake-news classification)\n"
        "- **Fact-check lookup** (Google Fact Check Tools API)\n"
        "- **Source credibility** (curated domain list + heuristics)"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Tighten ALLOWED_ORIGIN before submission — never leave as "*" in production.
allowed_origin = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("CORS: allowing origin '%s'", allowed_origin)

# ── Routers ───────────────────────────────────────────────────────────────────
from app.routers import analyze, credibility, extract, factcheck, predict  # noqa: E402

app.include_router(extract.router)
app.include_router(predict.router)
app.include_router(factcheck.router)
app.include_router(credibility.router)
app.include_router(analyze.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"], summary="Health check")
async def health():
    """
    Simple liveness probe.  Returns {"status": "ok"}.
    Used by Render/Railway to confirm the container is up.
    """
    return {"status": "ok"}


# ── Startup event: load language model ────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """
    Load and warm up the language model at startup.

    This runs in the main thread before the server starts accepting
    requests, so the first real call to /predict or /analyze will
    not pay the cold-start penalty of loading the model weights.

    Model: vikram71198/distilroberta-base-finetuned-fake-news-detection
    """
    import asyncio
    from app.services import lm_service

    logger.info("Application starting up — loading language model …")
    # Run the blocking model load in a thread pool to avoid blocking the
    # event loop during startup (uvicorn startup is async).
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lm_service.warm_up)
    logger.info("Startup complete. Ready to accept requests.")
