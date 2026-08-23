import requests
import re
import urllib.parse
from typing import Dict, Any, List, Optional

DDG_HTML_URL = "https://html.duckduckgo.com/html/"
REQUEST_TIMEOUT = 1.5

DORK_TEMPLATES = {
    "phishing_pages": [
        'site:{domain} inurl:login',
    ],
    "threat_intel": [
        '{domain} phishing',
    ]
}

def _search_ddg(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Search DuckDuckGo HTML for results."""
    results = []
    try:
        params = {"q": query, "kl": "us-en"}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(DDG_HTML_URL, params=params, headers=headers, timeout=REQUEST_TIMEOUT)
        if resp.status_code == 200:
            # Extract links and snippets from HTML
            matches = re.findall(r'<a class="result__url"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', resp.text)
            for href, text in matches[:max_results]:
                results.append({
                    "url": href.strip(),
                    "title": re.sub(r'<[^>]+>', '', text).strip(),
                    "snippet": ""
                })
    except Exception:
        pass
    return results

def _search_hackertarget_dork(query: str) -> List[str]:
    """Search using hackertarget page data."""
    return []

def run_dork_scan(domain: str, categories: Optional[List[str]] = None, max_per_dork: int = 3) -> Dict[str, Any]:
    """
    Run passive Google dorks against a domain using DuckDuckGo and hackertarget.
    Returns categorized findings with risk assessment.
    """
    domain = domain.lower().strip().strip(">").strip()
    result: Dict[str, Any] = {
        "domain": domain,
        "categories": {},
        "total_findings": 0,
        "risk_indicators": []
    }

    if not domain or "." not in domain or domain.endswith(".local") or domain.endswith(".internal"):
        result["risk_indicators"].append("Invalid or private domain for dork scanning")
        return result

    if categories is None:
        categories = list(DORK_TEMPLATES.keys())

    for category in categories:
        if category not in DORK_TEMPLATES:
            continue
            
        category_results = []
        for template in DORK_TEMPLATES[category]:
            query = template.format(domain=domain)
            
            # Try DuckDuckGo
            ddg_results = _search_ddg(query, max_per_dork)
            for r in ddg_results:
                r["dork"] = query
                r["source"] = "duckduckgo"
                category_results.append(r)
            
            # Try hackertarget for some queries
            if category in ["subdomain_discovery", "tech_stack"]:
                ht_results = _search_hackertarget_dork(query)
                for ht in ht_results:
                    category_results.append({
                        "dork": query,
                        "source": "hackertarget",
                        "snippet": ht[:200],
                        "url": ""
                    })
        
        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for r in category_results:
            url = r.get("url", "")
            key = url or r.get("snippet", "")[:50]
            if key not in seen_urls:
                seen_urls.add(key)
                unique_results.append(r)
        
        result["categories"][category] = unique_results[:max_per_dork * 2]
        result["total_findings"] += len(unique_results[:max_per_dork * 2])

    # Risk assessment
    if result["categories"].get("phishing_pages"):
        result["risk_indicators"].append(f"Potential phishing pages found: {len(result['categories']['phishing_pages'])} results")
    
    if result["categories"].get("sensitive_files"):
        result["risk_indicators"].append(f"Sensitive files exposed: {len(result['categories']['sensitive_files'])} results")
    
    if result["categories"].get("leaked_credentials"):
        result["risk_indicators"].append(f"Possible credential leaks found: {len(result['categories']['leaked_credentials'])} results")
    
    if result["categories"].get("threat_intel"):
        result["risk_indicators"].append(f"Threat intelligence mentions: {len(result['categories']['threat_intel'])} results")

    if not result["risk_indicators"]:
        result["risk_indicators"].append("No significant dork findings")

    return result