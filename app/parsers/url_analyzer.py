"""
url_analyzer.py
----------------
Comprehensive URL Security & Legitimacy Analyzer.

Performs offline heuristic analysis of extracted URLs to differentiate
legitimate/trusted links (e.g., Google Docs, GitHub, Microsoft, corporate portals)
from malicious links (e.g., typosquats, punycode spoofing, raw IP addresses,
tunneling tools, credential harvesters on untrusted domains).
"""
import re
import unicodedata
from difflib import SequenceMatcher
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional, Set

from app.scoring.config import (
    URL_SHORTENERS,
    SUSPICIOUS_HOSTING_DOMAINS,
    SUSPICIOUS_URL_PATHS,
    SPOOFED_BRANDS,
)

# Canonical list of trusted base root domains. Any exact match or subdomain
# (e.g. docs.google.com, login.microsoftonline.com, portal.company.com)
# will be treated as trusted.
TRUSTED_ROOT_DOMAINS: Set[str] = {
    # Google Ecosystem
    "google.com", "google.co.in", "google.co.uk", "google.ca", "google.de",
    "googleapis.com", "gstatic.com", "googleusercontent.com", "forms.gle",
    "youtu.be", "youtube.com", "gmail.com",
    # Microsoft Ecosystem
    "microsoft.com", "office.com", "office365.com", "live.com", "outlook.com",
    "onedrive.com", "sharepoint.com", "azure.com", "azurewebsites.net",
    "microsoftonline.com", "msn.com", "skype.com", "bing.com", "linkedin.com", "github.com", "github.io",
    # Apple & Amazon
    "apple.com", "icloud.com", "amazon.com", "amazon.in", "amazon.co.uk",
    "aws.amazon.com", "amazonaws.com", "media-amazon.com",
    # Developer & Tech Infrastructure
    "gitlab.com", "bitbucket.org", "stackoverflow.com", "docker.com",
    "npmjs.com", "pypi.org", "cloudflare.com", "fastly.com", "akamai.com",
    # Collaboration & Productivity
    "slack.com", "zoom.us", "dropbox.com", "salesforce.com", "zendesk.com",
    "adobe.com", "atlassian.net", "notion.so", "notion.site", "figma.com",
    "trello.com", "canva.com", "miro.com", "jira.com", "confluence.atlassian.net",
    # Social & Communication
    "twitter.com", "x.com", "facebook.com", "instagram.com", "whatsapp.com",
    "threads.net", "reddit.com", "spotify.com", "netflix.com",
    # Finance & Payment Gateways
    "paypal.com", "stripe.com", "razorpay.com", "squareup.com", "intuit.com",
    "sbi.co.in", "onlinesbi.sbi", "hdfcbank.com", "icicibank.com", "axisbank.com",
    # Major CMS / Hosting (trusted core)
    "wordpress.com", "weebly.com", "wixsite.com", "blogspot.com"
}

SUSPICIOUS_TLDS: Set[str] = {
    ".zip", ".mov", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".xyz",
    ".review", ".country", ".kim", ".work", ".click", ".link", ".gdn",
    ".cam", ".bar", ".rest", ".buzz", ".surf", ".monster", ".icu"
}

URL_REGEX = re.compile(r"https?://[^\s<>\"'\)]+")


def extract_urls(text: str, html: str = "") -> List[str]:
    """Extracts all unique URLs from plain text and HTML content."""
    urls = set(URL_REGEX.findall(text or ""))
    if html:
        urls |= set(URL_REGEX.findall(html))
        # Also grab raw href attributes
        hrefs = re.findall(r'href=["\']?(https?://[^"\'\s>]+)', html, re.IGNORECASE)
        urls |= set(hrefs)
    return list(urls)


def _get_base_domain(host: str) -> str:
    """Extracts the base domain from a hostname (e.g., sub.docs.google.com -> google.com)."""
    parts = host.lower().strip().split(".")
    if len(parts) <= 2:
        return ".".join(parts)
    # Handle two-part ccTLDs (e.g. .co.in, .co.uk, .com.br)
    cctlds = {"co.in", "co.uk", "com.br", "gov.in", "edu.in", "ac.uk", "org.uk", "com.au", "net.au"}
    if len(parts) >= 3 and ".".join(parts[-2:]) in cctlds:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def is_domain_trusted(host: str) -> bool:
    """Checks whether the given hostname belongs to a known trusted provider or platform."""
    if not host:
        return False
    host_clean = host.lower().strip()
    # Check exact match
    if host_clean in TRUSTED_ROOT_DOMAINS:
        return True
    # Check if ends with .trusted_domain
    for trusted in TRUSTED_ROOT_DOMAINS:
        if host_clean.endswith(f".{trusted}"):
            return True
    return False


def is_sender_aligned(host: str, sender_domain: Optional[str]) -> bool:
    """Checks whether the URL host matches or is a subdomain of the email sender's domain."""
    if not host or not sender_domain:
        return False
    host_clean = host.lower().strip()
    sender_clean = sender_domain.lower().strip()
    if host_clean == sender_clean or host_clean.endswith(f".{sender_clean}"):
        return True
    # Check if base domains match
    return _get_base_domain(host_clean) == _get_base_domain(sender_clean)


def _is_ip_literal(host: str) -> bool:
    """Checks if the host is a raw IPv4 or IPv6 address."""
    return bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}(:\d+)?$", host or "")) or bool(re.match(r"^\[?[0-9a-fA-F:]+\]?(:\d+)?$", host or ""))


def _has_punycode(host: str) -> bool:
    """Detects punycode encoding (xn--) used in internationalized domain spoofing."""
    return "xn--" in (host or "").lower()


def _mixed_script(host: str) -> bool:
    """Flags homoglyph attacks where Latin and Cyrillic/Greek lookalikes are mixed."""
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


def _check_typosquat(host: str) -> Optional[Dict[str, Any]]:
    """Checks if an untrusted domain is typosquatting/impersonating a protected brand."""
    if is_domain_trusted(host):
        return None
    bare = host.lower().replace("www.", "")
    domain_part = bare.split(".")[0]
    
    for brand in SPOOFED_BRANDS:
        brand_clean = brand.lower().replace("www.", "")
        brand_name = brand_clean.split(".")[0]
        
        # If exact match to the legitimate brand (and domain is trusted), handled already
        if bare == brand_clean or bare.endswith(f".{brand_clean}"):
            return None
            
        # 1. Full domain similarity
        ratio = SequenceMatcher(None, bare, brand_clean).ratio()
        if 0.75 <= ratio < 1.0:
            return {
                "spoofed_brand": brand_clean,
                "similarity": round(ratio, 2)
            }
            
        # 2. Tokenized match (e.g. "paypa1-update", "paypal-secure", "apple-login")
        tokens = re.split(r"[-_.]", domain_part)
        for tok in tokens:
            tok_ratio = SequenceMatcher(None, tok, brand_name).ratio()
            if 0.75 <= tok_ratio < 1.0:
                return {
                    "spoofed_brand": brand_clean,
                    "similarity": round(tok_ratio, 2)
                }
            if tok == brand_name and not is_domain_trusted(bare):
                # Using brand name in untrusted domain (e.g. paypal-security-update.com)
                return {
                    "spoofed_brand": brand_clean,
                    "similarity": 1.0
                }
    return None


def analyze_single_url(url: str, sender_domain: Optional[str] = None) -> Dict[str, Any]:
    """Analyzes a single URL and returns detailed legitimacy & threat indicators."""
    url_clean = (url or "").strip()
    try:
        parsed = urlparse(url_clean if "://" in url_clean else f"https://{url_clean}")
        host = (parsed.hostname or "").lower()
        path = (parsed.path or "").lower()
        scheme = parsed.scheme.lower()
    except Exception:
        host = url_clean.lower()
        path = ""
        scheme = "https"

    tld = "." + host.split(".")[-1] if "." in host else ""
    
    trusted = is_domain_trusted(host)
    sender_aligned = is_sender_aligned(host, sender_domain)
    
    findings: List[str] = []
    risk_score = 0
    is_malicious = False

    # 1. Raw IP Address
    if _is_ip_literal(host):
        findings.append(f"URL uses raw IP literal ({host}) instead of a domain name.")
        risk_score += 30
        is_malicious = True

    # 2. Punycode & Homoglyph spoofing
    if _has_punycode(host):
        findings.append(f"Domain uses punycode ({host}) commonly used for lookalike spoofing.")
        risk_score += 25
        is_malicious = True
    if _mixed_script(host):
        findings.append("Domain mixes character scripts (homoglyph attack).")
        risk_score += 30
        is_malicious = True

    # 3. URL Shorteners
    is_shortener = any(sh in host for sh in URL_SHORTENERS)
    if is_shortener:
        findings.append(f"URL shortener detected ({host}) hiding final destination.")
        risk_score += 15

    # 4. Disposable / Tunneling Phishing Hosts (only if not a trusted platform)
    is_suspicious_hosting = False
    if not trusted:
        for sus_host in SUSPICIOUS_HOSTING_DOMAINS:
            if host == sus_host or host.endswith(f".{sus_host}"):
                is_suspicious_hosting = True
                findings.append(f"Link points to free/tunneling host ({sus_host}) commonly abused for phishing.")
                risk_score += 30
                is_malicious = True
                break

    # 5. Typosquatting / Brand Lookalike
    typosquat = _check_typosquat(host)
    if typosquat:
        findings.append(f"Domain '{host}' typosquats protected brand '{typosquat['spoofed_brand']}' ({int(typosquat['similarity']*100)}% match).")
        risk_score += 35
        is_malicious = True

    # 6. Suspicious Credential-Harvesting Paths on UNTRUSTED & NON-ALIGNED domains
    is_suspicious_path = False
    if not trusted and not sender_aligned:
        matched_paths = [kw for kw in SUSPICIOUS_URL_PATHS if kw in path]
        if matched_paths:
            is_suspicious_path = True
            findings.append(f"Untrusted URL contains credential-harvesting path keyword(s): {', '.join(matched_paths[:3])}.")
            risk_score += 20
            is_malicious = True

    # 7. High-Risk Phishing TLDs on untrusted domains
    if not trusted and tld in SUSPICIOUS_TLDS:
        findings.append(f"Domain uses high-risk TLD ({tld}) frequently abused for fraud.")
        risk_score += 15

    # 8. Unencrypted HTTP with sensitive actions
    if scheme == "http" and not trusted and (is_suspicious_path or is_suspicious_hosting):
        findings.append("Insecure HTTP protocol used for sensitive target.")
        risk_score += 10

    # Legitimacy check
    is_legitimate = (trusted or sender_aligned) and not is_malicious

    return {
        "url": url,
        "host": host,
        "base_domain": _get_base_domain(host),
        "is_trusted": trusted,
        "is_sender_aligned": sender_aligned,
        "is_legitimate": is_legitimate,
        "is_malicious": is_malicious,
        "is_shortener": is_shortener,
        "is_suspicious_hosting": is_suspicious_hosting,
        "is_suspicious_path": is_suspicious_path,
        "typosquat": typosquat,
        "risk_score": min(risk_score, 100),
        "findings": findings
    }


def analyze_urls_in_email(urls: List[str], sender_domain: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluates all extracted URLs in an email, aggregating legitimacy and threat signals.
    """
    if not urls:
        return {
            "url_count": 0,
            "has_urls": False,
            "has_shortener": False,
            "has_ip_based_url": False,
            "has_suspicious_hosting": False,
            "has_suspicious_path": False,
            "has_typosquat": False,
            "has_punycode_or_homograph": False,
            "all_urls_legitimate": True,
            "max_risk_score": 0,
            "url_details": [],
            "findings": []
        }

    details = [analyze_single_url(u, sender_domain=sender_domain) for u in urls]
    
    has_shortener = any(d["is_shortener"] for d in details)
    has_ip = any(_is_ip_literal(d["host"]) for d in details)
    has_suspicious_hosting = any(d["is_suspicious_hosting"] for d in details)
    has_suspicious_path = any(d["is_suspicious_path"] for d in details)
    has_typosquat = any(bool(d["typosquat"]) for d in details)
    has_punycode = any(_has_punycode(d["host"]) or _mixed_script(d["host"]) for d in details)
    
    all_legitimate = all(d["is_legitimate"] for d in details)
    max_risk = max((d["risk_score"] for d in details), default=0)
    
    all_findings = []
    for d in details:
        all_findings.extend(d["findings"])
    
    return {
        "url_count": len(urls),
        "has_urls": True,
        "has_shortener": has_shortener,
        "has_ip_based_url": has_ip,
        "has_suspicious_hosting": has_suspicious_hosting,
        "has_suspicious_path": has_suspicious_path,
        "has_typosquat": has_typosquat,
        "has_punycode_or_homograph": has_punycode,
        "all_urls_legitimate": all_legitimate,
        "max_risk_score": max_risk,
        "url_details": details,
        "findings": list(dict.fromkeys(all_findings))
    }
