# Build Prompt: Fake News Detector — Backend

Build a **Python FastAPI** backend for an AI fake news detection tool. It accepts multiple input types, extracts clean text from each, then runs that text through three independent verification signals and returns a combined result.

## Tech stack

- Python 3.11+, FastAPI, Uvicorn
- `transformers` + `torch` (CPU-only build) for the language model
- `trafilatura` for article URL extraction
- `pytesseract` + `Pillow` for screenshot OCR (requires the Tesseract binary installed on the server, not just the pip package)
- `youtube-transcript-api` for YouTube caption extraction
- `requests` for calling the Google Fact Check Tools API
- `python-multipart` for file uploads
- `python-dotenv` for environment variables

## Core architecture

```
Input (text / article URL / screenshot upload / YouTube URL)
        │
        ▼
Extraction layer → clean text (+ source domain, if available)
        │
        ▼
┌─────────────────────────────────────────┐
│ 1. Language model verdict                │
│ 2. Fact-check lookup                      │
│ 3. Source credibility check               │
│    (only runs if a domain is available)   │
└─────────────────────────────────────────┘
        │
        ▼
Combined JSON response with all three signals
```

## Endpoints

### `POST /extract/article`
- Body: `{ "url": "https://..." }`
- Use `trafilatura` to fetch and extract clean article text and title
- Response: `{ "text": "...", "title": "...", "domain": "example.com" }`
- If extraction fails (paywall, JS-heavy site, blocked scraper), return a clear error message: `"Couldn't extract this article automatically — try pasting the text directly."` Don't let it crash the request.

### `POST /extract/screenshot`
- Multipart file upload (image)
- Preprocess with `Pillow` before OCR: convert to grayscale, boost contrast — meaningfully improves accuracy on low-quality screenshots
- Run `pytesseract` OCR to extract text
- Response: `{ "text": "..." }`
- No domain/source info available from a screenshot — don't fabricate one; downstream logic should treat source credibility as "not available" for this input type

### `POST /extract/youtube` (build this after article + screenshot are working)
- Body: `{ "url": "https://youtube.com/watch?v=..." }`
- Use `youtube-transcript-api` to pull the existing caption transcript
- Response: `{ "text": "...", "title": "..." }`
- If no captions exist, return a clear error: `"This video has no captions available — transcript extraction isn't supported yet."` Do not attempt audio transcription (Whisper) in this phase — too heavy for free-tier hosting; note it as a future enhancement in code comments.

### `POST /predict` (language model verdict)
- Body: `{ "text": "..." }`
- Load `vikram71198/distilroberta-base-finetuned-fake-news-detection` **once at startup**, not per-request
- Truncate/pad input the same way the model was trained (max length 512 tokens)
- Response: `{ "label": "Fake" | "Real", "confidence": 0-100 }` — normalize the raw softmax score to a 0–100 integer

### `POST /factcheck` (claim verification)
- Body: `{ "text": "..." }`
- Extract a short claim/query from the text (simplest approach: use the title or first 1–2 sentences)
- Call Google Fact Check Tools API: `GET https://factchecktools.googleapis.com/v1alpha1/claims:search?query={claim}&key={API_KEY}`
- Response if a match is found: `{ "found": true, "rating": "False", "publisher": "PolitiFact", "url": "https://..." }`
- Response if no match: `{ "found": false }`
- Store the API key in an environment variable, never hardcode it

### `POST /credibility` (source credibility)
- Body: `{ "domain": "example.com" }`
- Check the domain against a curated JSON file you maintain locally, e.g. `credibility_list.json`:
  ```json
  {
    "reuters.com": "high",
    "apnews.com": "high",
    "bbc.com": "high",
    "unknown-blog-example.com": "low"
  }
  ```
- If domain isn't in the list, apply basic heuristics: no HTTPS → flag; domain registered very recently (if you add a WHOIS lookup) → flag; otherwise return `"unrated"`
- Response: `{ "domain": "example.com", "tier": "high" | "medium" | "low" | "unrated" }`
- If no domain was available (e.g. screenshot input), skip this check and return `{ "domain": null, "tier": "not_available" }`

### `POST /analyze` (the combined endpoint the frontend actually calls)
- Body: `{ "input_type": "text" | "article_url" | "screenshot" | "youtube_url", ...type-specific fields }`
- Internally: run the correct extraction step first, then call the three signal functions (language model, fact-check, credibility) — credibility only if a domain exists
- Response shape (this is what the frontend should be built against):
  ```json
  {
    "extracted_text": "...",
    "language_verdict": { "label": "Fake", "confidence": 78 },
    "fact_check": { "found": true, "rating": "False", "publisher": "PolitiFact", "url": "..." },
    "source_credibility": { "domain": "example.com", "tier": "low" }
  }
  ```

## Error handling requirements

- Every extraction step must fail gracefully with a clear, specific error message — never a raw stack trace to the client
- If one signal fails (e.g. Fact Check API times out) but the others succeed, still return a partial result rather than failing the whole `/analyze` call — mark the failed signal as `{ "error": "Fact-check service unavailable" }` instead of blocking everything
- Validate file uploads (screenshot) for size and image type before processing

## CORS

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-domain.vercel.app"],  # tighten before submission, don't leave as "*"
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Deployment notes

- Target free-tier hosting (Render/Railway) — keep the Docker image lean: use CPU-only `torch` wheel, not the full CUDA build
- Load the language model once at app startup (module-level, not inside a route function) to avoid reloading weights on every request
- Set reasonable timeouts on the article/YouTube extraction calls (external requests can hang) — 10-15 seconds is a sensible cap

## What NOT to build in this phase

- No Instagram Reels support — explicitly out of scope
- No audio transcription (Whisper) for YouTube videos without captions — future enhancement only
- No user authentication/accounts — this is a stateless tool, no login needed
- No database — each analysis is a one-off request/response, nothing needs to persist server-side
