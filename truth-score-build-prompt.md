# Build Prompt: Add Truth Score Gauge + Score Breakdown + Credibility Matrix

Add three new pieces to the existing results section, in this priority order: (1) a composite Truth Score gauge, (2) a score breakdown, (3) a source credibility matrix table. Do not change the existing input card, tabs, or animation system — this only extends the results section. Keep using the existing design tokens: paper white (`#FAFAF8`), ink (`#1C1B19`), Fraunces/Inter/IBM Plex Mono, the existing muted/tertiary grays, and the existing green/red/amber accents.

## Part 1 — Backend: compute a composite Truth Score

Add this to the `/analyze` response — don't create a new endpoint, extend the existing one.

**New field on the response:**
```json
"truth_score": {
  "overall": 78,
  "breakdown": {
    "source_reliability": 86,
    "language_confidence": 74,
    "fact_check_match": 90
  },
  "label": "Mostly Reliable"
}
```

**Scoring logic** (add as a new function, e.g. `truth_score_service.py`):

- `source_reliability` (0–100): derived from `source_credibility.tier`
  - `high` → 90, `medium` → 65, `low` → 20, `unrated`/`not_available` → 50 (neutral midpoint, not a penalty — absence of data isn't evidence of unreliability)
- `language_confidence` (0–100): directly from `language_verdict.confidence`, but invert it if the label is "Fake" — i.e. this sub-score should represent "how reliable does the language look," so a high-confidence "Fake" verdict should produce a LOW language_confidence sub-score, not a high one
  - `language_confidence = verdict.confidence if label == "Real" else (100 - verdict.confidence)`
- `fact_check_match` (0–100): from `fact_check`
  - if `found` is true and `rating` indicates true/accurate → 90–100
  - if `found` is true and `rating` indicates false/misleading → 0–20
  - if `found` is true but rating is ambiguous (mixed, partly true, etc.) → 50
  - if `found` is false (no matching fact-check) → 50 (neutral — absence of a fact-check isn't evidence either way)
  - if `error` present → `null`, and exclude this sub-score from the weighted average entirely (don't silently treat a failed lookup as neutral 50 in the average — a genuinely missing signal should just not count, not be papered over)

**Overall score** — weighted average of whichever sub-scores are actually available (re-normalize weights if one is missing due to an error):
```
overall = (source_reliability × 0.30) + (language_confidence × 0.35) + (fact_check_match × 0.35)
```

**Label mapping from `overall`:**
- 80–100 → "Highly Reliable"
- 60–79 → "Mostly Reliable"
- 40–59 → "Mixed Signals"
- 20–39 → "Likely Unreliable"
- 0–19 → "Highly Unreliable"

Round all scores to integers. If literally every sub-score is unavailable (all three errored), return `truth_score: null` and have the frontend hide the gauge entirely rather than showing a fabricated number.

## Part 2 — Frontend: Truth Score gauge

New component: `components/results/TruthScoreGauge.tsx`. Place it at the TOP of the results section, above the existing verdict stamp card.

- Circular ring gauge, SVG-based (`<circle>` with `stroke-dasharray` trick, or a small charting approach — keep it dependency-light, don't pull in a full charting library for one gauge)
- Large mono/serif number in the center (Fraunces, bold, ~40px) showing the score, e.g. `78`, with `/100` beneath it in smaller muted text
- Ring color reflects the score tier: 80+ green (`#2F6B4F`), 60-79 a slightly lighter green-leaning tone, 40-59 amber (`#B8862F`), below 40 red (`#A13D3D`) — reuse existing accent colors, don't invent new ones
- Below the ring: the label text (e.g. "Mostly Reliable") in Fraunces, medium weight
- One small line of muted body text underneath summarizing in plain language — you can generate this from the label + top contributing factor, e.g. `"Backed by a credible source, but fact-check coverage is limited."` Keep this short, one sentence.
- **Animation**: the ring fills from 0 to its final value on mount — a single arc-drawing animation (`stroke-dashoffset` animating), ~800ms ease-out. The center number counts up from 0 to its final value over the same duration. This is allowed as a second "moment" animation alongside the existing verdict stamp spring — but only these two, nothing else gets new animation.
- If `truth_score` is `null`, don't render this component at all — fall back to showing just the existing verdict stamp as before.

## Part 3 — Frontend: Score Breakdown

New component: `components/results/ScoreBreakdown.tsx`. Place directly below the gauge, inside the same card or as a tightly-coupled section beneath it (visually one unit, not a separate floating card).

- Heading: `Score Breakdown` in mono uppercase, small, muted, left-aligned
- Three rows, one per sub-score, each with: a small line icon (reuse simple icon style already used in HowItWorks), a label (`Source Reliability`, `Language Pattern`, `Fact-Check Match`), a horizontal progress bar, and the number (`86/100`) right-aligned in mono type
- Bar fill color per-row can match that row's own tier (same 4-color scale as the gauge), not all one color — this visually explains WHY the overall score landed where it did
- If a sub-score is `null` (excluded due to error), show that row grayed out with the bar empty and the text `"unavailable"` instead of a number — don't hide the row entirely, showing it as unavailable is more honest than silently dropping it
- Animation: bars fill from 0 to value with a small stagger (~80ms between rows), same easing as the existing confidence bar pattern already in the codebase — reuse that existing animation, don't invent a new easing curve

## Part 4 — Frontend: Source Credibility Matrix

New component: `components/results/CredibilityMatrix.tsx`. This REPLACES the current `CredibilityCard.tsx` display — don't run both side by side, the matrix supersedes the simple badge card.

Since your backend currently returns one primary source (the analyzed article/video) plus related articles from `news_search_service`, build the table from both combined:

| Column | Content |
|---|---|
| Source | Domain or channel name, small favicon-style circle with the first letter as a fallback (no real favicon fetching needed — a colored circle with initial is fine and matches the minimal aesthetic) |
| Trust Score | Numeric tier converted to a rough score for display (`high`→90, `medium`→65, `low`→20, `unrated`→50), shown as a small number + thin bar, same color scale as the gauge |
| Stance | For the primary source: blank or "Original". For related articles: you don't have real stance detection, so don't fabricate "Supporting/Contradicting" labels — instead show "Also reported this story" as a neutral, honest label for every related article. Do not claim stance analysis you don't have. |
| Type | "News", "Fact-Check" (if from the fact_check signal), or "Related Coverage" for cross-referenced articles |

- Table rows fade in with a small stagger, same pattern as the other result cards
- Keep row height compact, hairline dividers between rows (`#E4E1DA`), no heavy borders or shadows on individual rows — only the outer table container gets the card shadow treatment already used elsewhere
- Cap the table at the primary source + up to 5 related articles (matches your existing `MAX_RESULTS` backend limit) — if there are zero related articles, show just the primary source row plus a muted line: `"No other coverage found for this story yet."`

## Layout order in the results section (top to bottom)

1. Article summary (existing `SummaryCard`, unchanged)
2. **Truth Score gauge** (new)
3. **Score breakdown** (new, visually attached to the gauge)
4. Verdict stamp (existing `VerdictCard`, unchanged — keep it, it's still the clear plain-language answer)
5. Fact-check card (existing, unchanged)
6. **Source Credibility Matrix** (new — replaces the old simple `CredibilityCard`)
7. "Why we say this" explanation (existing, unchanged)

## What NOT to do

- Don't fabricate data you don't have — no fake "stance" detection, no invented sub-scores, no propagation/virality/reach numbers of any kind
- Don't add a charting library dependency for the gauge — a hand-built SVG arc is enough and keeps the bundle small
- Don't change the existing tab system, input card, or the existing verdict stamp/fact-check card behavior
- Don't add more than the two described animation moments (gauge fill + breakdown bar stagger) beyond what already exists in the codebase
- Don't invent new accent colors — reuse the existing green/amber/red/gray scale everywhere
