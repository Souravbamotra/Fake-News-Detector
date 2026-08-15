"""
Summary Service — extractive summarisation.

Produces a 2-3 sentence "What this is about" blurb from the extracted text.

Strategy (no extra ML model required):
  1. Split text into sentences.
  2. Score each sentence by:
       - Position (early sentences score higher — inverted-pyramid news style)
       - Length  (very short or very long sentences penalised)
       - Presence of key noun-phrases from the title/first line
  3. Return the top N sentences in their original order.

This is purely extractive: sentences come verbatim from the source text,
so the summary is always faithful and never hallucinated.
"""

from __future__ import annotations

import re
import logging

logger = logging.getLogger(__name__)

# Tuning constants
MAX_SENTENCES   = 3    # sentences in the final summary
MIN_SENT_LEN    = 30   # characters — skip very short fragments
MAX_SENT_LEN    = 300  # characters — prefer more concise sentences
POSITION_WEIGHT = 2.0  # multiplier for the first N sentences


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences using simple regex heuristics."""
    # Split on . ! ? followed by whitespace+capital, or newline
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z\"\'])|(?<=\n)', text)
    # Clean and filter
    sentences = []
    for p in parts:
        p = p.strip()
        if p:
            sentences.append(p)
    return sentences


def _score_sentence(sent: str, idx: int, total: int, key_words: set[str]) -> float:
    """Score a sentence by position, length, and keyword overlap."""
    score = 0.0

    # Position bonus: earlier = better (news inverted pyramid)
    position_score = 1.0 - (idx / max(total, 1)) * 0.8
    score += position_score * POSITION_WEIGHT

    # Length penalty: prefer medium-length sentences
    length = len(sent)
    if length < MIN_SENT_LEN:
        score -= 1.0
    elif length > MAX_SENT_LEN:
        score -= 0.5

    # Keyword overlap with title/first line
    sent_lower = sent.lower()
    for word in key_words:
        if word in sent_lower:
            score += 0.3

    return score


def summarise(text: str, max_sentences: int = MAX_SENTENCES) -> str:
    """
    Return a short extractive summary of the given text.

    Args:
        text:          Full extracted article/transcript text.
        max_sentences: Number of sentences to include in the summary.

    Returns:
        A string of 2-3 sentences, or the original text truncated if it
        is already very short.
    """
    text = text.strip()

    # If text is already short, return it as-is (truncated)
    if len(text) < 400:
        return text[:400]

    sentences = _split_sentences(text)

    if not sentences:
        return text[:300]

    # Extract key words from the first line (acts as a headline proxy)
    first_line = sentences[0].lower() if sentences else ""
    # Simple stopword filter
    _STOP = {"the", "a", "an", "is", "are", "was", "were", "in", "on", "at",
              "to", "of", "for", "and", "or", "but", "that", "this", "it",
              "he", "she", "they", "we", "you", "i", "with", "by", "from"}
    key_words = {w for w in re.findall(r'\b[a-z]{4,}\b', first_line) if w not in _STOP}

    # Score sentences
    scored = [
        (i, sent, _score_sentence(sent, i, len(sentences), key_words))
        for i, sent in enumerate(sentences)
        if len(sent.strip()) >= MIN_SENT_LEN
    ]

    if not scored:
        return " ".join(sentences[:max_sentences])

    # Pick top N by score, then sort back into original order
    top = sorted(scored, key=lambda x: x[2], reverse=True)[:max_sentences]
    top_in_order = sorted(top, key=lambda x: x[0])

    summary = " ".join(s for _, s, _ in top_in_order)
    logger.debug("Summary produced: %d chars from %d sentences", len(summary), len(sentences))
    return summary
