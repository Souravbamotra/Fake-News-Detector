"""
Fact-check service — wraps the Google Fact Check Tools API.

API docs: https://developers.google.com/fact-check/tools/api/reference/rest/v1alpha1/claims/search

Strategy:
  1. Extract a short claim/query from the input text:
       - If the text contains a newline (headline + body), use the first line.
       - Otherwise use the first two sentences (up to 200 chars).
  2. Call the API with that query.
  3. Return the first matching claim's rating, publisher, and review URL.
  4. If no match exists, return {"found": False}.
  5. On any failure (network error, bad API key, quota exceeded), return
     {"found": False, "error": "..."} so the /analyze endpoint can still
     return partial results.
"""

from __future__ import annotations

import logging
import os
import re
import textwrap

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

FACT_CHECK_API_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
API_KEY = os.getenv("GOOGLE_FACT_CHECK_API_KEY", "")
REQUEST_TIMEOUT = 10  # seconds


def _extract_claim(text: str, max_chars: int = 200) -> str:
    """
    Extract a short, searchable claim from a longer text.

    Heuristic order:
      1. If there's a clear title/headline (first line followed by a blank line),
         use that first line.
      2. Otherwise take the first 1-2 sentences, trimmed to max_chars.
    """
    text = text.strip()

    # Strategy 1: first line as headline
    lines = text.split("\n")
    first_line = lines[0].strip()
    if 10 < len(first_line) <= max_chars:
        return first_line

    # Strategy 2: first 1-2 sentences
    sentences = re.split(r"(?<=[.!?])\s+", text)
    claim = " ".join(sentences[:2])
    return textwrap.shorten(claim, width=max_chars, placeholder="…")


def check(text: str) -> dict:
    """
    Search Google Fact Check Tools for claims matching the text.

    Returns one of:
        {"found": True, "rating": str, "publisher": str, "url": str}
        {"found": False}
        {"found": False, "error": str}  ← service-level failure
    """
    if not API_KEY:
        logger.warning("GOOGLE_FACT_CHECK_API_KEY is not set; skipping fact-check.")
        return {"found": False, "error": "Fact-check API key not configured."}

    claim = _extract_claim(text)
    logger.debug("Fact-check query: %r", claim)

    try:
        response = requests.get(
            FACT_CHECK_API_URL,
            params={"query": claim, "key": API_KEY, "pageSize": 5},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
    except requests.exceptions.Timeout:
        logger.warning("Fact Check API timed out for query: %r", claim)
        return {"found": False, "error": "Fact-check service timed out."}
    except requests.exceptions.RequestException as exc:
        logger.warning("Fact Check API request failed: %s", exc)
        return {"found": False, "error": "Fact-check service unavailable."}

    data = response.json()
    claims = data.get("claims", [])

    if not claims:
        return {"found": False}

    # Use the first claim returned — Google ranks by relevance
    claim_obj = claims[0]
    reviews = claim_obj.get("claimReview", [])

    if not reviews:
        return {"found": False}

    review = reviews[0]
    rating = review.get("textualRating", "")
    publisher_name = review.get("publisher", {}).get("name", "")
    review_url = review.get("url", "")

    return {
        "found": True,
        "rating": rating,
        "publisher": publisher_name,
        "url": review_url,
    }
