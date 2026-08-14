"""
Quick smoke-test for the two bug fixes.

Run from the backend/ directory:
    python test_fixes.py

No server needed — tests the service functions directly.
"""

import sys
import urllib.parse

# ─────────────────────────────────────────────────────────────────────────────
# Bug 2: domain stripping — no imports needed, pure Python
# ─────────────────────────────────────────────────────────────────────────────

def extract_domain(url: str):
    parsed = urllib.parse.urlparse(url)
    netloc = parsed.netloc
    return netloc[4:] if netloc.startswith("www.") else netloc if netloc else None


def test_domain_stripping():
    print("\n-- Bug 2: domain stripping ----------------------------------")
    cases = [
        ("https://www.washingtonpost.com/article", "washingtonpost.com"),
        ("https://www.wsj.com/article",            "wsj.com"),
        ("https://www.wired.com/story",             "wired.com"),
        ("https://reuters.com/world",               "reuters.com"),
        ("https://www.bbc.com/news",                "bbc.com"),
        ("https://apnews.com/article",              "apnews.com"),
        ("https://www.unknown-blog-example.com/",  "unknown-blog-example.com"),
    ]
    passed = 0
    for url, expected in cases:
        got = extract_domain(url)
        ok = "✅" if got == expected else "❌"
        if got != expected:
            print(f"{ok} {url}")
            print(f"   expected : {expected!r}")
            print(f"   got      : {got!r}")
        else:
            print(f"{ok} {url!r}  →  {got!r}")
            passed += 1
    print(f"\n{passed}/{len(cases)} domain tests passed")
    return passed == len(cases)


# ─────────────────────────────────────────────────────────────────────────────
# Bug 1: LM label resolution — no model download needed
# ─────────────────────────────────────────────────────────────────────────────

def test_label_resolution():
    print("\n-- Bug 1: label resolution (_resolve_label) -----------------")

    try:
        import app.services.lm_service as lm
    except ModuleNotFoundError:
        print("SKIP: 'transformers' not installed. Run after: pip install transformers")
        return True  # don't count as failure

    # Monkey-patch the module-level _classifier to None so we test
    # the non-config path (steps 1 and 3 of the cascade)
    lm._classifier = None   # simulate LABEL_N path without loading the model

    cases = [
        ("FAKE",    "Fake"),
        ("REAL",    "Real"),
        ("fake",    "Fake"),
        ("real",    "Real"),
        ("LABEL_0", "Fake"),   # positional fallback
        ("LABEL_1", "Real"),   # positional fallback
    ]
    passed = 0
    for raw, expected in cases:
        got = lm._resolve_label(raw)
        ok = "✅" if got == expected else "❌"
        print(f"{ok} _resolve_label({raw!r})  →  {got!r}  (expected {expected!r})")
        if got == expected:
            passed += 1

    print(f"\n{passed}/{len(cases)} label resolution tests passed")
    return passed == len(cases)


# ─────────────────────────────────────────────────────────────────────────────
# Credibility lookup sanity check (no model, no API key)
# ─────────────────────────────────────────────────────────────────────────────

def test_credibility():
    print("\n-- Credibility lookup ----------------------------------------")
    try:
        from app.services.credibility_service import check
    except ModuleNotFoundError:
        print("SKIP: dependencies not installed.")
        return True

    cases = [
        ("reuters.com",         "high"),
        ("apnews.com",          "high"),
        ("washingtonpost.com",  "high"),   # would have been 'unrated' with old lstrip bug
        ("wsj.com",             "high"),   # ditto
        ("wired.com",           "medium"),
        ("infowars.com",        "low"),
        ("totally-unknown.xyz", "unrated"),
        (None,                  "not_available"),
    ]
    passed = 0
    for domain, expected_tier in cases:
        result = check(domain)
        got = result["tier"]
        ok = "✅" if got == expected_tier else "❌"
        print(f"{ok} check({domain!r})  →  tier={got!r}  (expected {expected_tier!r})")
        if got == expected_tier:
            passed += 1

    print(f"\n{passed}/{len(cases)} credibility tests passed")
    return passed == len(cases)


# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    all_passed = True
    all_passed &= test_domain_stripping()
    all_passed &= test_label_resolution()
    all_passed &= test_credibility()

    print("\n" + ("=" * 55))
    if all_passed:
        print("All tests passed ✅")
    else:
        print("Some tests FAILED ❌ — see output above")
        sys.exit(1)
