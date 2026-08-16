"""
News Cross-Reference Service — "Also covered by".

Finds other credible outlets that have reported on the same story by
querying the Google News RSS feed. No API key required.

Strategy:
  1. Extract a short search query from the article title / first sentence.
  2. Query: https://news.google.com/rss/search?q={query}
  3. Parse the RSS XML and return the top N results (title, source, URL).
  4. Filter out the original source domain to avoid self-referencing.
  5. On any failure (network, parsing) return an empty list — never blocks analysis.
"""

from __future__ import annotations

import logging
import re
import textwrap
import urllib.parse
import xml.etree.ElementTree as ET
from typing import Optional

import requests

logger = logging.getLogger(__name__)

GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"
REQUEST_TIMEOUT = 8   # seconds
MAX_RESULTS     = 5   # articles to return


def _build_query(text: str, max_chars: int = 120) -> str:
    """
    Build a short news search query from the article text.
    Uses the first sentence / line, trimmed to max_chars.
    """
    text = text.strip()
    # Try the first line as a headline
    first_line = text.split("\n")[0].strip()
    if 15 < len(first_line) <= max_chars:
        return first_line

    # Fall back to first sentence
    sentences = re.split(r'(?<=[.!?])\s+', text)
    query = sentences[0] if sentences else text
    return textwrap.shorten(query, width=max_chars, placeholder="")


def _extract_source_domain(url: str) -> str:
    """Extract domain from a URL for deduplication."""
    try:
        netloc = urllib.parse.urlparse(url).netloc.lower()
        return netloc[4:] if netloc.startswith("www.") else netloc
    except Exception:
        return ""


def search(text: str, exclude_domain: Optional[str] = None) -> list[dict]:
    """
    Search Google News RSS for articles related to the given text.

    Args:
        text:           Extracted article or transcript text.
        exclude_domain: Domain of the original source — excluded from results.

    Returns:
        List of up to MAX_RESULTS dicts:
        [{"title": str, "source": str, "url": str}, ...]
        Empty list on any failure.
    """
    query = _build_query(text)
    if not query:
        return []

    params = {
        "q":    query,
        "hl":   "en",
        "gl":   "US",
        "ceid": "US:en",
    }

    try:
        resp = requests.get(
            GOOGLE_NEWS_RSS,
            params=params,
            timeout=REQUEST_TIMEOUT,
            headers={"User-Agent": "Mozilla/5.0 (compatible; FakeNewsDetector/1.0)"},
        )
        resp.raise_for_status()
    except requests.exceptions.Timeout:
        logger.warning("Google News RSS timed out for query: %r", query)
        return []
    except requests.exceptions.RequestException as exc:
        logger.warning("Google News RSS request failed: %s", exc)
        return []

    # Parse RSS XML
    try:
        root = ET.fromstring(resp.content)
    except ET.ParseError as exc:
        logger.warning("Google News RSS XML parse error: %s", exc)
        return []

    items = root.findall(".//item")
    results: list[dict] = []

    for item in items:
        title_el  = item.find("title")
        link_el   = item.find("link")
        source_el = item.find("source")

        title  = title_el.text.strip()  if title_el  is not None and title_el.text  else ""
        url    = link_el.text.strip()   if link_el   is not None and link_el.text   else ""
        source = source_el.text.strip() if source_el is not None and source_el.text else ""

        if not title or not url:
            continue

        # Skip the original source
        if exclude_domain:
            item_domain = _extract_source_domain(url)
            if exclude_domain.lower() in item_domain or item_domain in exclude_domain.lower():
                continue

        # Clean Google News redirect URLs — extract the actual article URL
        # Google News RSS wraps links; the real URL is usually the link itself
        # (Google has moved away from redirect wrapping in RSS feeds)
        results.append({
            "title":  title,
            "source": source,
            "url":    url,
        })

        if len(results) >= MAX_RESULTS:
            break

    logger.info("News cross-reference: %d results for query %r", len(results), query)
    return results
