from app.scoring.config import SPOOFED_BRANDS
from typing import Dict, Any

def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculates the edit distance between two strings (zero dependencies)."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
        
    return previous_row[-1]

def check_domain_lookalike(sender_domain: str) -> Dict[str, Any]:
    """
    Checks if the sender domain is a lookalike (typosquatting) or uses subdomain tricks
    to spoof a known brand.
    """
    sender_domain = sender_domain.lower().strip()
    
    result = {
        "is_lookalike": False,
        "is_subdomain_spoof": False,
        "spoofed_brand": None,
        "details": None
    }
    
    if not sender_domain:
        return result
        
    for brand in SPOOFED_BRANDS:
        # Check for subdomain spoofing (e.g. paypal.com.verify-account.net)
        # It contains the brand + a dot, but doesn't END with the brand exactly
        if f"{brand}." in sender_domain and not sender_domain.endswith(brand):
            result["is_subdomain_spoof"] = True
            result["spoofed_brand"] = brand
            result["details"] = f"Subdomain spoofing: '{brand}' appears inside '{sender_domain}'"
            return result
            
        # Check for typosquatting (Levenshtein distance of 1 or 2)
        # But we must NOT flag exact matches as lookalikes!
        if sender_domain != brand:
            # We only want to compare the base domain, but for the hackathon
            # comparing the whole string against our list of domains is fine.
            dist = levenshtein_distance(sender_domain, brand)
            
            # If the domain length is very short, distance of 2 might be too aggressive,
            # but for our specific list of major brands, 1-2 works well.
            if dist <= 2:
                result["is_lookalike"] = True
                result["spoofed_brand"] = brand
                result["details"] = f"Lookalike domain: '{sender_domain}' is visually similar to '{brand}'"
                return result
                
    return result
