# Follow-up Prompt: Elevate the Fake News Detector Frontend

The core build (input card, tabs, result cards, animation) is correct and should NOT be changed. The problem is the page around it feels empty and unfinished — like a floating component, not a website. Fix that by adding structure and visual weight, without adding more animation or breaking the existing minimal palette/type system.

## 1. Add a simple wordmark, top-left

- Small mono-uppercase text lockup, e.g. `VERUS` or `CLARITY` (pick something short, editorial, unrelated to "AI" buzzwords) + a tiny mark next to it — a simple geometric shape (a small circle with a checkmark notch, or a minimal stamp-outline icon) in the ink color, no gradient, no 3D
- Fixed at the top of the page, small, quiet — not a full nav bar, just identity. This alone makes it stop looking like a demo.

## 2. Add subtle background depth

- Right now the background is flat `#FAFAF8` everywhere — add a very faint radial gradient or grain texture (barely visible, like paper texture) behind the whole page so it isn't a flat rectangle
- Alternative: a very faint large-scale geometric watermark (a huge, barely-visible outline of a magnifying glass or checkmark) positioned off-center in the background — opacity under 5%, decorative only, never distracting
- This should be almost subconscious — the person shouldn't consciously notice it, just feel the page has more depth than pure flat white

## 3. Add a "How it works" section below the input card

Three-column (stacks on mobile) row, appears after the input card, before the footer disclaimer:

- Column 1 — icon (simple line icon) + short label `Language analysis` + one line: "Checks writing patterns against known real and fake news."
- Column 2 — icon + `Fact-check lookup` + "Cross-references claims with fact-checking organizations."
- Column 3 — icon + `Source credibility` + "Rates the publisher against a curated reliability list."

Keep this quiet: mono uppercase labels, muted body text, thin hairline dividers between columns (or generous gap on mobile), no cards/boxes/shadows here — this section should read as informational, not another UI component competing with the main card.

## 4. Add a small "Try an example" affordance under the input card

- One line of muted text with 2–3 clickable inline example chips, e.g.: `Try an example: [A viral health claim] [A political headline] [A local news story]`
- Clicking one pre-fills the "Paste text" tab with a short example and switches to that tab automatically
- This solves the "empty state" problem — right now a first-time visitor has a blank card and no idea what a good input looks like

## 5. Give the card itself more presence

- Increase the card's shadow slightly on the resting state (currently near-invisible) — something like `0 4px 24px rgba(28,27,25,0.06)` instead of the barely-there current shadow, so it visually lifts off the page rather than blending into it
- Add a bit more internal padding — the current card reads slightly cramped relative to the whitespace around it

## 6. Footer — expand slightly, don't just leave one disclaimer line floating

- Keep the disclaimer line
- Add a second, smaller line beneath it: the data sources used, e.g. `Powered by DistilRoBERTa · Google Fact Check Tools · a curated source list` in faint mono text — this adds credibility and fills the dead space at the bottom

## What NOT to do

- Don't add a nav bar with multiple links/pages — this is still a single-page tool
- Don't add more animation — everything added here should be static or, at most, a simple fade-in on page load
- Don't change the existing input card, tabs, or result card behavior — those are correct as built
- Don't introduce new colors outside the existing palette (background texture and icons should use the existing ink/muted-gray tones, not new accent colors)
- Don't make the background texture or watermark noticeable enough to distract from the input card, which stays the visual priority
