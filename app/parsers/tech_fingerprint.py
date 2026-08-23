import requests
import re
from typing import Dict, Any, List, Optional

TECH_SIGNATURES = {
    "CMS": {
        "WordPress": [
            r'wp-content', r'wp-includes', r'xmlrpc\.php', r'wp-json',
            r'generator.*wordpress', r'wp-embed'
        ],
        "Drupal": [
            r'drupal\.js', r'sites/default/files', r'misc/drupal',
            r'generator.*drupal', r'Drupal\.settings'
        ],
        "Joomla": [
            r'joomla', r'media/system/js', r'components/com_',
            r'generator.*joomla', r'JFactory'
        ],
        "Magento": [
            r'mage/cookies', r'Mage\.Cookies', r'skin/frontend',
            r'Mage\.Core', r'magento'
        ],
        "Shopify": [
            r'shopify', r'cdn\.shopify\.com', r'Shopify\.theme',
            r'shopify_checkout'
        ],
        "Wix": [
            r'wix\.com', r'_wix', r'wix-static', r'wixapps'
        ],
        "Squarespace": [
            r'squarespace', r'static\.squarespace', r'Squarespace'
        ],
        "Ghost": [
            r'ghost\.org', r'/ghost/', r'generator.*ghost'
        ],
        "Webflow": [
            r'webflow', r'webflow\.js', r'wf-'
        ],
    },
    "Frameworks": {
        "React": [r'react', r'__REACT_DEVTOOLS_GLOBAL_HOOK__', r'data-reactroot'],
        "Vue.js": [r'vue\.js', r'Vue\.', r'data-v-', r'__VUE_DEVTOOLS_GLOBAL_HOOK__'],
        "Angular": [r'angular', r'ng-version', r'ng-app', r'ng-controller'],
        "Next.js": [r'_next/', r'__NEXT_DATA__', r'next\.js'],
        "Nuxt.js": [r'nuxt', r'__NUXT__'],
        "Svelte": [r'svelte', r'__SVELTE_DEVTOOLS_GLOBAL_HOOK__'],
        "jQuery": [r'jquery', r'jQuery\.', r'\$\(document\)'],
        "Bootstrap": [r'bootstrap', r'btn-primary', r'container-fluid', r'navbar-'],
        "Tailwind": [r'tailwind', r'tw-', r'class=".*\b(flex|grid|md:|lg:)\b'],
    },
    "Analytics_Tracking": {
        "Google Analytics": [r'google-analytics', r'gtag\(', r'ga\(', r'GA_MEASUREMENT_ID'],
        "Google Tag Manager": [r'googletagmanager', r'GTM-'],
        "Facebook Pixel": [r'fbevents\.js', r'fbq\(', r'facebook\.net/tr'],
        "Hotjar": [r'hotjar', r'hj\(', r'hotjar\.com'],
        "Matomo": [r'matomo', r'piwik', r'_paq\.push'],
    },
    "Security_Headers": {
        "Cloudflare": [r'cf-ray', r'__cfduid', r'cloudflare', r'cdn-cgi/challenge-platform'],
        "AWS CloudFront": [r'x-amz-cf-id', r'cloudfront', r'x-amz-'],
        "Akamai": [r'akamai', r'x-akamai'],
        "Fastly": [r'fastly', r'x-served-by.*fastly'],
        "Sucuri": [r'sucuri', r'x-sucuri'],
        "Incapsula": [r'incapsula', r'x-iinfo', r'_incap_'],
    },
    "Hosting_Platforms": {
        "Netlify": [r'netlify', r'x-nf-request-id'],
        "Vercel": [r'vercel', r'x-vercel'],
        "GitHub Pages": [r'github\.io', r'github-pages'],
        "Heroku": [r'heroku', r'x-heroku'],
        "Firebase": [r'firebase', r'__firebase'],
        "AWS S3": [r'amazonaws\.com', r'x-amz-', r's3\.amazonaws'],
        "Azure": [r'azure', r'azurewebsites', r'blob\.core\.windows'],
        "Google Cloud": [r'googleapis\.com', r'googlecloud', r'gstatic\.com'],
    },
    "Phishing_Kits": {
        "Evilginx2": [r'evilginx', r'phishlet'],
        "Modlishka": [r'modlishka', r'proxy.*auth'],
        "Gophish": [r'gophish', r'phishing.*framework'],
        "Social-Analyzer": [r'social-analyzer'],
        "BlackEye": [r'blackeye'],
        "Shellphish": [r'shellphish'],
        "HiddenEye": [r'hiddeneye'],
    },
    "Email_Security": {
        "Proofpoint": [r'proofpoint', r'pphosted'],
        "Mimecast": [r'mimecast', r'mc\.mimecast'],
        "Barracuda": [r'barracuda', r'barracudanetworks'],
        "Cisco ESA": [r'cisco.*esa', r'ironport'],
        "Microsoft ATP": [r'atp\.office', r'microsoft.*defender'],
        "Google Workspace": [r'google\.com.*mail', r'workspace'],
    }
}

PHISHING_KIT_INDICATORS = [
    r'login.*form.*action.*http',
    r'password.*type=["\']hidden',
    r'credential.*harvest',
    r'phish.*kit',
    r'fake.*login',
    r'steal.*password',
]

def _fetch_page(url: str, timeout: int = 8) -> Optional[Dict[str, Any]]:
    """Fetch a page and return content, headers, and status."""
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; EmailThreatBot/1.0; +https://github.com)'
        }
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True, verify=False)
        return {
            "url": resp.url,
            "status": resp.status_code,
            "headers": dict(resp.headers),
            "content": resp.text[:50000],
            "content_length": len(resp.text)
        }
    except Exception as e:
        return {"error": str(e), "url": url}

def _match_signatures(content: str, headers: Dict[str, str], signatures: Dict[str, List[str]]) -> Dict[str, List[str]]:
    """Match technology signatures in content and headers."""
    matches = {}
    full_text = content + " " + " ".join(f"{k}: {v}" for k, v in headers.items())
    full_text = full_text.lower()
    
    for tech, patterns in signatures.items():
        found_patterns = []
        for pattern in patterns:
            if re.search(pattern, full_text, re.IGNORECASE):
                found_patterns.append(pattern)
        if found_patterns:
            matches[tech] = found_patterns
    return matches

def fingerprint_technology(domain: str) -> Dict[str, Any]:
    """
    Fingerprint web technologies for a domain.
    Checks main domain and www subdomain.
    Returns detected CMS, frameworks, analytics, hosting, security, and phishing kit indicators.
    """
    domain = domain.lower().strip().strip(">").strip()
    result: Dict[str, Any] = {
        "domain": domain,
        "checked_urls": [],
        "technologies": {},
        "categories": {},
        "phishing_kit_detected": False,
        "phishing_kit_details": [],
        "risk_indicators": []
    }

    if not domain or "." not in domain or domain.endswith(".local") or domain.endswith(".internal"):
        result["risk_indicators"].append("Invalid or private domain for technology fingerprinting")
        return result

    urls_to_check = [f"https://{domain}", f"https://www.{domain}"]
    
    all_matches = {cat: {} for cat in TECH_SIGNATURES.keys()}
    
    for url in urls_to_check:
        page = _fetch_page(url)
        if not page or "error" in page:
            continue
        
        result["checked_urls"].append({
            "url": page["url"],
            "status": page["status"],
            "content_length": page["content_length"]
        })
        
        content = page["content"]
        headers = page["headers"]
        
        # Match each category
        for category, signatures in TECH_SIGNATURES.items():
            matches = _match_signatures(content, headers, signatures)
            for tech, patterns in matches.items():
                if tech not in all_matches[category]:
                    all_matches[category][tech] = []
                all_matches[category][tech].extend(patterns)
        
        # Check for phishing kit indicators
        for indicator in PHISHING_KIT_INDICATORS:
            if re.search(indicator, content, re.IGNORECASE):
                result["phishing_kit_detected"] = True
                result["phishing_kit_details"].append({
                    "url": page["url"],
                    "indicator": indicator
                })

    # Deduplicate and format
    for category, techs in all_matches.items():
        if techs:
            result["categories"][category] = list(techs.keys())
            for tech, patterns in techs.items():
                result["technologies"][tech] = {
                    "category": category,
                    "patterns_matched": list(set(patterns))
                }

    # Risk indicators
    if result["phishing_kit_detected"]:
        result["risk_indicators"].append("Phishing kit indicators detected in page content")
    
    cms_found = result["categories"].get("CMS", [])
    if cms_found:
        result["risk_indicators"].append(f"CMS detected: {', '.join(cms_found)} — check for vulnerable versions/plugins")
    
    hosting = result["categories"].get("Hosting_Platforms", [])
    if hosting:
        result["risk_indicators"].append(f"Hosting platform: {', '.join(hosting)}")
    
    security = result["categories"].get("Security_Headers", [])
    if not security:
        result["risk_indicators"].append("No WAF/CDN security headers detected — direct origin exposure")

    if not result["checked_urls"]:
        result["risk_indicators"].append("Failed to fetch domain — may be offline, blocked, or non-web domain")

    return result