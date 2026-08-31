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
            if text.startswith('http://') or text.startswith('https://') or text.startswith('www.'):
                # Clean host from href
                href_clean = href.lower()
                href_clean = re.sub(r'^https?://', '', href_clean).split('/')[0].split(':')[0]
                href_domain = re.sub(r'^www\.', '', href_clean)
                
                # Clean host from text
                text_clean = text.lower()
                text_clean = re.sub(r'^https?://', '', text_clean).split('/')[0].split(':')[0]
                text_domain = re.sub(r'^www\.', '', text_clean)
                
                # If they claim it's google.com but goes to evil.com
                if text_domain and href_domain and text_domain != href_domain:
                    # Ignore if both are subdomains of each other / same base domain
                    if not (href_domain.endswith(f".{text_domain}") or text_domain.endswith(f".{href_domain}")):
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
