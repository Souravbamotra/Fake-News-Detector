"""
Router: POST /credibility

Look up a domain's credibility tier from the curated list or heuristics.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from app.models import CredibilityRequest, SourceCredibility
from app.services import credibility_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Source Credibility"])


@router.post(
    "/credibility",
    response_model=SourceCredibility,
    summary="Look up source credibility for a domain",
)
async def credibility_endpoint(body: CredibilityRequest):
    """
    Check a domain against the curated credibility_list.json.

    - Returns tier: "high" | "medium" | "low" | "unrated" | "not_available"
    - If domain is None or empty (e.g. screenshot inputs), returns "not_available".
    - Unknown domains fall back to lightweight heuristics (HTTPS check, etc.)
      and return "unrated" if no red flags are found.
    """
    result = credibility_service.check(body.domain)
    return result
