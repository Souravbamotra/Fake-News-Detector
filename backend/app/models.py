"""
Pydantic schemas for all request bodies and response shapes.

All routers import from here so that response contracts are defined in one place.
If you rename a field here, update the frontend contract in parallel.
"""

from __future__ import annotations

from typing import Literal, Optional, Union

from pydantic import BaseModel, Field, HttpUrl


# ──────────────────────────────────────────────────────────────────────────────
# Extraction endpoints
# ──────────────────────────────────────────────────────────────────────────────

class ArticleExtractRequest(BaseModel):
    url: str = Field(..., description="URL of the article to extract text from")


class ArticleExtractResponse(BaseModel):
    text: str
    title: Optional[str] = None
    domain: Optional[str] = None


class ScreenshotExtractResponse(BaseModel):
    text: str


class YoutubeExtractRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL")


class YoutubeExtractResponse(BaseModel):
    text: str
    title: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Language model verdict — /predict
# ──────────────────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Text to classify as Fake or Real")


class LanguageVerdict(BaseModel):
    label: Literal["Fake", "Real"]
    confidence: int = Field(..., ge=0, le=100, description="Confidence as integer 0-100")


# ──────────────────────────────────────────────────────────────────────────────
# Fact-check — /factcheck
# ──────────────────────────────────────────────────────────────────────────────

class FactCheckRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Text or claim to fact-check")


class FactCheckResult(BaseModel):
    found: bool
    rating: Optional[str] = None
    publisher: Optional[str] = None
    url: Optional[str] = None
    error: Optional[str] = None  # populated when the service call itself fails


# ──────────────────────────────────────────────────────────────────────────────
# Source credibility — /credibility
# ──────────────────────────────────────────────────────────────────────────────

class CredibilityRequest(BaseModel):
    domain: Optional[str] = Field(
        None,
        description="Domain to look up (e.g. 'reuters.com'). Omit or null for screenshot inputs."
    )


class SourceCredibility(BaseModel):
    domain: Optional[str]
    tier: Literal["high", "medium", "low", "unrated", "not_available"]
    error: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Combined /analyze endpoint
# ──────────────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    input_type: Literal["text", "article_url", "screenshot", "youtube_url"] = Field(
        ..., description="Type of input being submitted"
    )
    # Present when input_type == "text"
    text: Optional[str] = Field(None, description="Raw text to analyse (input_type='text')")
    # Present when input_type == "article_url"
    url: Optional[str] = Field(None, description="Article URL (input_type='article_url')")
    # Present when input_type == "youtube_url"
    youtube_url: Optional[str] = Field(None, description="YouTube URL (input_type='youtube_url')")
    # screenshot is handled as a multipart upload on the route level, not here


class AnalyzeResponse(BaseModel):
    extracted_text: str
    language_verdict: Union[LanguageVerdict, dict]   # dict used for error shape
    fact_check: Union[FactCheckResult, dict]
    source_credibility: Union[SourceCredibility, dict]


# ──────────────────────────────────────────────────────────────────────────────
# Generic error shape
# ──────────────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
