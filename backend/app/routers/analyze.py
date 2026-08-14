"""
Router: POST /analyze

The combined endpoint that the frontend calls.  Orchestrates:
  1. Extraction (based on input_type)
  2. Language model verdict
  3. Fact-check lookup
  4. Source credibility check (only when a domain is available)

Partial failure tolerance:
  If any individual signal fails, it is marked with {"error": "..."} rather
  than aborting the whole response.  This ensures the frontend always
  gets as much information as possible.

Screenshot uploads:
  Because FastAPI cannot combine a JSON body and a multipart upload in a
  single POST without special handling, screenshot analysis is handled by
  accepting the file as multipart and the input_type as a form field.
  All other input types use a JSON body via AnalyzeRequest.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.models import AnalyzeRequest, AnalyzeResponse
from app.services import credibility_service, factcheck_service, lm_service
from app.services.extractor import ExtractionError, extract_article, extract_screenshot, extract_youtube

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analysis"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _run_lm(text: str) -> dict:
    """Run the language model verdict; return error dict on failure."""
    try:
        return lm_service.predict(text)
    except Exception as exc:
        logger.warning("Language model signal failed: %s", exc)
        return {"error": "Language model unavailable."}


def _run_factcheck(text: str) -> dict:
    """Run the fact-check lookup; return error dict on failure."""
    try:
        return factcheck_service.check(text)
    except Exception as exc:
        logger.warning("Fact-check signal failed: %s", exc)
        return {"found": False, "error": "Fact-check service unavailable."}


def _run_credibility(domain: Optional[str]) -> dict:
    """Run the credibility check; return error dict on failure."""
    try:
        return credibility_service.check(domain)
    except Exception as exc:
        logger.warning("Credibility signal failed: %s", exc)
        return {"domain": domain, "error": "Credibility service unavailable.", "tier": "not_available"}


def _build_response(text: str, domain: Optional[str]) -> dict:
    """
    Run all three signals and assemble the combined response.
    Each signal is independent — failure of one does not block the others.
    """
    lm_result = _run_lm(text)
    fc_result = _run_factcheck(text)
    cred_result = _run_credibility(domain)

    return {
        "extracted_text": text,
        "language_verdict": lm_result,
        "fact_check": fc_result,
        "source_credibility": cred_result,
    }


# ── JSON body endpoint (text / article_url / youtube_url) ────────────────────

@router.post(
    "/analyze",
    summary="Run full analysis on text, article URL, or YouTube URL",
)
async def analyze_endpoint(body: AnalyzeRequest):
    """
    Combined analysis endpoint for non-file inputs.

    Accepts:
      - input_type="text"        → body.text required
      - input_type="article_url" → body.url required
      - input_type="youtube_url" → body.youtube_url required

    For screenshots, use POST /analyze/screenshot (multipart upload).

    Returns a combined result with all three signals.
    Each signal that fails gracefully will include an "error" key
    rather than causing the whole request to fail.
    """
    text: Optional[str] = None
    domain: Optional[str] = None

    if body.input_type == "text":
        if not body.text or len(body.text.strip()) < 10:
            raise HTTPException(status_code=422, detail="Text must be at least 10 characters.")
        text = body.text.strip()

    elif body.input_type == "article_url":
        if not body.url:
            raise HTTPException(status_code=422, detail="'url' field is required for input_type='article_url'.")
        try:
            extracted = extract_article(str(body.url))
        except ExtractionError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except Exception as exc:
            logger.exception("Article extraction failed: %s", exc)
            raise HTTPException(
                status_code=422,
                detail="Couldn't extract this article automatically — try pasting the text directly.",
            )
        text = extracted["text"]
        domain = extracted.get("domain")

    elif body.input_type == "youtube_url":
        if not body.youtube_url:
            raise HTTPException(
                status_code=422, detail="'youtube_url' field is required for input_type='youtube_url'."
            )
        try:
            extracted = extract_youtube(str(body.youtube_url))
        except ExtractionError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except Exception as exc:
            logger.exception("YouTube extraction failed: %s", exc)
            raise HTTPException(
                status_code=422,
                detail="This video has no captions available — transcript extraction isn't supported yet.",
            )
        text = extracted["text"]
        # No domain from YouTube URLs — credibility will be "not_available"
        domain = None

    elif body.input_type == "screenshot":
        raise HTTPException(
            status_code=422,
            detail="Screenshot inputs must be submitted to POST /analyze/screenshot as a multipart upload.",
        )

    else:
        raise HTTPException(status_code=422, detail=f"Unknown input_type: '{body.input_type}'.")

    return _build_response(text, domain)


# ── Multipart endpoint for screenshots ───────────────────────────────────────

@router.post(
    "/analyze/screenshot",
    summary="Run full analysis on a screenshot image",
)
async def analyze_screenshot_endpoint(file: UploadFile = File(...)):
    """
    Upload a screenshot image and run full analysis.

    The image is OCR-processed, then passed through all three signals.
    Source credibility is marked 'not_available' because no domain can
    be inferred from a screenshot.
    """
    content_type = file.content_type or ""
    try:
        file_bytes = await file.read()
    except Exception as exc:
        logger.exception("Failed to read uploaded file: %s", exc)
        raise HTTPException(status_code=400, detail="Failed to read the uploaded file.")

    try:
        extracted = extract_screenshot(file_bytes, content_type)
    except ExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Screenshot OCR failed: %s", exc)
        raise HTTPException(status_code=500, detail="OCR processing failed unexpectedly.")

    text = extracted["text"]
    # Screenshots never have a domain → credibility will be "not_available"
    return _build_response(text, domain=None)
