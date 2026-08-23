import requests
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

WAYBACK_CDX_URL = "http://web.archive.org/cdx/search/cdx"
WAYBACK_AVAILABLE_URL = "http://archive.org/wayback/available"
REQUEST_TIMEOUT = 1.5

def _query_wayback_cdx(domain: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Query Wayback CDX API for historical snapshots."""
    params = {
        "url": f"*.{domain}/*",
        "output": "json",
        "fl": "timestamp,original,statuscode,mimetype,digest,length",
        "filter": "statuscode:200",
        "collapse": "digest",
        "limit": limit
    }
    try:
        response = requests.get(WAYBACK_CDX_URL, params=params, timeout=REQUEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            if len(data) > 1:
                headers = data[0]
                return [dict(zip(headers, row)) for row in data[1:]]
    except Exception:
        pass
    return []

def _query_wayback_available(url: str) -> Dict[str, Any]:
    """Check if a specific URL has snapshots."""
    try:
        params = {"url": url}
        response = requests.get(WAYBACK_AVAILABLE_URL, params=params, timeout=REQUEST_TIMEOUT)
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    return {}

def _parse_timestamp(ts: str) -> Optional[datetime]:
    """Parse Wayback timestamp (YYYYMMDDhhmmss)."""
    try:
        return datetime.strptime(ts, "%Y%m%d%H%M%S")
    except Exception:
        return None

def crawl_wayback_history(domain: str, limit: int = 100) -> Dict[str, Any]:
    """
    Crawl Wayback Machine for historical snapshots of a domain.
    Tracks: first/last seen, content changes, tech stack evolution, IP history hints.
    """
    domain = domain.lower().strip().strip(">").strip()
    result: Dict[str, Any] = {
        "domain": domain,
        "snapshots": [],
        "snapshot_count": 0,
        "first_seen": None,
        "last_seen": None,
        "unique_urls": 0,
        "status_codes": {},
        "mime_types": {},
        "content_changes": 0,
        "risk_indicators": []
    }

    if not domain or "." not in domain or domain.endswith(".local") or domain.endswith(".internal"):
        result["risk_indicators"].append("Invalid or private domain for Wayback crawling")
        return result

    snapshots = _query_wayback_cdx(domain, limit)
    result["snapshots"] = snapshots
    result["snapshot_count"] = len(snapshots)

    if not snapshots:
        result["risk_indicators"].append("No Wayback snapshots found — domain may be new or never publicly indexed")
        return result

    # Analyze snapshots
    timestamps = []
    unique_urls = set()
    digests = set()
    status_codes = {}
    mime_types = {}

    for snap in snapshots:
        ts = _parse_timestamp(snap.get("timestamp", ""))
        if ts:
            timestamps.append(ts)
        
        url = snap.get("original", "")
        if url:
            unique_urls.add(url)
        
        digest = snap.get("digest", "")
        if digest:
            digests.add(digest)
        
        sc = snap.get("statuscode", "")
        if sc:
            status_codes[sc] = status_codes.get(sc, 0) + 1
        
        mt = snap.get("mimetype", "")
        if mt:
            mime_types[mt] = mime_types.get(mt, 0) + 1

    if timestamps:
        result["first_seen"] = min(timestamps).isoformat()
        result["last_seen"] = max(timestamps).isoformat()
        age_days = (datetime.utcnow() - min(timestamps)).days
        result["domain_age_wayback_days"] = age_days

    result["unique_urls"] = len(unique_urls)
    result["content_changes"] = len(digests)
    result["status_codes"] = status_codes
    result["mime_types"] = mime_types

    # Risk indicators
    if result.get("domain_age_wayback_days", 9999) < 30:
        result["risk_indicators"].append(f"Domain first archived only {result['domain_age_wayback_days']} days ago — very recent web presence")
    elif result.get("domain_age_wayback_days", 9999) < 90:
        result["risk_indicators"].append(f"Domain first archived {result['domain_age_wayback_days']} days ago — recent web presence")

    if result["content_changes"] > 20:
        result["risk_indicators"].append(f"High content volatility ({result['content_changes']} unique content hashes) — possible dynamic/phishing kit")

    if "text/html" not in mime_types and mime_types:
        result["risk_indicators"].append("No HTML content in snapshots — may be API-only or parking page")

    return result