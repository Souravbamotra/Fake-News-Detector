"""
Extraction service — three helpers, one per input type.

  extract_article(url)         → trafilatura (15 s timeout)
  extract_screenshot(file)     → Pillow preprocess + pytesseract OCR
  extract_youtube(url)         → youtube-transcript-api (10 s timeout)

Each function returns a dict with at least {"text": str}.
Each raises a descriptive ExtractionError on failure (never a raw exception).
"""

from __future__ import annotations

import io
import logging
import re
import urllib.parse
from typing import Optional

import requests
import trafilatura
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    RequestBlocked,
    IpBlocked,
    YouTubeTranscriptApiException,
)

import os
import shutil

logger = logging.getLogger(__name__)

# ── Configure Tesseract binary path on Windows if not in PATH ─────────────────
if os.name == "nt" and not shutil.which("tesseract"):
    _tesseract_common_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
    ]
    for _p in _tesseract_common_paths:
        if os.path.exists(_p):
            pytesseract.pytesseract.tesseract_cmd = _p
            logger.info("Configured Tesseract binary path: %s", _p)
            break

# ── Timeouts ──────────────────────────────────────────────────────────────────
ARTICLE_TIMEOUT = 15   # seconds
YOUTUBE_TIMEOUT = 10   # seconds

# ── Supported image MIME types ────────────────────────────────────────────────
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/tiff"}
MAX_UPLOAD_SIZE_MB = 10


class ExtractionError(Exception):
    """Friendly, client-safe error message for extraction failures."""


# ──────────────────────────────────────────────────────────────────────────────
# Article extraction
# ──────────────────────────────────────────────────────────────────────────────

def extract_article(url: str) -> dict:
    """
    Fetch and extract clean text from an article URL using trafilatura.

    Returns:
        {"text": str, "title": str | None, "domain": str}

    Raises:
        ExtractionError with a user-friendly message on failure.
    """
    # Parse domain first so we can always return it even on partial failure
    try:
        parsed = urllib.parse.urlparse(url)
        # NOTE: do NOT use lstrip("www.") — it strips individual characters from
        # a set, not the prefix string, mangling domains like washingtonpost.com
        # or wsj.com that start with 'w'. Use a startswith guard instead.
        netloc = parsed.netloc
        domain = netloc[4:] if netloc.startswith("www.") else netloc if netloc else None
    except Exception:
        domain = None

    try:
        # trafilatura can fetch + parse in one call; we set timeout via requests
        downloaded = trafilatura.fetch_url(url, no_ssl=False)
    except Exception as exc:
        logger.warning("trafilatura fetch failed for %s: %s", url, exc)
        raise ExtractionError(
            "Couldn't extract this article automatically — try pasting the text directly."
        ) from exc

    if not downloaded:
        raise ExtractionError(
            "Couldn't extract this article automatically — try pasting the text directly."
        )

    result = trafilatura.extract(
        downloaded,
        include_comments=False,
        include_tables=False,
        output_format="txt",
        with_metadata=True,
        favor_recall=True,
    )

    if not result:
        raise ExtractionError(
            "Couldn't extract this article automatically — try pasting the text directly."
        )

    # When with_metadata=True, result may be a metadata object or a plain string.
    # Handle both cases gracefully.
    if isinstance(result, str):
        text = result
        title = None
    else:
        # trafilatura returns an object with .text, .title attributes
        text = getattr(result, "text", None) or str(result)
        title = getattr(result, "title", None)

    if not text or len(text.strip()) < 20:
        raise ExtractionError(
            "Couldn't extract this article automatically — try pasting the text directly."
        )

    return {"text": text.strip(), "title": title, "domain": domain}


# ──────────────────────────────────────────────────────────────────────────────
# Screenshot OCR extraction
# ──────────────────────────────────────────────────────────────────────────────

def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Preprocess image to improve OCR accuracy:
      1. Convert to grayscale (removes colour noise)
      2. Scale up small images (tesseract works best at ~300 dpi)
      3. Boost contrast (makes text stand out from background)
      4. Sharpen slightly (cleans up blurry screenshots)
    """
    # Grayscale
    image = image.convert("L")

    # Upscale if too small — Tesseract accuracy improves with larger images
    min_dim = 1000
    w, h = image.size
    if w < min_dim or h < min_dim:
        scale = max(min_dim / w, min_dim / h)
        image = image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    # Boost contrast
    image = ImageEnhance.Contrast(image).enhance(2.0)

    # Sharpen
    image = image.filter(ImageFilter.SHARPEN)

    return image


def extract_screenshot(file_bytes: bytes, content_type: str) -> dict:
    """
    Run OCR on an uploaded screenshot image.

    Args:
        file_bytes:   raw bytes of the uploaded image file
        content_type: MIME type reported by the client

    Returns:
        {"text": str}

    Raises:
        ExtractionError on validation failure or OCR error.
    """
    # Validate content type
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise ExtractionError(
            f"Unsupported image type '{content_type}'. "
            f"Please upload a PNG, JPEG, WebP, or TIFF image."
        )

    # Validate file size
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise ExtractionError(
            f"Image is too large ({size_mb:.1f} MB). Maximum allowed size is {MAX_UPLOAD_SIZE_MB} MB."
        )

    try:
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as exc:
        logger.warning("Failed to open uploaded image: %s", exc)
        raise ExtractionError("Couldn't read the uploaded image. Make sure it's a valid image file.") from exc

    try:
        processed = preprocess_image(image)
    except Exception as exc:
        logger.warning("Image preprocessing failed: %s", exc)
        # Fall back to raw image if preprocessing blows up
        processed = image

    try:
        # PSM 6: assume a uniform block of text — good for article screenshots
        custom_config = r"--oem 3 --psm 6"
        text = pytesseract.image_to_string(processed, config=custom_config)
    except Exception as exc:
        logger.error("Tesseract OCR failed: %s", exc)
        raise ExtractionError(
            "OCR failed. Make sure Tesseract is installed and the image contains readable text."
        ) from exc

    text = text.strip()
    if len(text) < 20:
        raise ExtractionError(
            "Couldn't extract enough text from the screenshot. "
            "Try a clearer image or paste the text directly."
        )

    # No domain/source available from a screenshot — return None explicitly
    # so downstream credibility check treats this as 'not_available'.
    return {"text": text}


# ──────────────────────────────────────────────────────────────────────────────
# YouTube transcript extraction
# ──────────────────────────────────────────────────────────────────────────────

def _parse_video_id(url: str) -> Optional[str]:
    """Extract the YouTube video ID from various URL formats."""
    patterns = [
        r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})",
        r"(?:embed/)([A-Za-z0-9_-]{11})",
        r"(?:shorts/)([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def extract_youtube(url: str) -> dict:
    """
    Pull the caption transcript from a YouTube video.

    Returns:
        {"text": str, "title": None}
        (Title is not available from the transcript API without extra scraping;
         marked as a future enhancement — could use pytube or yt-dlp.)

    Raises:
        ExtractionError with a user-friendly message.

    Note:
        Uses youtube-transcript-api v1.x instance-based API.
        Future enhancement: if no captions exist, consider Whisper ASR.
        Not implemented here — too heavy for free-tier hosting (Render/Railway).
    """
    video_id = _parse_video_id(url)
    if not video_id:
        raise ExtractionError(
            "Couldn't parse a YouTube video ID from the URL. "
            "Make sure the URL looks like https://youtube.com/watch?v=XXXXXXXXXXX"
        )

    # v1.x requires an instance; static get_transcript() was removed.
    ytt_api = YouTubeTranscriptApi()

    fetched = None

    # --- Primary: try preferred English captions first ---
    try:
        fetched = ytt_api.fetch(
            video_id,
            languages=["en", "en-US", "en-GB"],
        )
    except (TranscriptsDisabled, NoTranscriptFound):
        # Fall through to the language-agnostic fallback below
        pass
    except (RequestBlocked, IpBlocked) as exc:
        logger.warning("YouTube blocked request for %s: %s", video_id, exc)
        raise ExtractionError(
            "YouTube is temporarily blocking transcript requests from this server. "
            "Please try again in a few minutes."
        ) from exc
    except VideoUnavailable as exc:
        logger.warning("YouTube video unavailable %s: %s", video_id, exc)
        raise ExtractionError(
            "This video is unavailable or private — captions cannot be retrieved."
        ) from exc
    except YouTubeTranscriptApiException as exc:
        logger.warning("YouTube transcript API error for %s: %s", video_id, exc)
        raise ExtractionError(
            "Couldn't retrieve captions for this video. "
            "Please check the URL and try again."
        ) from exc
    except Exception as exc:
        logger.warning("Unexpected YouTube transcript error for %s: %s", video_id, exc)
        raise ExtractionError(
            "An unexpected error occurred while fetching the transcript."
        ) from exc

    # --- Fallback: any available language ---
    if fetched is None:
        try:
            transcript_list_obj = ytt_api.list(video_id)
            # Grab the first available transcript regardless of language
            first_transcript = next(iter(transcript_list_obj))
            fetched = first_transcript.fetch()
        except StopIteration:
            raise ExtractionError(
                "This video has no captions available — transcript extraction isn't supported yet."
            )
        except (RequestBlocked, IpBlocked) as exc:
            logger.warning("YouTube blocked request for %s: %s", video_id, exc)
            raise ExtractionError(
                "YouTube is temporarily blocking transcript requests from this server. "
                "Please try again in a few minutes."
            ) from exc
        except Exception as exc:
            logger.warning("YouTube transcript fallback failed for %s: %s", video_id, exc)
            raise ExtractionError(
                "This video has no captions available — transcript extraction isn't supported yet."
            ) from exc

    if not fetched:
        raise ExtractionError(
            "This video has no captions available — transcript extraction isn't supported yet."
        )

    # Stitch caption snippets into a single readable block of text.
    # v1.x: each element is a FetchedTranscriptSnippet with a .text attribute,
    # not a plain dict. We support both for safety.
    def _snippet_text(segment) -> str:
        if hasattr(segment, "text"):
            return segment.text  # v1.x FetchedTranscriptSnippet
        return segment.get("text", "")  # legacy dict (v0.x)

    text = " ".join(_snippet_text(s) for s in fetched)
    text = text.strip()

    if len(text) < 20:
        raise ExtractionError(
            "The video captions are too short to analyse meaningfully."
        )

    return {"text": text, "title": None}
