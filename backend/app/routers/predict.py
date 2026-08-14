"""
Router: POST /predict

Classify a piece of text as Fake or Real using the language model.

The model (distilroberta fine-tuned for fake news detection) is loaded
once at app startup — not inside this route — to avoid per-request
weight loading.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.models import LanguageVerdict, PredictRequest
from app.services import lm_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Language Model"])


@router.post(
    "/predict",
    response_model=LanguageVerdict,
    summary="Classify text as Fake or Real",
)
async def predict_endpoint(body: PredictRequest):
    """
    Run the DistilRoBERTa fake-news classifier on the provided text.

    - Input text is automatically truncated to 512 tokens (model maximum).
    - Returns a label ("Fake" | "Real") and confidence as an integer 0-100.
    - The model is loaded once at startup; this endpoint has low latency
      after the first warm-up request.
    """
    try:
        result = lm_service.predict(body.text)
    except RuntimeError as exc:
        logger.error("Language model not loaded: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Language model is not available. Please try again shortly.",
        )
    except Exception as exc:
        logger.exception("Unexpected error during prediction: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while analysing the text.",
        )
    return result
