import re
from typing import Dict, Any, Optional

def extract_domain(email_address: str) -> str:
    """Extracts the domain from an email address (e.g., 'User <user@domain.com>' -> 'domain.com')."""
    if not email_address:
        return ""
    # Extract email between < > if present
    match = re.search(r'<([^>]+)>', email_address)
    address = match.group(1) if match else email_address
    
    # Split by @ and take the last part
    parts = address.split('@')
    return parts[-1].strip().lower() if len(parts) > 1 else ""

def analyze_auth(auth_header: Optional[str], from_header: Optional[str], return_path_header: Optional[str]) -> Dict[str, Any]:
    """
    Parses Authentication-Results for SPF, DKIM, and DMARC statuses.
    Flags if Return-Path domain and From domain don't match.
    """
    results = {
        "spf": "not_present",
        "dkim": "not_present",
        "dmarc": "not_present",
        "domain_alignment_pass": False,
        "from_domain": "",
        "return_path_domain": ""
    }
    
    # 1. Parse Authentication-Results
    if auth_header:
        auth_lower = auth_header.lower()
        for protocol in ["spf", "dkim", "dmarc"]:
            # Regex to find "protocol=result" (e.g., spf=pass, dkim=fail)
            match = re.search(rf'\b{protocol}=([a-z]+)\b', auth_lower)
            if match:
                results[protocol] = match.group(1)
            else:
                # If header exists but protocol isn't listed, it wasn't checked
                results[protocol] = "none"
                
    # 2. Check Domain Alignment
    from_domain = extract_domain(from_header or "")
    return_path_domain = extract_domain(return_path_header or "")
    
    results["from_domain"] = from_domain
    results["return_path_domain"] = return_path_domain
    
    # Alignment passes only if both exist and match perfectly
    if from_domain and return_path_domain and from_domain == return_path_domain:
        results["domain_alignment_pass"] = True
        
    return results
