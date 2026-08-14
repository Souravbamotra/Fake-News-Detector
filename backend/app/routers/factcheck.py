"""
Router: POST /factcheck

Search Google Fact Check Tools for claims matching the provided text.
Returns a matching claim's rating, publisher, and review URL if found.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.models import FactCheckRequest, FactCheckResult
from app.services import factcheck_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Fact Check"])


@router.post(
    "/factcheck",
    response_model=FactCheckResult,
    summary="Search for fact-checked claims matching the text",
)
async def factcheck_endpoint(body: FactCheckRequest):
    """
    Extract a short claim from the text and query the Google Fact Check Tools API.

    - A short claim/headline is extracted from the first line or first 2 sentences.
    - Returns {found: true, rating, publisher, url} if a match is found.
    - Returns {found: false} if no fact-checks match.
    - On service failure, returns {found: false, error: "..."} rather than
      raising an HTTP 500, so callers can still use other signals.
    """
    try:
        result = factcheck_service.check(body.text)
    except Exception as exc:
        logger.exception("Unexpected error in fact-check service: %s", exc)
        # Return a soft error — don't fail the whole request
        result = {"found": False, "error": "Fact-check service encountered an unexpected error."}

    return result
