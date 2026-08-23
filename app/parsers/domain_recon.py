import requests
import json
import re
from typing import Dict, Any, List, Optional

CRTSH_URL = "https://crt.sh/?q=%.{domain}&output=json"
HACKERTARGET_URL = "https://api.hackertarget.com/hostsearch/?q={domain}"
HACKERTARGET_SUBDOMAINS_URL = "https://api.hackertarget.com/hostsearch/?q={domain}"
REQUEST_TIMEOUT = 10

def _query_crtsh(domain: str) -> List[str]:
    """Query crt.sh Certificate Transparency logs for subdomains."""
    subdomains = set()
    try:
        url = CRTSH_URL.format(domain=domain)
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            for entry in data:
                name_value = entry.get("name_value", "")
                for name in name_value.split("\n"):
                    name = name.strip().lower().rstrip(".")
                    if name.endswith(f".{domain}") or name == domain:
                        subdomains.add(name)
    except Exception:
        pass
    return sorted(subdomains)

def _query_hackertarget(domain: str) -> List[str]:
    """Query hackertarget.com for subdomains (passive DNS)."""
    subdomains = set()
    try:
        url = HACKERTARGET_URL.format(domain=domain)
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        if response.status_code == 200 and "error" not in response.text.lower():
            for line in response.text.strip().split("\n"):
                parts = line.split(",")
                if parts:
                    sub = parts[0].strip().lower().rstrip(".")
                    if sub.endswith(f".{domain}") or sub == domain:
                        subdomains.add(sub)
    except Exception:
        pass
    return sorted(subdomains)

def _extract_from_ssl_cert(domain: str) -> List[str]:
    """Extract subdomains from SSL certificate (via crt.sh alt names)."""
    return _query_crtsh(domain)

def enumerate_subdomains(domain: str) -> Dict[str, Any]:
    """
    Passive subdomain enumeration using multiple sources:
    - Certificate Transparency logs (crt.sh)
    - Hackertarget passive DNS
    Returns deduplicated list with source attribution.
    """
    domain = domain.lower().strip().strip(">").strip()
    result: Dict[str, Any] = {
        "domain": domain,
        "subdomains": [],
        "subdomain_count": 0,
        "sources": {
            "crt_sh": [],
            "hackertarget": []
        },
        "risk_indicators": []
    }

    if not domain or "." not in domain or domain.endswith(".local") or domain.endswith(".internal"):
        result["risk_indicators"].append("Invalid or private domain for subdomain enumeration")
        return result

    # 1. Certificate Transparency (crt.sh)
    crt_subs = _query_crtsh(domain)
    result["sources"]["crt_sh"] = crt_subs

    # 2. Hackertarget passive DNS
    ht_subs = _query_hackertarget(domain)
    result["sources"]["hackertarget"] = ht_subs

    # Merge and deduplicate
    all_subs = set(crt_subs + ht_subs)
    result["subdomains"] = sorted(all_subs)
    result["subdomain_count"] = len(all_subs)

    # Risk indicators
    if result["subdomain_count"] > 50:
        result["risk_indicators"].append(f"Large subdomain footprint ({result['subdomain_count']} subdomains) — possible wildcard DNS or extensive infrastructure")
    elif result["subdomain_count"] > 20:
        result["risk_indicators"].append(f"Moderate subdomain footprint ({result['subdomain_count']} subdomains)")

    # Check for suspicious subdomain patterns
    suspicious_patterns = [
        "admin", "login", "secure", "portal", "webmail", "mail", "email",
        "payroll", "hr", "finance", "accounting", "billing", "invoice",
        "support", "helpdesk", "service", "api", "dev", "test", "staging",
        "vpn", "remote", "citrix", "rdp", "ssh", "ftp", "git", "jenkins"
    ]
    suspicious_found = []
    for sub in all_subs:
        for pattern in suspicious_patterns:
            if pattern in sub and sub != domain:
                suspicious_found.append(sub)
                break
    if suspicious_found:
        result["risk_indicators"].append(f"Suspicious subdomains detected: {', '.join(suspicious_found[:10])}")

    return result