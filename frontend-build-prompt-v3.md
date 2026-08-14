# Build Prompt: Fake News Detector — Frontend

Build a single-page **Next.js (App Router)** frontend for an AI fake news detector. Use **Tailwind CSS** for styling and **Framer Motion** for animation, kept restrained. The page lets the user submit text, an article URL, a screenshot, or a YouTube link, and displays a combined verdict from the backend.

This runs entirely **locally** alongside a local FastAPI backend — no cloud hosting, no cold-starts to account for.

## Tech stack

- Next.js 14+ (App Router)
- Tailwind CSS
- Framer Motion (minimal use — see "Animation rules" below)
- Fonts: `Fraunces` (serif, headline only), `Inter` (body/UI), `IBM Plex Mono` (numbers, labels, eyebrow text) — load via `next/font/google`

## Design direction

Editorial, calm, paper-like — not a generic AI-demo look. Minimal means precise spacing and restraint, not empty. Priority order: **clarity and ease of use first, aesthetic polish second, animation last and lightest.**

**Palette**
- Background: `#FAFAF8` (soft paper white, not pure white)
- Card background: `#FFFFFF`
- Text / ink: `#1C1B19`
- Border / hairline: `#E4E1DA`
- Muted secondary text: `#8A8578`
- Faint tertiary text: `#B7B2A5`
- Verified / real accent: `#2F6B4F` (muted forest green)
- Flagged / fake accent: `#A13D3D` (muted brick red)
- Neutral/unrated accent: `#8A8578` (used when a signal has no data)
- Credibility amber (medium tier only): `#B8862F`

**Type**
- Headline: Fraunces, medium weight (500–600), `clamp(28px, 4.5vw, 42px)`, used ONLY for the main headline
- Body / UI: Inter, regular weight, 14–15px
- Mono: IBM Plex Mono — eyebrow label, confidence numbers, credibility tier badges, source domain text; uppercase with wide letter-spacing (`0.1–0.14em`) for labels

**Layout**
- Single column, centered, max-width ~640px
- Generous whitespace, no clutter
- Order: eyebrow label → headline → subtext → input card (with mode switch) → results area

## Page structure

### 1. Header
- Mono eyebrow label, centered, muted: `AI VERIFICATION`
- Fraunces headline, centered: `Is this news real?`
- One-sentence muted subtext explaining the tool checks language patterns, fact-check databases, and source credibility together

### 2. Input card — THIS IS THE PART THAT MUST STAY SIMPLE

The backend supports four input types, so the UI needs a mode switch. Keep this dead simple — a person should understand it in two seconds:

- **Four pill-shaped tabs** at the top of the card, equal width, clearly labeled with a small icon + text:
  - `Paste text`
  - `Article link`
  - `Screenshot`
  - `YouTube link`
- With four tabs, wrap to a 2×2 grid on narrow screens (below ~480px) rather than shrinking labels illegibly — still just as clear, not cramped
- Only one input control shows at a time based on the active tab — do not show all four inputs stacked at once, that's the "confusing" failure mode to avoid
- Active tab: dark fill background, light text. Inactive tabs: transparent, muted text, hairline border
- Switching tabs should NOT animate the input area's height in a janky way — use a simple crossfade (150–200ms), nothing elaborate

**Tab 1 — Paste text**
- Textarea, borderless, transparent background, 6 rows, placeholder: `"Paste article text or a headline here..."`

**Tab 2 — Article link**
- Single-line text input, placeholder: `"https://example.com/article"`
- Basic client-side validation: must look like a URL before enabling submit

**Tab 3 — Screenshot**
- Drag-and-drop zone + a "Browse files" fallback button
- Accepts PNG, JPEG, WebP, TIFF — reject other types with an inline message, not a silent failure
- Show a small thumbnail preview of the uploaded image before submit
- Max file size 10MB — show a clear inline error if exceeded, don't just fail on submit

**Tab 4 — YouTube link**
- Single-line text input, placeholder: `"https://youtube.com/watch?v=..."`
- Basic client-side validation: must look like a YouTube URL (youtube.com or youtu.be) before enabling submit
- This one has a distinct failure mode worth its own inline message (see Error states below) — many videos simply have no captions, and that's expected, not a bug

**Submit button**
- Pill-shaped, dark fill (`#1C1B19`), light text, bottom-right of the card
- Label changes contextually: `"Check article"` / `"Check article"` / `"Check screenshot"` / `"Check video"` — keep wording close to identical so it doesn't feel like four different features
- Disabled state (no input yet, or already loading) — visually greyed, not clickable
- Hover: `scale: 1.02`. Tap: `scale: 0.98`. That's it — no glow, no color shift.

### 3. Loading state
- Centered mono uppercase text, gentle opacity pulse loop, 1.4s — the ONE ambient animation allowed during loading
- Vary the loading label slightly by input type if easy to do (e.g. `"Analyzing language patterns"` vs `"Reading video transcript"`), but this is a nice-to-have, not required
- No skeleton screens, no spinning icons — a text pulse is enough and stays calm

### 4. Results area — three signal cards, shown together after the API responds

The backend returns three independent signals regardless of input type. Show them as three small, clearly separated cards stacked vertically (not tabs, not hidden behind clicks — the user should see everything at a glance without extra taps):

**Card A — Language verdict** (the primary, most visually prominent result)
- The verdict "stamp": bordered box, border+text color by verdict (green=Real, red=Fake), Fraunces bold uppercase text
- Entrance: single spring animation (scale + slight rotate-in, ~0.4s) — this is the ONE deliberate animation moment on the whole page, everything else stays quiet
- Confidence percentage below in mono type, plus a thin animated progress bar (width animates 0 → value, ease-out, 0.6s)
- If `language_verdict` contains an `error` field instead of a label, show a plain muted message: `"Language analysis unavailable right now."` — do not show a broken/empty card

**Card B — Fact-check result**
- If `fact_check.found` is true: show the rating (e.g. "False", "True", "Misleading"), the publisher name, and a link to the original fact-check review — simple text layout, mono label + regular text value, no heavy styling
- If `found` is false with no error: show a calm neutral message: `"No matching fact-check found for this claim."`
- If `error` is present: `"Fact-check service unavailable right now."`
- No animation needed here beyond a simple fade-in — this card should feel informational, not dramatic

**Card C — Source credibility**
- Show the domain and tier as a small colored badge: high=green, medium=amber, low=red, unrated=gray
- If `tier` is `"not_available"` (screenshot or YouTube input, or no domain): `"Source credibility isn't available for this input type."`
- Simple fade-in, no extra motion

Fade all three cards in with a slight stagger (~80ms apart) as a group when results first arrive — this is the only place a stagger is appropriate, and it should still feel quick and light, not showy.

### 5. Error / failure states (full-request failure, not per-signal)
- If the whole request fails (network error, extraction error, timeout): show a plain-language inline message near the input card, not a toast or alert popup
- Tailor the message to the input type:
  - Article link failure: `"Couldn't process that — try pasting the article text directly."`
  - Screenshot failure: `"That doesn't look like readable text — try a clearer screenshot."`
  - YouTube failure: `"This video has no captions available — try a different video or paste the transcript as text."`
- Never show a raw error code or stack trace
- Let the user immediately retry without losing their input

### 6. Footer
- Small, centered, faint tertiary color: `AI predictions can be wrong — always verify with trusted sources.`

## Animation rules — keep this list short on purpose

1. Tab switch: 150–200ms crossfade only
2. Loading state: one slow opacity pulse loop
3. Verdict stamp: one spring entrance (the single "moment" of the page)
4. Confidence bar: one width animation, ease-out
5. Result cards: simple fade-in with a small stagger
6. Buttons: hover/tap scale only

Nothing else animates. No scroll effects, no parallax, no background motion, no page-transition effects. Respect `prefers-reduced-motion`: fall back to instant opacity-only changes, no scale/rotate/spring, if set.

## API integration

- Base URL from `process.env.NEXT_PUBLIC_API_URL`, set to `http://localhost:8000` for local dev
- Text input → `POST {API_URL}/analyze` with `{ "input_type": "text", "text": "..." }`
- Article link → `POST {API_URL}/analyze` with `{ "input_type": "article_url", "url": "..." }`
- Screenshot → `POST {API_URL}/analyze/screenshot` as `multipart/form-data` with the file
- YouTube link → `POST {API_URL}/analyze` with `{ "input_type": "youtube_url", "youtube_url": "..." }`
- Expected response shape (build the UI against this exactly):
  ```json
  {
    "extracted_text": "...",
    "language_verdict": { "label": "Fake" | "Real", "confidence": 0 },
    "fact_check": { "found": true, "rating": "...", "publisher": "...", "url": "..." },
    "source_credibility": { "domain": "...", "tier": "high" | "medium" | "low" | "unrated" | "not_available" }
  }
  ```
  Any of `language_verdict`, `fact_check`, or `source_credibility` may instead contain only `{ "error": "..." }` — handle that per-card as described above, don't let one failed signal break the other two cards.
- Disable the submit button while a request is in flight
- No need for aggressive cold-start handling since this runs locally — a simple loading state is enough, but still handle network errors gracefully (backend not running, wrong port, etc.) with a clear message like `"Can't reach the backend — make sure it's running on port 8000."`

## Responsiveness & accessibility

- Fully responsive down to 375px width: tabs wrap to 2×2 grid, card padding reduces, headline scales via `clamp()`
- Visible keyboard focus states on all interactive elements (tabs, textarea, url input, file drop zone, button)
- Tab switch must work via keyboard (arrow keys or tab+enter), not mouse-only
- Sufficient color contrast for all accent colors against white/paper backgrounds
- File upload has a proper accessible label; drag-and-drop zone also works via keyboard + file picker

## What NOT to do

- Don't show all four input modes stacked at once — one at a time, via tabs, is the whole point of keeping this simple
- Don't add unrelated UI: no nav bar, no footer links, no hero image, no testimonials, no dark mode toggle
- Don't over-animate — this was explicitly requested as "not too much." If in doubt, cut the animation, not the clarity.
- Don't use more than the three specified fonts
- Don't invent extra result states or badges beyond what the API actually returns
- Don't let a failed signal (error in one of the three cards) block or hide the other two — partial results must always render
- Don't add cloud-deployment concerns (env-based CORS switching, retry-on-cold-start banners) — this is a local-only tool
