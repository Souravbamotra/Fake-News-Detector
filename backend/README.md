# Fake News Detector — Backend

A **FastAPI** backend for AI-powered fake news detection. Accepts text, article URLs, screenshots, and YouTube URLs, then returns a combined verdict from three independent signals.

---

## Architecture

```
Input (text / article URL / screenshot / YouTube URL)
        │
        ▼
Extraction layer → clean text (+ source domain if available)
        │
        ▼
┌─────────────────────────────────────────┐
│ 1. Language model verdict               │
│    (DistilRoBERTa fine-tuned)           │
│ 2. Fact-check lookup                    │
│    (Google Fact Check Tools API)        │
│ 3. Source credibility check             │
│    (curated list + heuristics)          │
└─────────────────────────────────────────┘
        │
        ▼
Combined JSON response
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Tesseract OCR binary (`tesseract` on `$PATH`)
  - macOS: `brew install tesseract`
  - Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
  - Windows: [UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki)
- A [Google Fact Check Tools API key](https://developers.google.com/fact-check/tools/api/)

### Setup

```bash
# 1. Clone and enter the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# 3. Install CPU-only PyTorch (must be installed before requirements.txt)
pip install torch==2.3.0 --index-url https://download.pytorch.org/whl/cpu

# 4. Install remaining dependencies
pip install -r requirements.txt

# 5. Configure environment variables
cp .env.example .env
# Edit .env and fill in GOOGLE_FACT_CHECK_API_KEY and ALLOWED_ORIGIN

# 6. Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_FACT_CHECK_API_KEY` | Yes | Google Fact Check Tools API key |
| `ALLOWED_ORIGIN` | Recommended | Frontend origin for CORS (default: `http://localhost:3000`) |

---

## API Endpoints

### `GET /health`
Liveness probe. Returns `{"status": "ok"}`.

---

### `POST /extract/article`
Extract clean text from an article URL.

**Request:**
```json
{ "url": "https://apnews.com/article/..." }
```
**Response:**
```json
{ "text": "...", "title": "Article Title", "domain": "apnews.com" }
```

---

### `POST /extract/screenshot`
Upload a screenshot image (PNG/JPEG/WebP/TIFF, max 10 MB) and extract text via OCR.

**Form field:** `file` (multipart upload)

**Response:**
```json
{ "text": "Extracted OCR text..." }
```

---

### `POST /extract/youtube`
Extract the caption transcript from a YouTube video.

**Request:**
```json
{ "url": "https://youtube.com/watch?v=XXXXXXXXXXX" }
```
**Response:**
```json
{ "text": "Full transcript text...", "title": null }
```

---

### `POST /predict`
Classify text as Fake or Real using the language model.

**Request:**
```json
{ "text": "Scientists have discovered..." }
```
**Response:**
```json
{ "label": "Fake", "confidence": 78 }
```

---

### `POST /factcheck`
Search Google Fact Check Tools for matching claims.

**Request:**
```json
{ "text": "The claim to fact-check..." }
```
**Response (match found):**
```json
{ "found": true, "rating": "False", "publisher": "PolitiFact", "url": "https://..." }
```
**Response (no match):**
```json
{ "found": false }
```

---

### `POST /credibility`
Look up source credibility for a domain.

**Request:**
```json
{ "domain": "reuters.com" }
```
**Response:**
```json
{ "domain": "reuters.com", "tier": "high" }
```

Possible tiers: `high` | `medium` | `low` | `unrated` | `not_available`

---

### `POST /analyze` ← **Main frontend endpoint**
Run full analysis on text, article URL, or YouTube URL.

**Request:**
```json
{
  "input_type": "article_url",
  "url": "https://example.com/article"
}
```
**Response:**
```json
{
  "extracted_text": "Full article text...",
  "language_verdict": { "label": "Fake", "confidence": 78 },
  "fact_check": { "found": true, "rating": "False", "publisher": "PolitiFact", "url": "..." },
  "source_credibility": { "domain": "example.com", "tier": "low" }
}
```

### `POST /analyze/screenshot` ← **Screenshot upload**
Upload a screenshot for full analysis (multipart).

**Form field:** `file` (image file)

Same response shape as `/analyze`.

---

## Deployment (Render / Railway)

### Docker

```bash
docker build -t fake-news-detector-backend .
docker run -p 8000:8000 \
  -e GOOGLE_FACT_CHECK_API_KEY=your_key \
  -e ALLOWED_ORIGIN=https://your-vercel-domain.vercel.app \
  fake-news-detector-backend
```

### Render

1. Push this `backend/` folder to a GitHub repo
2. Create a new **Web Service** on Render
3. Set **Build Command**: *(Docker auto-detected)*
4. Add environment variables: `GOOGLE_FACT_CHECK_API_KEY`, `ALLOWED_ORIGIN`
5. Set the **Health Check Path** to `/health`

### Notes

- Uses **CPU-only PyTorch** to stay within free-tier RAM limits
- Single Uvicorn worker to avoid loading the language model multiple times
- Model weights (~300 MB) are downloaded from HuggingFace Hub on first startup

---

## Out of Scope (This Phase)

- ❌ Instagram Reels support
- ❌ Audio transcription (Whisper) for YouTube videos without captions
- ❌ User authentication / accounts
- ❌ Database / persistent storage

---

## Tech Stack

| Component | Library |
|---|---|
| Web framework | FastAPI + Uvicorn |
| Language model | `transformers` + `torch` (CPU) |
| Article extraction | `trafilatura` |
| Screenshot OCR | `pytesseract` + `Pillow` |
| YouTube transcripts | `youtube-transcript-api` |
| Fact-check API | `requests` (Google Fact Check Tools) |
| File uploads | `python-multipart` |
| Environment | `python-dotenv` |
