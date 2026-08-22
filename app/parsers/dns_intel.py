import dns.resolver
from typing import Dict, Any, List

def query_domain_dns(domain: str) -> Dict[str, Any]:
    """
    Performs live DNS intelligence lookups for a domain:
    - MX records (Mail Exchangers)
    - A records (IP addresses)
    - SPF TXT records
    - DMARC TXT records
    - Domain existence verification
    """
    domain = domain.lower().strip().strip(">").strip()
    result: Dict[str, Any] = {
        "domain": domain,
        "is_resolvable": False,
        "has_mx_records": False,
        "mx_records": [],
        "a_records": [],
        "spf_record": None,
        "dmarc_record": None,
        "risk_indicators": []
    }
    
    if not domain or "." not in domain or domain.endswith(".local") or domain.endswith(".internal"):
        result["risk_indicators"].append("Invalid or private domain name structure")
        return result

    resolver = dns.resolver.Resolver()
    resolver.timeout = 2.5
    resolver.lifetime = 2.5

    # 1. Query A records
    try:
        a_answers = resolver.resolve(domain, 'A')
        result["a_records"] = [str(r) for r in a_answers]
        result["is_resolvable"] = True
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        result["is_resolvable"] = False
        result["risk_indicators"].append(f"Domain '{domain}' does not exist (NXDOMAIN) - likely fabricated sender")
    except Exception:
        pass

    # 2. Query MX records
    try:
        mx_answers = resolver.resolve(domain, 'MX')
        result["mx_records"] = [f"{r.preference} {str(r.exchange).rstrip('.')}" for r in mx_answers]
        result["has_mx_records"] = len(result["mx_records"]) > 0
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
        result["has_mx_records"] = False
        if result["is_resolvable"]:
            result["risk_indicators"].append(f"Domain '{domain}' has NO MX records configured (burn-only or send-only spam infrastructure)")
    except Exception:
        pass

    # 3. Query SPF (TXT records on base domain)
    try:
        txt_answers = resolver.resolve(domain, 'TXT')
        for rdata in txt_answers:
            txt_str = "".join([s.decode('utf-8', errors='ignore') if isinstance(s, bytes) else str(s) for s in rdata.strings])
            if txt_str.startswith("v=spf1"):
                result["spf_record"] = txt_str
                break
    except Exception:
        pass

    # 4. Query DMARC (TXT record on _dmarc.domain)
    try:
        dmarc_answers = resolver.resolve(f"_dmarc.{domain}", 'TXT')
        for rdata in dmarc_answers:
            txt_str = "".join([s.decode('utf-8', errors='ignore') if isinstance(s, bytes) else str(s) for s in rdata.strings])
            if txt_str.startswith("v=DMARC1"):
                result["dmarc_record"] = txt_str
                break
    except Exception:
        pass

    return result
