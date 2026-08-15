"""
YouTube Channel Credibility Service — automatic detection.

Instead of maintaining a manual list of every channel, this service uses
the YouTube Data API v3 to automatically score any channel based on:

  1. Topic categories  — YouTube classifies channels (News, Politics, Education…)
  2. Subscriber count  — proxy for reach and establishment
  3. Channel age       — older channels are more likely to be established sources

Scoring logic:
  ┌────────────────────────────────────────────────────────────┐
  │ Topic: News/Journalism                                     │
  │   + subs ≥ 1 M  + age ≥ 2 yrs  → "high"                  │
  │   + subs ≥ 100 K               → "medium"                 │
  │   otherwise                    → "youtube_unverified"     │
  ├────────────────────────────────────────────────────────────┤
  │ Topic: Politics/Government/Education/Science               │
  │   + subs ≥ 500 K               → "medium"                 │
  │   otherwise                    → "youtube_unverified"     │
  ├────────────────────────────────────────────────────────────┤
  │ Topic: anything else                                       │
  │   → "youtube_unverified"                                   │
  └────────────────────────────────────────────────────────────┘

Override list (kept small):
  A short blocklist of known misinformation channels that could otherwise
  pass the subscriber/age thresholds and be auto-promoted.

Graceful degradation:
  On any API error (no key, quota exceeded, timeout, private stats) the
  service falls back to "youtube_unverified" — the analysis never fails.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

YOUTUBE_VIDEOS_API   = "https://www.googleapis.com/youtube/v3/videos"
YOUTUBE_CHANNELS_API = "https://www.googleapis.com/youtube/v3/channels"
REQUEST_TIMEOUT      = 8  # seconds

# ── Wikipedia topic-category keywords used by YouTube's topicDetails ─────────
_NEWS_KEYWORDS     = {"news", "journalism", "broadcaster", "newspaper", "media"}
_POLITICS_KEYWORDS = {"politics", "government", "political", "politician"}
_TRUSTED_KEYWORDS  = {"education", "science", "university", "health", "academic"}

# ── Known-bad override (channels that might pass score thresholds) ────────────
# Keys are lowercased channel titles. Only list confirmed misinformation sources.
_BLOCKLIST: set[str] = {
    "infowars",
    "natural news",
    "the gateway pundit",
    "russia today",
    "rt",
    "cgtn",
    "epoch times",
    "ntd",
    "one america news network",
    "oan",
    "newsmax",
}


def _api_key() -> str:
    return os.getenv("YOUTUBE_DATA_API_KEY", "")


# ── Step 1: Get channelId + channelTitle from video ID ───────────────────────

def _fetch_video_info(video_id: str) -> dict | None:
    """
    Returns {"channelId": ..., "channelTitle": ...} or None on failure.
    """
    key = _api_key()
    if not key:
        logger.warning("YOUTUBE_DATA_API_KEY not set; skipping channel lookup.")
        return None

    try:
        resp = requests.get(
            YOUTUBE_VIDEOS_API,
            params={
                "id":     video_id,
                "part":   "snippet",
                "key":    key,
                "fields": "items(snippet(channelId,channelTitle))",
            },
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if not items:
            logger.warning("YouTube API: no video found for id=%s", video_id)
            return None
        snippet = items[0].get("snippet", {})
        return {
            "channelId":    snippet.get("channelId"),
            "channelTitle": snippet.get("channelTitle"),
        }
    except Exception as exc:
        logger.warning("YouTube video fetch failed for %s: %s", video_id, exc)
        return None


# ── Step 2: Get channel statistics + topicDetails from channelId ─────────────

def _fetch_channel_details(channel_id: str) -> dict | None:
    """
    Returns {
        "subscriberCount": int,
        "publishedAt":     datetime,
        "topicCategories": list[str],   # Wikipedia URLs
    } or None on failure.
    """
    key = _api_key()
    try:
        resp = requests.get(
            YOUTUBE_CHANNELS_API,
            params={
                "id":     channel_id,
                "part":   "snippet,statistics,topicDetails",
                "key":    key,
                "fields": "items(snippet(publishedAt),statistics(subscriberCount,hiddenSubscriberCount),topicDetails(topicCategories))",
            },
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if not items:
            return None

        item        = items[0]
        stats       = item.get("statistics", {})
        snippet     = item.get("snippet", {})
        topic_data  = item.get("topicDetails", {})

        # Subscriber count — some channels hide it
        hidden = stats.get("hiddenSubscriberCount", False)
        sub_count = 0 if hidden else int(stats.get("subscriberCount", 0))

        # Channel age
        published_str = snippet.get("publishedAt", "")
        try:
            published_at = datetime.fromisoformat(published_str.replace("Z", "+00:00"))
        except Exception:
            published_at = None

        topic_categories = topic_data.get("topicCategories", [])

        return {
            "subscriberCount":   sub_count,
            "publishedAt":       published_at,
            "topicCategories":   topic_categories,
        }
    except Exception as exc:
        logger.warning("YouTube channel details fetch failed for %s: %s", channel_id, exc)
        return None


# ── Step 3: Score the channel ─────────────────────────────────────────────────

def _score_channel(channel_title: str, details: dict | None) -> str:
    """
    Compute a credibility tier from channel metadata.
    Returns "high" | "medium" | "youtube_unverified".
    """
    # Blocklist check (takes priority over everything)
    if channel_title.lower().strip() in _BLOCKLIST:
        return "low"

    if details is None:
        return "youtube_unverified"

    subs        = details["subscriberCount"]
    published   = details["publishedAt"]
    topics      = " ".join(details["topicCategories"]).lower()

    # Channel age in years
    if published:
        age_years = (datetime.now(timezone.utc) - published).days / 365
    else:
        age_years = 0

    # Determine topic category
    is_news     = any(kw in topics for kw in _NEWS_KEYWORDS)
    is_politics = any(kw in topics for kw in _POLITICS_KEYWORDS)
    is_trusted  = any(kw in topics for kw in _TRUSTED_KEYWORDS)

    logger.info(
        "Channel scoring: title=%r subs=%d age=%.1fy news=%s politics=%s trusted=%s topics=%r",
        channel_title, subs, age_years, is_news, is_politics, is_trusted,
        details["topicCategories"],
    )

    if is_news:
        if subs >= 1_000_000 and age_years >= 2:
            return "high"
        if subs >= 100_000:
            return "medium"
        return "youtube_unverified"

    if is_politics or is_trusted:
        if subs >= 500_000:
            return "medium"
        return "youtube_unverified"

    # No recognised topic — treat as unverified regardless of size
    return "youtube_unverified"


# ── Public API ────────────────────────────────────────────────────────────────

def check_channel(video_id: str) -> dict:
    """
    Resolve a video's channel and automatically compute its credibility tier.

    Returns:
        {
            "domain":   "youtube.com",
            "channel":  "<Channel Title>" | None,
            "tier":     "high" | "medium" | "low" | "youtube_unverified",
        }
    """
    video_info = _fetch_video_info(video_id)

    if not video_info:
        return {"domain": "youtube.com", "channel": None, "tier": "youtube_unverified"}

    channel_title = video_info.get("channelTitle") or ""
    channel_id    = video_info.get("channelId")

    details = _fetch_channel_details(channel_id) if channel_id else None
    tier    = _score_channel(channel_title, details)

    return {
        "domain":  "youtube.com",
        "channel": channel_title or None,
        "tier":    tier,
    }
