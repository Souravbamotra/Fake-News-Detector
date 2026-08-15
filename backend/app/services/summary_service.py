"""
Summary Service — short topic line generator.

Produces a single short sentence (≤ 120 chars) describing what the content
is about. Priority order:

  1. Article title  — if provided by the caller (trafilatura extracts it).
  2. First meaningful sentence of the text, hard-capped at 120 chars.
  3. First 120 chars of text as a last resort.

This is intentionally minimal — a topic label, not a paragraph summary.
No extra ML model required.
"""

from __future__ import annotations

import re
import textwrap
import logging

logger = logging.getLogger(__name__)

MAX_CHARS = 120  # hard cap on summary length


def _first_sentence(text: str) -> str:
    """
    Extract the first complete sentence from text.
    Works for English and romanised text; non-Latin scripts fall back
    to a character-truncated snippet.
    """
    text = text.strip()

    # Try splitting on common sentence-ending punctuation
    # Include Devanagari danda (।) for Hindi/Marathi etc.
    match = re.search(r'[.!?।]\s', text)
    if match and match.start() > 20:
        return text[: match.start() + 1].strip()

    # No clear sentence boundary — return first line or first N chars
    first_line = text.split("\n")[0].strip()
    if 15 < len(first_line) <= MAX_CHARS:
        return first_line

    return textwrap.shorten(text, width=MAX_CHARS, placeholder="…")


def summarise(text: str, title: str | None = None) -> str:
    """
    Return a short topic description (≤ 120 chars).

    Args:
        text:  Full extracted article/transcript text.
        title: Article title if available (preferred over text extraction).

    Returns:
        A short string, never empty (falls back to truncated text).
    """
    # Priority 1: use the article title — it's already a perfect one-liner
    if title and len(title.strip()) >= 10:
        t = title.strip()
        return textwrap.shorten(t, width=MAX_CHARS, placeholder="…")

    if not text:
        return ""

    text = text.strip()

    # Priority 2: first sentence, capped
    sentence = _first_sentence(text)
    if sentence:
        return textwrap.shorten(sentence, width=MAX_CHARS, placeholder="…")

    # Priority 3: hard truncate
    return textwrap.shorten(text, width=MAX_CHARS, placeholder="…")
