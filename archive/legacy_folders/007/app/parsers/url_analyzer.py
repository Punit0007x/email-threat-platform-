"""
url_analyzer.py
----------------
Analyzes URLs found in an email body/HTML for phishing/fraud indicators.

IMPORTANT SCOPE NOTE: this runs fully offline. It does NOT call VirusTotal,
Google Safe Browsing, PhishTank, or resolve live redirect chains, because
this build environment has no general internet egress. Every finding here is
a *local heuristic* — say that plainly if asked how link-checking works.
The `LiveThreatIntelClient` stub at the bottom shows exactly where to wire in
a real API (VirusTotal / Google Safe Browsing / urlscan.io) once you have a
key and deploy somewhere with outbound internet access — that swap requires
no changes anywhere else in the pipeline.
"""
import re
import unicodedata
from difflib import SequenceMatcher
from urllib.parse import urlparse

URL_RE = re.compile(r"https?://[^\s<>\"'\)]+")

SUSPICIOUS_TLDS = {
    ".zip", ".mov", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".xyz",
    ".review", ".country", ".kim", ".work", ".click", ".link", ".gdn",
}
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "rebrand.ly", "cutt.ly", "shorte.st", "adf.ly",
}
CREDENTIAL_PATH_KEYWORDS = [
    "login", "signin", "sign-in", "verify", "secure", "update", "confirm",
    "account", "password", "wp-admin", "webscr", "banking",
]
# A small set of commonly-impersonated brands for typosquat detection.
# Extend this list with brands relevant to your users/org.
PROTECTED_BRANDS = [
    "google.com", "microsoft.com", "paypal.com", "apple.com", "amazon.com",
    "netflix.com", "facebook.com", "instagram.com", "chase.com", "wellsfargo.com",
    "dropbox.com", "docusign.com", "office365.com", "outlook.com", "hdfcbank.com",
    "icicibank.com", "sbi.co.in", "onlinesbi.com",
]


def extract_urls(text: str, html: str = ""):
    urls = set(URL_RE.findall(text or ""))
    if html:
        urls |= set(re.findall(r'href=["\']?(https?://[^"\'\s>]+)', html))
    return list(urls)


def _is_ip_literal(host: str) -> bool:
    return bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host or ""))


def _has_punycode(host: str) -> bool:
    return "xn--" in (host or "")


def _mixed_script(host: str) -> bool:
    """Flags homograph attacks: hostnames mixing Latin with other scripts
    (e.g. Cyrillic 'а' that looks identical to Latin 'a')."""
    scripts = set()
    for ch in host or "":
        if ch.isalpha():
            try:
                name = unicodedata.name(ch)
            except ValueError:
                continue
            if "LATIN" in name:
                scripts.add("LATIN")
            elif "CYRILLIC" in name:
                scripts.add("CYRILLIC")
            elif "GREEK" in name:
                scripts.add("GREEK")
    return len(scripts) > 1


def _closest_brand(host: str):
    best_brand, best_ratio = None, 0.0
    bare = host.replace("www.", "")
    for brand in PROTECTED_BRANDS:
        ratio = SequenceMatcher(None, bare, brand).ratio()
        if ratio > best_ratio:
            best_brand, best_ratio = brand, ratio
    return best_brand, best_ratio


def analyze_url(url: str) -> dict:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    path = (parsed.path or "").lower()
    tld = "." + host.split(".")[-1] if "." in host else ""

    findings = []
    risk = 0

    if _is_ip_literal(host):
        findings.append("URL uses a raw IP address instead of a domain name")
        risk += 30
    if _has_punycode(host):
        findings.append("Domain uses punycode (xn--) encoding, often used to spoof lookalike domains")
        risk += 25
    if _mixed_script(host):
        findings.append("Domain mixes character scripts (possible homograph/lookalike attack)")
        risk += 30
    if tld in SUSPICIOUS_TLDS:
        findings.append(f"Uses a TLD frequently abused for phishing/malware ({tld})")
        risk += 15
    if host in URL_SHORTENERS:
        findings.append(f"Uses a URL shortener ({host}) which hides the real destination")
        risk += 15
    if any(kw in path for kw in CREDENTIAL_PATH_KEYWORDS):
        findings.append("URL path contains credential/account-related keywords typical of phishing pages")
        risk += 10
    if parsed.scheme == "http":
        findings.append("Uses unencrypted HTTP rather than HTTPS")
        risk += 5
    if host.count("-") >= 3 or host.count(".") >= 4:
        findings.append("Unusually long/hyphenated hostname (common in disposable phishing domains)")
        risk += 10

    brand, ratio = _closest_brand(host)
    if brand and 0.72 <= ratio < 0.98 and host != brand:
        findings.append(f"Domain closely resembles '{brand}' (similarity {ratio:.2f}) — possible typosquat")
        risk += 35

    risk = min(risk, 100)
    return {
        "url": url,
        "host": host,
        "risk_score": risk,
        "findings": findings,
    }


def analyze_urls_in_email(text: str, html: str = "") -> dict:
    urls = extract_urls(text, html)
    results = [analyze_url(u) for u in urls]
    max_risk = max((r["risk_score"] for r in results), default=0)
    return {
        "url_count": len(urls),
        "unique_domains": len({r["host"] for r in results}),
        "max_url_risk": max_risk,
        "url_findings": results,
    }


class LiveThreatIntelClient:
    """
    STUB — wire this up when deployed with real internet access + API keys.
    Example providers: Google Safe Browsing, VirusTotal, urlscan.io.
    Not implemented here since this build environment cannot reach those
    hosts; calling this raises NotImplementedError on purpose rather than
    silently returning fake "clean" results.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key

    def check_url(self, url: str) -> dict:
        raise NotImplementedError(
            "Live threat-intel lookup requires deployment with outbound internet "
            "access and a real API key. Configure and implement this before "
            "relying on it — do not fake a 'clean' result."
        )
