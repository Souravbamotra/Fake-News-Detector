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
# Truth Score calculation
# ─────────────────────────────────────────────────────────────────────────────

def test_truth_score():
    print("\n-- Truth score calculation (truth_score_service) -------------")
    try:
        from app.services.truth_score_service import calculate_truth_score
    except ModuleNotFoundError:
        print("SKIP: dependencies not installed.")
        return True

    # Case 1: All signals positive
    res1 = calculate_truth_score(
        {"label": "Real", "confidence": 80},
        {"found": True, "rating": "Accurate"},
        {"tier": "high", "domain": "reuters.com"},
    )
    assert res1 is not None
    assert res1["overall"] == 88, f"Expected 88, got {res1['overall']}"
    assert res1["label"] == "Highly Reliable"
    assert res1["breakdown"]["source_reliability"] == 90
    assert res1["breakdown"]["language_confidence"] == 80
    assert res1["breakdown"]["fact_check_match"] == 95
    print("✅ Case 1: High reliability score (all signals positive) → 88 (Highly Reliable)")

    # Case 2: Fake news with debunked fact-check
    res2 = calculate_truth_score(
        {"label": "Fake", "confidence": 90},
        {"found": True, "rating": "False / Misleading"},
        {"tier": "low", "domain": "infowars.com"},
    )
    assert res2 is not None
    assert res2["overall"] == 13, f"Expected 13, got {res2['overall']}"
    assert res2["label"] == "Highly Unreliable"
    assert res2["breakdown"]["source_reliability"] == 20
    assert res2["breakdown"]["language_confidence"] == 10
    assert res2["breakdown"]["fact_check_match"] == 10
    print("✅ Case 2: Fake news debunked → 13 (Highly Unreliable)")

    # Case 3: Re-normalization when fact-check signal has error
    res3 = calculate_truth_score(
        {"label": "Real", "confidence": 74},
        {"found": False, "error": "Quota exceeded"},
        {"tier": "high", "domain": "apnews.com"},
    )
    assert res3 is not None
    assert res3["breakdown"]["fact_check_match"] is None
    assert res3["overall"] == 81, f"Expected 81, got {res3['overall']}"
    assert res3["label"] == "Highly Reliable"
    print("✅ Case 3: Re-normalization on error signal → 81 (fact_check_match is None)")

    # Case 4: All signals error out → None
    res4 = calculate_truth_score(
        {"error": "LM down"},
        {"found": False, "error": "FC down"},
        {"error": "Cred down", "tier": "not_available"},
    )
    assert res4 is None
    print("✅ Case 4: All signals error → None")

    print("\n4/4 truth score tests passed")
    return True


# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    all_passed = True
    all_passed &= test_domain_stripping()
    all_passed &= test_label_resolution()
    all_passed &= test_credibility()
    all_passed &= test_truth_score()

    print("\n" + ("=" * 55))
    if all_passed:
        print("All tests passed ✅")
    else:
        print("Some tests FAILED ❌ — see output above")
        sys.exit(1)
