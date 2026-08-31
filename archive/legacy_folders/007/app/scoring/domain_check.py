"""
domain_check.py
-----------------
Checks a sender's domain against a protected-brand list for typosquatting
using edit distance. Offline-only (see url_analyzer.py's note on WHOIS/
domain-age checks needing real network access to be meaningful).
"""
try:
    import Levenshtein
    def _distance(a, b):
        return Levenshtein.distance(a, b)
except ImportError:
    def _distance(a, b):
        # Fallback pure-python Levenshtein if the C extension isn't available
        if len(a) < len(b):
            a, b = b, a
        prev = list(range(len(b) + 1))
        for i, ca in enumerate(a, 1):
            cur = [i]
            for j, cb in enumerate(b, 1):
                cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
            prev = cur
        return prev[-1]

PROTECTED_BRANDS = [
    "google.com", "microsoft.com", "paypal.com", "apple.com", "amazon.com",
    "netflix.com", "facebook.com", "chase.com", "wellsfargo.com", "dropbox.com",
    "docusign.com", "office365.com", "outlook.com", "hdfcbank.com", "icicibank.com",
    "sbi.co.in", "onlinesbi.com",
]


LEET_MAP = str.maketrans({"1": "l", "0": "o", "3": "e", "5": "s", "4": "a", "7": "t"})


def _normalize_label(label: str) -> str:
    """Undoes common leetspeak substitutions (1->l, 0->o, etc.) so
    'paypa1' normalizes to 'paypal' before comparison."""
    return label.translate(LEET_MAP)


def check_lookalike_domain(domain: str) -> dict:
    domain = (domain or "").lower().strip()
    if not domain:
        return {"domain": domain, "is_lookalike": False, "closest_brand": None, "edit_distance": None}

    # Compare against both the raw registrable label and a de-leeted,
    # hyphen/digit-stripped core label, since real typosquats commonly look
    # like "paypa1-secure.com" or "amaz0n-support.net" rather than a clean
    # one-character edit of the full domain string.
    core_label = domain.split(".")[0]
    core_normalized = _normalize_label(core_label).replace("-", "")

    best_brand, best_dist, matched_on = None, 999, "domain"
    strong_pattern_match = False
    for brand in PROTECTED_BRANDS:
        brand_label = brand.split(".")[0]

        d_full = _distance(domain, brand)
        if d_full < best_dist:
            best_brand, best_dist, matched_on = brand, d_full, "domain"

        d_core = _distance(core_normalized, brand_label)
        if d_core < best_dist:
            best_brand, best_dist, matched_on = brand, d_core, "core_label"

        # Classic phishing pattern: brand name + suffix, e.g.
        # "paypal-secure", "amazon-support", "paypa1-verify" (after de-leeting).
        # This catches typosquats an edit-distance threshold misses because
        # the appended suffix inflates the raw distance.
        if len(brand_label) >= 4 and core_normalized != brand_label and (
            core_normalized.startswith(brand_label) or core_normalized.endswith(brand_label)
        ):
            best_brand, best_dist, matched_on = brand, 1, "brand_plus_suffix_pattern"
            strong_pattern_match = True

        # Brand name appears as its own hyphen-delimited token anywhere in the
        # domain, e.g. "secure-paypal-login.com" — a very common phishing
        # pattern that startswith/endswith alone would miss.
        hyphen_tokens = _normalize_label(core_label).split("-")
        if len(brand_label) >= 4 and brand_label in hyphen_tokens and domain != brand:
            best_brand, best_dist, matched_on = brand, 1, "brand_as_hyphen_token"
            strong_pattern_match = True

    is_lookalike = domain != best_brand and (strong_pattern_match or best_dist <= 2)
    return {
        "domain": domain,
        "is_lookalike": is_lookalike,
        "closest_brand": best_brand,
        "edit_distance": best_dist,
        "matched_on": matched_on,
    }
