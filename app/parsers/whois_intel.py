import socket
import re
from typing import Dict, Any, Optional
from datetime import datetime, timezone

IANA_WHOIS = "whois.iana.org"
WHOIS_PORT = 43
SOCKET_TIMEOUT = 1.5

RISKY_REGISTRARS = [
    "freenom", "dot.tk", "dot.ml", "dot.ga", "dot.cf", "dot.gq",
    "namecheap", "porkbun", "dynadot", "godaddy", "ionos", "1&1"
]

PRIVACY_KEYWORDS = [
    "privacy", "proxy", "protected", "redacted", "whoisguard", "domainsbyproxy",
    "contact privacy", "identity protection", "withheld for privacy"
]


def _whois_query(server: str, query: str) -> str:
    """Raw WHOIS query over TCP port 43."""
    try:
        with socket.create_connection((server, WHOIS_PORT), timeout=SOCKET_TIMEOUT) as sock:
            sock.sendall((query + "\r\n").encode("utf-8"))
            response = bytearray()
            while True:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                response.extend(chunk)
        return response.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def _get_tld_whois_server(domain: str) -> Optional[str]:
    """Query IANA to get the authoritative WHOIS server for the domain's TLD."""
    tld = domain.split(".")[-1]
    response = _whois_query(IANA_WHOIS, tld)
    for line in response.splitlines():
        if line.lower().startswith("whois:"):
            return line.split(":", 1)[1].strip()
    return None


def _parse_whois_response(response: str) -> Dict[str, Any]:
    """Extract key fields from WHOIS response."""
    result = {
        "registrar": None,
        "creation_date": None,
        "expiry_date": None,
        "registrant_org": None,
        "name_servers": [],
        "raw_response": response[:5000]
    }

    patterns = {
        "registrar": [r"Registrar:\s*(.+)", r"Registrar Name:\s*(.+)"],
        "creation_date": [
            r"Creation Date:\s*(.+)",
            r"Created:\s*(.+)",
            r"Registration Date:\s*(.+)",
            r"Domain Registration Date:\s*(.+)"
        ],
        "expiry_date": [
            r"Expiry Date:\s*(.+)",
            r"Expires:\s*(.+)",
            r"Expiration Date:\s*(.+)",
            r"Registry Expiry Date:\s*(.+)"
        ],
        "registrant_org": [
            r"Registrant Organization:\s*(.+)",
            r"Registrant Org:\s*(.+)",
            r"Organization:\s*(.+)"
        ],
        "name_servers": [r"Name Server:\s*(.+)", r"NS:\s*(.+)"]
    }

    for key, pat_list in patterns.items():
        if key == "name_servers":
            servers = []
            for pat in pat_list:
                for m in re.finditer(pat, response, re.IGNORECASE):
                    ns = m.group(1).strip().rstrip(".")
                    if ns:
                        servers.append(ns)
            result[key] = servers
        else:
            for pat in pat_list:
                m = re.search(pat, response, re.IGNORECASE)
                if m:
                    result[key] = m.group(1).strip()
                    break

    return result


def _calculate_domain_age_days(creation_date_str: Optional[str]) -> Optional[int]:
    """Parse creation date string and return age in days."""
    if not creation_date_str:
        return None
    fmts = [
        "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d",
        "%d-%b-%Y", "%Y/%m/%d", "%d.%m.%Y"
    ]
    for fmt in fmts:
        try:
            dt = datetime.strptime(creation_date_str.strip(), fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return (datetime.now(timezone.utc) - dt).days
        except ValueError:
            continue
    return None


def _is_privacy_protected(registrant_org: Optional[str], raw: str) -> bool:
    """Check if registrant info is privacy-protected."""
    if registrant_org:
        for kw in PRIVACY_KEYWORDS:
            if kw in registrant_org.lower():
                return True
    for kw in PRIVACY_KEYWORDS:
        if kw in raw.lower():
            return True
    return False


def query_whois_intel(domain: str) -> Dict[str, Any]:
    """
    Performs WHOIS intelligence lookup for a domain:
    - Resolves TLD WHOIS server via IANA
    - Queries authoritative registrar WHOIS
    - Extracts registrar, creation/expiry dates, registrant org, name servers
    - Computes domain age and risk indicators
    """
    domain = domain.lower().strip().strip(">").strip()
    result: Dict[str, Any] = {
        "domain": domain,
        "queried": False,
        "registrar": None,
        "creation_date": None,
        "expiry_date": None,
        "domain_age_days": None,
        "registrant_org": None,
        "name_servers": [],
        "is_privacy_protected": False,
        "risk_indicators": []
    }

    if not domain or "." not in domain or domain.endswith(".local") or domain.endswith(".internal"):
        result["risk_indicators"].append("Invalid or private domain name structure")
        return result

    # Step 1: Get authoritative WHOIS server for TLD
    whois_server = _get_tld_whois_server(domain)
    if not whois_server:
        result["risk_indicators"].append("Could not determine WHOIS server for TLD")
        return result

    # Step 2: Query registrar WHOIS
    raw_response = _whois_query(whois_server, domain)
    if not raw_response:
        result["risk_indicators"].append(f"WHOIS query to {whois_server} failed or returned empty")
        return result

    result["queried"] = True
    parsed = _parse_whois_response(raw_response)

    result["registrar"] = parsed["registrar"]
    result["creation_date"] = parsed["creation_date"]
    result["expiry_date"] = parsed["expiry_date"]
    result["registrant_org"] = parsed["registrant_org"]
    result["name_servers"] = parsed["name_servers"]

    # Step 3: Compute domain age
    age_days = _calculate_domain_age_days(parsed["creation_date"])
    result["domain_age_days"] = age_days

    # Step 4: Privacy protection check
    result["is_privacy_protected"] = _is_privacy_protected(parsed["registrant_org"], raw_response)
    if result["is_privacy_protected"]:
        result["risk_indicators"].append("Registrant information is privacy-protected / redacted")

    # Step 5: Risk indicators
    if age_days is not None:
        if age_days < 30:
            result["risk_indicators"].append(f"Domain registered very recently ({age_days} days ago) — high phishing risk")
        elif age_days < 90:
            result["risk_indicators"].append(f"Domain registered recently ({age_days} days ago) — elevated risk")

    if parsed["registrar"]:
        reg_lower = parsed["registrar"].lower()
        for risky in RISKY_REGISTRARS:
            if risky in reg_lower:
                result["risk_indicators"].append(f"Registrar '{parsed['registrar']}' associated with high-abuse volume")
                break

    if not parsed["name_servers"]:
        result["risk_indicators"].append("No authoritative name servers listed in WHOIS")

    return result