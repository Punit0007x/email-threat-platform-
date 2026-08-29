"""
feature_extractor.py
---------------------
Extracts transparent, documented structural/lexical features from email text.
These are combined with TF-IDF text features inside the model pipeline
(see train_model.py) — they are NOT applied as post-hoc score bonuses/penalties
on top of the model's output. That distinction is the whole point of this
rewrite: every signal here is a *feature the model learns weights for*, not a
hardcoded arithmetic override applied after the fact.
"""
import re
from urllib.parse import urlparse

URGENCY_WORDS = [
    "urgent", "immediately", "action required", "verify your account",
    "suspend", "suspended", "expire", "expires", "within 24 hours",
    "click here", "act now", "final notice", "confirm your identity",
    "unauthorized", "unusual activity", "limited time", "as soon as possible",
]
FINANCIAL_WORDS = [
    "wire transfer", "bank account", "invoice", "payment", "bitcoin", "btc",
    "cryptocurrency", "routing number", "swift code", "remit", "refund",
    "gift card", "western union",
]
URL_RE = re.compile(r"https?://[^\s<>\"']+")


def extract_urls(text: str):
    return URL_RE.findall(text or "")


def features(text: str, sender_domain: str = "", subject: str = "") -> dict:
    text = text or ""
    subject = subject or ""
    full = f"{subject}\n{text}"
    lower = full.lower()
    urls = extract_urls(full)
    words = re.findall(r"[A-Za-z']+", full)
    n_words = max(len(words), 1)
    n_caps_words = sum(1 for w in words if len(w) > 2 and w.isupper())

    return {
        "n_urls": len(urls),
        "n_unique_domains": len({urlparse(u).netloc for u in urls}),
        "urgency_word_count": sum(lower.count(w) for w in URGENCY_WORDS),
        "financial_word_count": sum(lower.count(w) for w in FINANCIAL_WORDS),
        "exclamation_count": full.count("!"),
        "all_caps_word_ratio": n_caps_words / n_words,
        "has_generic_greeting": int(bool(re.search(
            r"\bdear (customer|user|member|sir/?madam|valued)\b", lower))),
        "subject_len": len(subject),
        "body_len": len(text),
        "has_attachment_keyword": int(bool(re.search(
            r"\battach(ed|ment)\b", lower))),
        "money_amount_mentions": len(re.findall(
            r"[$₹€£]\s?\d[\d,]*(\.\d+)?", full)),
    }


FEATURE_NAMES = list(features("", "", "").keys())


def features_vector(text: str, sender_domain: str = "", subject: str = ""):
    f = features(text, sender_domain, subject)
    return [f[name] for name in FEATURE_NAMES]
