# ── Fake News Detector — Backend Dockerfile ──────────────────────────────────
#
# Design goals:
#   • CPU-only PyTorch to keep the image lean (free-tier hosting)
#   • Tesseract OCR binary installed from apt
#   • Model weights downloaded at first startup (not baked into the image)
#     to keep image size manageable and allow easy model updates.
#
# Build:
#   docker build -t fake-news-detector-backend .
#
# Run:
#   docker run -p 8000:8000 \
#     -e GOOGLE_FACT_CHECK_API_KEY=your_key \
#     -e ALLOWED_ORIGIN=https://your-vercel-domain.vercel.app \
#     fake-news-detector-backend
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# ── System dependencies ───────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ───────────────────────────────────────────────────────
WORKDIR /app

COPY requirements.txt .

# Install CPU-only PyTorch first (avoids pulling the heavy CUDA wheel)
# The --index-url flag points pip to the CPU-only wheel index.
RUN pip install --no-cache-dir \
    torch==2.3.0 \
    --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies (requirements.txt has torch listed for
# documentation purposes but it's already installed above — pip will skip it)
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────────────────────
COPY . .

# ── Runtime ───────────────────────────────────────────────────────────────────
# Single worker to avoid loading the LM weights multiple times.
# $PORT is injected by Render/Railway; default to 8000 locally.
ENV PORT=8000

EXPOSE $PORT

# Preload the HuggingFace model cache at build time (optional — speeds up cold
# starts at the cost of a larger image). Comment out to skip.
# RUN python -c "from app.services import lm_service; lm_service.warm_up()"

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1"]
