import re
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from app.scoring.config import URGENCY_PHRASES, AUTHORITY_KEYWORDS, URL_SHORTENERS

def analyze_text_signals(subject: str, body_plain: str, body_html: str, extracted_urls: List[str]) -> Dict[str, Any]:
    """
    Analyzes email subject and body for text-based fraud signals.
    """
    full_text = f"{subject} {body_plain} {body_html}".lower()
    
    # 1. Urgency score (count of matched phrases)
    urgency_count = sum(1 for phrase in URGENCY_PHRASES if phrase in full_text)
    
    # 2. Authority score
    authority_count = sum(1 for keyword in AUTHORITY_KEYWORDS if keyword in full_text)
    
    # 3. URL shorteners
    has_shortener = any(shortener in url.lower() for url in extracted_urls for shortener in URL_SHORTENERS)
    
    # 4. Link mismatch
    link_mismatches = 0
    if body_html:
        soup = BeautifulSoup(body_html, 'html.parser')
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href'].strip()
            text = a_tag.get_text(strip=True)
            
            # Basic link mismatch: text looks like a URL, but goes somewhere else
            if text.startswith('http') or text.startswith('www.'):
                # Extract base domain from href
                href_domain_match = re.search(r'(?:https?://)?([^/]+)', href)
                href_domain = href_domain_match.group(1).lower() if href_domain_match else href.lower()
                
                # Extract base domain from text
                text_domain_match = re.search(r'(?:https?://)?([^/]+)', text)
                text_domain = text_domain_match.group(1).lower() if text_domain_match else text.lower()
                
                # If they claim it's google.com but goes to evil.com
                if text_domain != href_domain:
                    link_mismatches += 1
                    
    # 5. ALL CAPS ratio and Exclamation counts
    clean_text = f"{subject} {body_plain}"
    alpha_chars = [c for c in clean_text if c.isalpha()]
    caps_count = sum(1 for c in alpha_chars if c.isupper())
    caps_ratio = caps_count / len(alpha_chars) if alpha_chars else 0.0
    
    exclamation_count = clean_text.count('!')
    
    return {
        "urgency_count": urgency_count,
        "authority_count": authority_count,
        "link_mismatch_count": link_mismatches,
        "has_shortener": has_shortener,
        "all_caps_ratio": round(caps_ratio, 2),
        "exclamation_count": exclamation_count
    }
