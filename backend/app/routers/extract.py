"""
Router: /extract/*

Three extraction sub-endpoints:
  POST /extract/article      — article URL → clean text via trafilatura
  POST /extract/screenshot   — image upload → text via OCR
  POST /extract/youtube      — YouTube URL → transcript text
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.models import (
    ArticleExtractRequest,
    ArticleExtractResponse,
    ScreenshotExtractResponse,
    YoutubeExtractRequest,
    YoutubeExtractResponse,
)
from app.services.extractor import ExtractionError, extract_article, extract_screenshot, extract_youtube

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/extract", tags=["Extraction"])


# ── Article ───────────────────────────────────────────────────────────────────

@router.post(
    "/article",
    response_model=ArticleExtractResponse,
    summary="Extract article text from a URL",
)
async def extract_article_endpoint(body: ArticleExtractRequest):
    """
    Fetch and extract clean text from an article URL using trafilatura.

    Returns the article text, title, and source domain.
    If extraction fails (paywall, JS-heavy site, blocked scraper),
    returns a clear error rather than crashing.
    """
    try:
        result = extract_article(str(body.url))
    except ExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error during article extraction: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Couldn't extract this article automatically — try pasting the text directly.",
        )
    return result


# ── Screenshot ────────────────────────────────────────────────────────────────

@router.post(
    "/screenshot",
    response_model=ScreenshotExtractResponse,
    summary="Extract text from a screenshot via OCR",
)
async def extract_screenshot_endpoint(file: UploadFile = File(...)):
    """
    Accept an image upload (PNG, JPEG, WebP, TIFF) and run OCR to extract text.

    Preprocessing steps applied before OCR:
      - Grayscale conversion
      - Upscaling small images to ≥1000px on shortest side
      - Contrast boost (×2)
      - Sharpening filter

    No domain info is available from a screenshot — the credibility
    check will be skipped downstream for this input type.
    """
    content_type = file.content_type or ""
    try:
        file_bytes = await file.read()
    except Exception as exc:
        logger.exception("Failed to read uploaded file: %s", exc)
        raise HTTPException(status_code=400, detail="Failed to read the uploaded file.")

    try:
        result = extract_screenshot(file_bytes, content_type)
    except ExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error during screenshot OCR: %s", exc)
        raise HTTPException(status_code=500, detail="OCR processing failed unexpectedly.")

    return result


# ── YouTube ───────────────────────────────────────────────────────────────────

@router.post(
    "/youtube",
    response_model=YoutubeExtractResponse,
    summary="Extract transcript from a YouTube video",
)
async def extract_youtube_endpoint(body: YoutubeExtractRequest):
    """
    Pull the caption transcript from a YouTube video using youtube-transcript-api.

    Important constraints:
      - Only works for videos that have existing captions (auto or manual).
      - Audio transcription (Whisper) is NOT attempted here — it's too heavy
        for free-tier hosting. This is a noted future enhancement.
      - If no captions exist, returns a clear error message.
    """
    try:
        result = extract_youtube(str(body.url))
    except ExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error during YouTube extraction: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="This video has no captions available — transcript extraction isn't supported yet.",
        )
    return result
