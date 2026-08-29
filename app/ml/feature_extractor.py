import re
import math
from typing import Dict, Any, List
from bs4 import BeautifulSoup

# Suspicious file extensions associated with email malware / quishing / initial access
SUSPICIOUS_EXTENSIONS = {
    ".exe", ".scr", ".vbs", ".js", ".bat", ".cmd", ".ps1", ".hta",
    ".iso", ".img", ".vhd", ".docm", ".xlsm", ".pptm", ".dotm",
    ".xltm", ".zip", ".rar", ".7z", ".tar.gz", ".ace", ".arj", ".wsf",
    ".lnk", ".url", ".iqy"
}

# Social Engineering keywords and categories
MANIPULATION_PATTERNS = {
    "urgency": [
        r"\burgen(t|cy)\b", r"\bimmediate(ly)?\b", r"\bright now\b", r"\basap\b",
        r"\bact now\b", r"\bwithin \d+\s*(hours?|mins?|minutes?|days?)\b",
        r"\btime[-\s]sensitive\b", r"\bexpires?\s*(in|soon|today)?\b",
        r"\blast chance\b", r"\bdeadline\b", r"\bdo not delay\b"
    ],
    "fear_intimidation": [
        r"\baccount\s+(suspended|terminated|locked|closed|disabled)\b",
        r"\blegal action\b", r"\blawsuit\b", r"\barrest warrant\b", r"\bpolice\b",
        r"\bfbi\b", r"\birs\b", r"\bpenalty\b", r"\bconfiscated\b", r"\bbreached\b",
        r"\bunauthorized (access|activity|sign[- ]in)\b", r"\bcompromised\b",
        r"\bconsequences\b", r"\bfailure to respond\b", r"\bblackmail\b"
    ],
    "authority": [
        r"\bceo\b", r"\bcfo\b", r"\bexecutive director\b", r"\bboard of directors\b",
        r"\bhuman resources\b", r"\bpayroll department\b", r"\bit helpdesk\b",
        r"\bglobal security\b", r"\bcompliance officer\b", r"\bmanagement team\b",
        r"\bofficial notice\b", r"\bgovernment agency\b"
    ],
    "financial_greed": [
        r"\bwire transfer\b", r"\bdirect deposit\b", r"\bpayroll\b", r"\bbank account\b",
        r"\binvoice overdue\b", r"\bremittance\b", r"\boutstanding payment\b",
        r"\blottery\b", r"\binheritance\b", r"\bcompensation fund\b", r"\bgrant\b",
        r"\brefund available\b", r"\bsettlement payout\b", r"\bgift card\b", r"\bcrypto(currency)?\b"
    ],
    "trust_secrecy": [
        r"\bkeep this confidential\b", r"\bdo not tell anyone\b", r"\bbetween us\b",
        r"\bare you at your desk\b", r"\bare you available\b", r"\bprivate matter\b",
        r"\bdiscrete(ly)?\b", r"\bsend to my personal\b", r"\bquick favor\b"
    ]
}

CTA_PATTERNS = {
    "credential_harvesting": [
        r"\bclick here to (verify|login|log in|confirm|update|reactivate)\b",
        r"\bverify your (identity|account|credentials|password|email)\b",
        r"\breset (your )?password\b", r"\bupdate your (details|security|profile)\b",
        r"\benter your (pin|passcode|credentials)\b", r"\bcontinue to (portal|dashboard)\b"
    ],
    "financial_redirection": [
        r"\bupdate (banking|bank|direct deposit|payroll) (details|info|information|account)\b",
        r"\bprocess (this )?(payment|wire|invoice|transaction)\b",
        r"\bpurchase (apple|google play|amazon|steam|itunes) (gift )?cards?\b",
        r"\bsend (the )?funds\b", r"\bremit payment\b"
    ],
    "quishing_qr": [
        r"\bscan (the |this )?(qr|code|qr-code)\b",
        r"\bcamera to scan\b", r"\bqr code attached\b"
    ],
    "malware_macro": [
        r"\benable (editing|content|macros)\b", r"\bopen (the )?attached (file|document|archive|iso|image)\b",
        r"\bdownload (the )?(attachment|invoice|statement|receipt|update)\b"
    ],
    "remote_access": [
        r"\banydesk\b", r"\bteamviewer\b", r"\bquickassist\b", r"\blogmein\b",
        r"\bconnect to (agent|technician|representative)\b"
    ]
}

def calculate_shannon_entropy(text: str) -> float:
    """Calculates Shannon entropy of the character distribution in a string."""
    if not text:
        return 0.0
    freq: Dict[str, int] = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    entropy = 0.0
    length = len(text)
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 3)

def extract_threat_entities(text: str) -> Dict[str, Any]:
    """Extracts explicit threat indicators such as crypto addresses, phone lures, and financial figures."""
    entities: Dict[str, List[str]] = {
        "crypto_wallets": [],
        "financial_amounts": [],
        "phone_numbers": [],
        "qr_mentions": []
    }
    
    # Bitcoin addresses (P2PKH, P2SH, Bech32)
    btc_matches = re.findall(r"\b(bc1[a-zA-HJ-NP-Z0-9]{25,39}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b", text)
    entities["crypto_wallets"] = list(set(btc_matches))
    
    # Currency amounts (e.g. $5,000, €2500, £10,000, 5000 USD)
    currency_matches = re.findall(r"(\$|€|£|¥)\s?\d+(?:,\d{3})*(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP|CAD|AUD)\b", text, re.IGNORECASE)
    entities["financial_amounts"] = list(set([str(m) if isinstance(m, str) else m[0] for m in currency_matches]))[:5]
    
    # Phone numbers
    phone_matches = re.findall(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    entities["phone_numbers"] = list(set(phone_matches))[:5]
    
    # QR mentions
    if re.search(r"\b(qr[-\s]?code|scan\s+qr)\b", text, re.IGNORECASE):
        entities["qr_mentions"].append("QR Code Reference Detected")
        
    return entities

def extract_advanced_features(
    subject: str,
    body_plain: str,
    body_html: str,
    attachments: List[Any],
    urls: List[str]
) -> Dict[str, Any]:
    """
    Extracts deep lexical, structural, intent, and social engineering features from the email.
    """
    combined_text = f"{subject} {body_plain}".strip()
    full_text_lower = f"{subject} {body_plain} {body_html}".lower()
    
    # 1. Structural & Lexical Metrics
    text_length = len(combined_text)
    words = combined_text.split()
    word_count = len(words)
    alpha_chars = [c for c in combined_text if c.isalpha()]
    upper_chars = [c for c in alpha_chars if c.isupper()]
    
    uppercase_ratio = round(len(upper_chars) / len(alpha_chars), 3) if alpha_chars else 0.0
    entropy = calculate_shannon_entropy(combined_text)
    
    # Punctuation bursts (e.g. "???", "!!!", "$$$")
    punctuation_bursts = len(re.findall(r"([!?$*]){2,}", combined_text))
    
    # 2. Social Engineering Vector Analysis
    manipulation_scores: Dict[str, int] = {}
    detected_manipulations: Dict[str, List[str]] = {}
    
    for category, patterns in MANIPULATION_PATTERNS.items():
        matches = []
        for pat in patterns:
            found = re.findall(pat, full_text_lower, re.IGNORECASE)
            if found:
                # Store sample matched text
                matches.append(pat.replace(r"\b", "").replace(r"\s+", " ").replace("?", ""))
        manipulation_scores[category] = len(matches)
        detected_manipulations[category] = matches
        
    # 3. Call-To-Action (CTA) Intent Scoring
    cta_scores: Dict[str, int] = {}
    cta_detected: Dict[str, List[str]] = {}
    
    for cta_type, patterns in CTA_PATTERNS.items():
        cta_matches = []
        for pat in patterns:
            if re.search(pat, full_text_lower, re.IGNORECASE):
                clean_name = pat.replace(r"\b", "").replace(r"\s*", " ")
                cta_matches.append(clean_name)
        cta_scores[cta_type] = len(cta_matches)
        cta_detected[cta_type] = cta_matches

    # 4. Attachment Threat Vector
    suspicious_attachments = []
    for att in attachments:
        fname = getattr(att, "filename", str(att)).lower()
        for ext in SUSPICIOUS_EXTENSIONS:
            if fname.endswith(ext):
                suspicious_attachments.append({
                    "filename": fname,
                    "risk_extension": ext
                })
                break
                
    # 5. Entity Extractions
    entities = extract_threat_entities(combined_text)
    
    # 6. HTML vs Plain Text Discrepancy (Cloaking check)
    html_present = bool(body_html and len(body_html.strip()) > 0)
    plain_present = bool(body_plain and len(body_plain.strip()) > 0)
    has_cloaking_risk = False
    if html_present and not plain_present:
        has_cloaking_risk = True

    # 7. URL Threat Vectors (Hosting & Credential Harvesting Paths)
    from app.scoring.config import SUSPICIOUS_HOSTING_DOMAINS, SUSPICIOUS_URL_PATHS, URL_SHORTENERS
    from urllib.parse import urlparse
    
    has_suspicious_hosting = False
    has_suspicious_path = False
    has_shortener = False
    matched_suspicious_urls = []
    
    for u in urls:
        u_clean = u.lower().strip()
        try:
            parsed_u = urlparse(u_clean if '://' in u_clean else f'https://{u_clean}')
            h = parsed_u.hostname or ''
            p = parsed_u.path or ''
        except Exception:
            h = u_clean
            p = ''
            
        is_sus = False
        if any(sd in h for sd in SUSPICIOUS_HOSTING_DOMAINS):
            has_suspicious_hosting = True
            is_sus = True
        if any(sp in p for sp in SUSPICIOUS_URL_PATHS):
            has_suspicious_path = True
            is_sus = True
        if any(sh in h for sh in URL_SHORTENERS):
            has_shortener = True
            is_sus = True
            
        if is_sus and u not in matched_suspicious_urls:
            matched_suspicious_urls.append(u)

    return {
        "metrics": {
            "char_count": text_length,
            "word_count": word_count,
            "shannon_entropy": entropy,
            "uppercase_ratio": uppercase_ratio,
            "punctuation_bursts": punctuation_bursts,
            "has_cloaking_risk": has_cloaking_risk
        },
        "manipulation_vectors": {
            "scores": manipulation_scores,
            "detected": detected_manipulations,
            "composite_manipulation_score": min(sum(manipulation_scores.values()) * 15, 100)
        },
        "intent_analysis": {
            "cta_scores": cta_scores,
            "cta_detected": cta_detected,
            "primary_intent": max(cta_scores, key=cta_scores.get) if any(cta_scores.values()) else ("phishing_credential_harvesting" if (has_suspicious_hosting or has_suspicious_path) else "informational_or_benign")
        },
        "url_risks": {
            "has_suspicious_hosting": has_suspicious_hosting,
            "has_suspicious_path": has_suspicious_path,
            "has_shortener": has_shortener,
            "matched_suspicious_urls": matched_suspicious_urls
        },
        "entities": entities,
        "suspicious_attachments": suspicious_attachments,
        "attachment_risk_count": len(suspicious_attachments),
        "url_count": len(urls)
    }


# ---------------------------------------------------------------------------
# 007-rebuild structural feature set (used by the unified threat classifier).
# These are MODEL TRAINING FEATURES — the classifier learns weights for them —
# never post-hoc score bonuses. They are combined with TF-IDF text features
# inside the model pipeline (see train_model.py). Not applied at runtime.
# ---------------------------------------------------------------------------
from urllib.parse import urlparse as _urlparse

_URGENCY_WORDS = [
    "urgent", "immediately", "action required", "verify your account",
    "suspend", "suspended", "expire", "expires", "within 24 hours",
    "click here", "act now", "final notice", "confirm your identity",
    "unauthorized", "unusual activity", "limited time", "as soon as possible",
]
_FINANCIAL_WORDS = [
    "wire transfer", "bank account", "invoice", "payment", "bitcoin", "btc",
    "cryptocurrency", "routing number", "swift code", "remit", "refund",
    "gift card", "western union",
]
_URL_RE = re.compile(r"https?://[^\s<>\"']+")


def extract_urls(text: str):
    return _URL_RE.findall(text or "")


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
        "n_unique_domains": len({_urlparse(u).netloc for u in urls}),
        "urgency_word_count": sum(lower.count(w) for w in _URGENCY_WORDS),
        "financial_word_count": sum(lower.count(w) for w in _FINANCIAL_WORDS),
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

