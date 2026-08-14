"""
Language-model service — loaded ONCE at module level.

Model: vikram71198/distilroberta-base-finetuned-fake-news-detection
  • DistilRoBERTa fine-tuned for binary fake/real classification.
  • Input: free-form text, max 512 tokens (model's training context).
  • Output: { "label": "Fake" | "Real", "confidence": 0-100 }

Design decisions:
  - The pipeline is created at import time (module-level singleton).
    FastAPI's startup event in main.py triggers a dummy prediction to
    warm the model before the first real request arrives.
  - We force truncation=True and max_length=512 so the tokenizer never
    raises an error on long articles.
  - Confidence is normalised from a 0-1 softmax score to an integer 0-100.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from transformers import pipeline

logger = logging.getLogger(__name__)

MODEL_NAME = "vikram71198/distilroberta-base-finetuned-fake-news-detection"

# ── Module-level singleton ────────────────────────────────────────────────────
# Initialised once; FastAPI's startup event calls _warm_up() to pre-load.
_classifier = None


def _load_model() -> None:
    """Load the HuggingFace pipeline into the module-level singleton."""
    global _classifier
    if _classifier is not None:
        return  # already loaded
    logger.info("Loading language model '%s' …", MODEL_NAME)
    _classifier = pipeline(
        "text-classification",
        model=MODEL_NAME,
        tokenizer=MODEL_NAME,
        # Truncate inputs that exceed the model's 512-token limit.
        truncation=True,
        max_length=512,
        device=-1,          # -1 → CPU; change to 0 for GPU
        top_k=None,         # return scores for ALL labels
    )
    logger.info("Language model loaded successfully.")


def warm_up() -> None:
    """
    Called by FastAPI's startup event to force model loading before the
    first real request.  This prevents a cold-start delay on the first hit.
    """
    _load_model()
    # Run a trivial prediction to jit-compile any lazy operations.
    try:
        _classifier("Warming up the model.", truncation=True, max_length=512)
        logger.info("Language model warm-up complete.")
    except Exception as exc:
        logger.warning("Model warm-up prediction failed (non-fatal): %s", exc)



def _resolve_label(raw_label: str) -> str:
    """
    Map whatever label string the model emits to a canonical 'Fake' or 'Real'.

    Resolution cascade:
      1. Explicit strings — FAKE / REAL (and lowercase/mixed variants).
      2. HuggingFace generic LABEL_N — look up the model's id2label config,
         which maps integer IDs to the human-readable label the fine-tuner set.
      3. Positional fallback convention — LABEL_0 = Fake, LABEL_1 = Real.
         This matches the most common convention for binary fake-news classifiers
         but is only reached if both steps above fail.
    """
    upper = raw_label.upper()

    # Step 1: explicit label strings
    if "FAKE" in upper:
        return "Fake"
    if "REAL" in upper:
        return "Real"

    # Step 2: generic LABEL_N → check the model's id2label config
    if _classifier is not None and "LABEL_" in upper:
        try:
            idx = int(raw_label.split("_")[-1])
            id2label = getattr(_classifier.model.config, "id2label", {})
            human = id2label.get(idx, "").upper()
            if "FAKE" in human:
                return "Fake"
            if "REAL" in human:
                return "Real"
        except (ValueError, AttributeError):
            pass

    # Step 3: positional fallback — LABEL_0 = Fake, LABEL_1 = Real
    logger.warning(
        "Could not resolve label '%s' by name or config; using positional fallback "
        "(LABEL_0=Fake, LABEL_1=Real). Inspect _classifier('test') to verify.",
        raw_label,
    )
    return "Fake" if raw_label == "LABEL_0" else "Real"


def predict(text: str) -> dict:
    """
    Classify *text* as Fake or Real.

    Returns:
        {"label": "Fake" | "Real", "confidence": 0-100}

    Raises:
        RuntimeError: if the model is not loaded yet.
    """
    if _classifier is None:
        raise RuntimeError("Language model is not loaded. Call warm_up() first.")

    # The pipeline returns a list of dicts when top_k=None, e.g.:
    #   [[{"label": "FAKE", "score": 0.923}, {"label": "REAL", "score": 0.077}]]
    # OR with HuggingFace generic defaults:
    #   [[{"label": "LABEL_0", "score": 0.923}, {"label": "LABEL_1", "score": 0.077}]]
    results = _classifier(text, truncation=True, max_length=512)
    # Unwrap the outer list produced by the pipeline
    label_scores = results[0] if isinstance(results[0], list) else results

    # Sort by score descending — the winner is always first, regardless of label names.
    # This avoids the silent failure where both .get("FAKE") and .get("REAL") return 0.0
    # when the model emits generic LABEL_0/LABEL_1 strings.
    label_scores_sorted = sorted(label_scores, key=lambda x: x["score"], reverse=True)
    winning = label_scores_sorted[0]

    label = _resolve_label(winning["label"])
    confidence = round(winning["score"] * 100)

    return {"label": label, "confidence": confidence}
