"""
Source credibility service.

Lookup order:
  1. Check the curated credibility_list.json (maintained locally).
  2. If the domain is not in the list, apply lightweight heuristics:
       - Domain starts with "http://" → low (no HTTPS)
       - Otherwise → "unrated"
  3. If no domain is available (e.g. screenshot input) → tier="not_available"

Future enhancement:
  - Integrate a WHOIS lookup to flag very recently registered domains as "low".
    Not included here to avoid adding a heavy dependency and extra latency.
"""

from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Path to the curated list — relative to this file's location
_CREDIBILITY_LIST_PATH = Path(__file__).parent.parent.parent / "credibility_list.json"


@lru_cache(maxsize=1)
def _load_credibility_list() -> dict:
    """Load and cache credibility_list.json. Returns empty dict on failure."""
    try:
        with open(_CREDIBILITY_LIST_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        logger.info("Loaded %d entries from credibility_list.json", len(data))
        return data
    except FileNotFoundError:
        logger.error("credibility_list.json not found at %s", _CREDIBILITY_LIST_PATH)
        return {}
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse credibility_list.json: %s", exc)
        return {}


def _normalise_domain(domain: str) -> str:
    """Strip leading 'www.' and trailing slashes for consistent lookup."""
    domain = domain.strip().lower()
    if domain.startswith("www."):
        domain = domain[4:]
    return domain.rstrip("/")


def _apply_heuristics(domain: str) -> str:
    """
    Apply basic heuristics when the domain is not in the curated list.

    Current heuristics:
      - If the caller passed a raw URL starting with 'http://' (no TLS) → low
      - Otherwise → unrated

    Future: WHOIS registration date check → low if < 6 months old.
    """
    if domain.startswith("http://"):
        return "low"
    return "unrated"


def check(domain: Optional[str]) -> dict:
    """
    Determine the credibility tier for a given domain.

    Args:
        domain: the domain string (e.g. "reuters.com") or None for screenshot inputs.

    Returns one of:
        {"domain": str, "tier": "high"|"medium"|"low"|"unrated"}
        {"domain": None, "tier": "not_available"}
    """
    if not domain:
        return {"domain": None, "tier": "not_available"}

    normalised = _normalise_domain(domain)
    credibility_map = _load_credibility_list()

    tier = credibility_map.get(normalised)

    if tier:
        logger.debug("Domain '%s' found in credibility list: %s", normalised, tier)
        return {"domain": normalised, "tier": tier}

    # Fall back to heuristics
    tier = _apply_heuristics(domain)
    logger.debug("Domain '%s' not in list; heuristic tier: %s", normalised, tier)
    return {"domain": normalised, "tier": tier}
