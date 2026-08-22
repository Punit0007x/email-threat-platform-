import re
from typing import Dict, Any, Optional

try:
    import dns.resolver
    DNS_AVAILABLE = True
except ImportError:
    DNS_AVAILABLE = False

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

def check_live_dns_records(domain: str) -> Dict[str, Any]:
    """Perform live DNS lookups for SPF and DMARC records to verify domain authenticity."""
    records = {
        "spf_record": None,
        "dmarc_record": None,
        "dns_error": None
    }
    if not domain or not DNS_AVAILABLE:
        records["dns_error"] = "DNS library unavailable or empty domain"
        return records
        
    try:
        # Check SPF (TXT record on the domain itself)
        try:
            answers = dns.resolver.resolve(domain, 'TXT')
            for rdata in answers:
                txt = b''.join(rdata.strings).decode('utf-8', errors='ignore')
                if txt.startswith('v=spf1'):
                    records["spf_record"] = txt
                    break
        except Exception:
            pass # No SPF or error
            
        # Check DMARC (TXT record on _dmarc.domain)
        try:
            answers = dns.resolver.resolve(f'_dmarc.{domain}', 'TXT')
            for rdata in answers:
                txt = b''.join(rdata.strings).decode('utf-8', errors='ignore')
                if txt.startswith('v=DMARC1'):
                    records["dmarc_record"] = txt
                    break
        except Exception:
            pass # No DMARC or error
            
    except Exception as e:
        records["dns_error"] = str(e)
        
    return records

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
        
    # 3. Live DNS checks
    results["live_dns"] = check_live_dns_records(from_domain)
        
    return results
