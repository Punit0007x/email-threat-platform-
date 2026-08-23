import requests
import re
import urllib.parse
from typing import Dict, Any, List, Optional

DDG_HTML_URL = "https://html.duckduckgo.com/html/"
REQUEST_TIMEOUT = 10

DORK_TEMPLATES = {
    "phishing_pages": [
        'site:{domain} inurl:login',
        'site:{domain} inurl:signin',
        'site:{domain} inurl:password',
        'site:{domain} inurl:credential',
        'site:{domain} intitle:"login"',
        'site:{domain} intitle:"sign in"',
    ],
    "sensitive_files": [
        'site:{domain} filetype:pdf',
        'site:{domain} filetype:xls OR filetype:xlsx',
        'site:{domain} filetype:doc OR filetype:docx',
        'site:{domain} ext:env OR ext:config OR ext:ini',
        'site:{domain} "index of" "parent directory"',
    ],
    "leaked_credentials": [
        '{domain} "password" filetype:txt',
        '{domain} "username" "password"',
        '"@{domain}" "password"',
        '"@{domain}" site:pastebin.com',
        '"@{domain}" site:github.com',
    ],
    "subdomain_discovery": [
        'site:*.{domain}',
        'site:{domain} -site:www.{domain}',
    ],
    "tech_stack": [
        'site:{domain} "powered by"',
        'site:{domain} "built with"',
        'site:{domain} inurl:wp-content OR inurl:wp-includes',
    ],
    "email_harvesting": [
        '"@{domain}"',
        '"@{domain}" filetype:pdf',
        '"@{domain}" site:linkedin.com',
    ],
    "threat_intel": [
        '{domain} phishing',
        '{domain} malware',
        '{domain} scam',
        '{domain} fraud',
        '{domain} "business email compromise"',
    ]
}

def _search_ddg(query: str, max_results: int = 10) -> List[Dict[str, str]]:
    """Search DuckDuckGo HTML for results."""
    results = []
    try:
        params = {"q": query, "kl": "us-en"}
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; EmailThreatBot/1.0; +https://github.com)"
        }
        resp = requests.post(DDG_HTML_URL, data=params, headers=headers, timeout=REQUEST_TIMEOUT)
        
        # Parse HTML results
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        for result in soup.find_all('a', class_='result__snippet'):
            text = result.get_text(strip=True)
            link = result.get('href', '')
            if text and link:
                results.append({"snippet": text[:200], "url": link})
                if len(results) >= max_results:
                    break
        
        # Also check result__url for links
        for result in soup.find_all('a', class_='result__url'):
            link = result.get('href', '')
            if link and len(results) < max_results:
                results.append({"snippet": "", "url": link})
                
    except Exception as e:
        pass
    return results[:max_results]

def _search_hackertarget_dork(query: str) -> List[str]:
    """Use hackertarget for some dork-like queries."""
    try:
        url = f"https://api.hackertarget.com/pagedata/?q={urllib.parse.quote(query)}"
        resp = requests.get(url, timeout=REQUEST_TIMEOUT)
        if resp.status_code == 200 and "error" not in resp.text.lower():
            return [line.strip() for line in resp.text.split('\n') if line.strip()]
    except Exception:
        pass
    return []

def run_dork_scan(domain: str, categories: Optional[List[str]] = None, max_per_dork: int = 5) -> Dict[str, Any]:
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