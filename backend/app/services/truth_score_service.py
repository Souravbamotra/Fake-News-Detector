"""
Truth Score Service — Computes a composite reliability score (0-100)
from three independent verification signals:
  1. Source credibility (30% weight)
  2. Language model pattern confidence (35% weight)
  3. Fact-check lookup match (35% weight)

Graceful degradation:
  - Missing/errored signals are excluded from the weighted average and
    weights are re-normalized across available signals.
  - If all signals error out, returns None.
"""

from __future__ import annotations

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# Base weights for each signal
WEIGHT_SOURCE   = 0.30
WEIGHT_LANGUAGE = 0.35
WEIGHT_FACTCHECK = 0.35

# Source credibility tier to score mapping
TIER_SCORES: dict[str, int] = {
    "high":               90,
    "medium":             65,
    "low":                20,
    "unrated":            50,
    "youtube_unverified": 50,
    "youtube":            50,
    "not_available":      50,
}

# Rating classifications for fact-checking
FALSE_KEYWORDS = [
    "false", "pants on fire", "misleading", "incorrect", "untrue",
    "debunked", "hoax", "distorted", "fabricated", "scam", "mostly false",
    "inaccurate", "wrong", "fiction", "four pinocchios", "three pinocchios",
    "two pinocchios", "fake", "disproven",
]

TRUE_KEYWORDS = [
    "true", "correct", "accurate", "verified", "legit", "confirmed",
    "mostly true", "factual", "supported", "authentic", "one pinocchio",
]

MIXED_KEYWORDS = [
    "half true", "mixture", "partly true", "needs context", "unproven",
    "unverified", "mixed", "in-between",
]


def _score_source(cred: Optional[dict]) -> Optional[int]:
    """
    Derive source reliability sub-score (0-100).
    Returns None if the credibility signal produced an error.
    """
    if not cred or "error" in cred:
        return None
    tier = cred.get("tier", "unrated")
    return TIER_SCORES.get(tier, 50)


def _score_language(lm: Optional[dict]) -> Optional[int]:
    """
    Derive language reliability sub-score (0-100).
    Higher score means more reliable language patterns.
    Returns None if the language model signal produced an error.
    """
    if not lm or "error" in lm:
        return None

    label = lm.get("label")
    confidence = lm.get("confidence")
    if confidence is None or label not in ("Real", "Fake"):
        return None

    # If label is Real, confidence is directly proportional to reliability.
    # If label is Fake, high confidence means very unreliable -> invert.
    if label == "Real":
        return int(confidence)
    else:
        return max(0, min(100, 100 - int(confidence)))


def _score_fact_check(fc: Optional[dict]) -> Optional[int]:
    """
    Derive fact-check match sub-score (0-100).
    Returns None if the fact-check service produced an error.
    """
    if not fc or "error" in fc:
        return None

    found = fc.get("found", False)
    if not found:
        # Absence of fact-check is neutral midpoint, not penalty
        return 50

    rating_str = (fc.get("rating") or "").strip().lower()
    if not rating_str:
        return 50

    # Check mixed keywords first
    for kw in MIXED_KEYWORDS:
        if kw in rating_str:
            return 50

    # Check false keywords
    for kw in FALSE_KEYWORDS:
        if kw in rating_str:
            return 10

    # Check true keywords
    for kw in TRUE_KEYWORDS:
        if kw in rating_str:
            return 95

    # Ambiguous / unclassified rating defaults to neutral midpoint
    return 50


def _get_label(score: int) -> str:
    """Map 0-100 score to human-readable reliability tier label."""
    if score >= 80:
        return "Highly Reliable"
    elif score >= 60:
        return "Mostly Reliable"
    elif score >= 40:
        return "Mixed Signals"
    elif score >= 20:
        return "Likely Unreliable"
    else:
        return "Highly Unreliable"


def calculate_truth_score(
    lm_result: Optional[dict],
    fc_result: Optional[dict],
    cred_result: Optional[dict],
) -> Optional[dict]:
    """
    Compute composite truth score from available signals.

    Returns:
        {
            "overall": int,
            "breakdown": {
                "source_reliability": Optional[int],
                "language_confidence": Optional[int],
                "fact_check_match": Optional[int],
            },
            "label": str,
        }
        or None if all signals are unavailable.
    """
    source_score   = _score_source(cred_result)
    language_score = _score_language(lm_result)
    fact_score     = _score_fact_check(fc_result)

    available_scores: list[tuple[int, float]] = []

    if source_score is not None:
        available_scores.append((source_score, WEIGHT_SOURCE))
    if language_score is not None:
        available_scores.append((language_score, WEIGHT_LANGUAGE))
    if fact_score is not None:
        available_scores.append((fact_score, WEIGHT_FACTCHECK))

    if not available_scores:
        logger.warning("All signals failed — truth_score is None")
        return None

    total_weight = sum(w for _, w in available_scores)
    weighted_sum = sum(score * (weight / total_weight) for score, weight in available_scores)
    overall = max(0, min(100, round(weighted_sum)))

    label = _get_label(overall)

    return {
        "overall": overall,
        "breakdown": {
            "source_reliability": source_score,
            "language_confidence": language_score,
            "fact_check_match": fact_score,
        },
        "label": label,
    }
