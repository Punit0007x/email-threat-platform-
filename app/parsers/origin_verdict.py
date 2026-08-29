from typing import Dict, Any, Optional, Literal, List

OriginVerdict = Literal[
    "compromised_account",
    "spoofed_domain", 
    "anonymized_infrastructure",
    "direct_actor",
    "legitimate",
    "unknown"
]

def classify_origin_verdict(
    auth_analysis: Optional[Dict[str, Any]],
    infra_intel: Optional[Dict[str, Any]],
    ip_reputation: Optional[Dict[str, Any]],
    trace_results: Optional[Dict[str, Any]],
    domain_check: Optional[Dict[str, Any]],
    whois_intel: Optional[Dict[str, Any]],
    urls: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Classifies the probable origin nature of the email based on
    authentication results, infrastructure analysis, IP reputation,
    domain analysis, WHOIS intelligence, and embedded URLs.
    """
    auth_analysis = auth_analysis or {}
    infra_intel = infra_intel or {}
    ip_reputation = ip_reputation or {}
    trace_results = trace_results or {}
    domain_check = domain_check or {}
    whois_intel = whois_intel or {}
    urls = urls or []
    
    from app.scoring.config import SUSPICIOUS_HOSTING_DOMAINS, SUSPICIOUS_URL_PATHS, URL_SHORTENERS
    has_phish_url = any(
        any(sd in u.lower() for sd in SUSPICIOUS_HOSTING_DOMAINS) or 
        any(sp in u.lower() for sp in SUSPICIOUS_URL_PATHS) or
        any(sh in u.lower() for sh in URL_SHORTENERS)
        for u in urls
    )
    
    verdict: OriginVerdict = "unknown"
    confidence = 0
    reasons = []
    
    # Extract key signals
    spf = auth_analysis.get("spf", "not_present")
    dkim = auth_analysis.get("dkim", "not_present")
    dmarc = auth_analysis.get("dmarc", "not_present")
    domain_aligned = auth_analysis.get("domain_alignment_pass", False)
    
    infra_type = infra_intel.get("infra_type", "Unknown")
    is_vpn_proxy = infra_intel.get("is_vpn_proxy", False)
    is_cloud = infra_intel.get("is_cloud", False)
    
    ip_listed = ip_reputation.get("is_listed", False)
    is_tor = ip_reputation.get("is_tor_exit", False)
    ip_risk = ip_reputation.get("risk_level", "Clean")
    
    is_lookalike = domain_check.get("is_lookalike", False)
    is_subdomain_spoof = domain_check.get("is_subdomain_spoof", False)
    
    whois_age = whois_intel.get("domain_age_days")
    whois_privacy = whois_intel.get("is_privacy_protected", False)
    
    best_guess_ip = trace_results.get("best_guess_ip")
    trace_reason = trace_results.get("reason", "")
    
    # === RULE-BASED CLASSIFICATION ===
    
    # 1. Compromised Account / Weaponized Webmail: Auth passes but contains phishing URLs/payloads
    if (spf == "pass" or dkim == "pass") and has_phish_url:
        verdict = "compromised_account"
        confidence = 88
        reasons.append("Email account authenticated (SPF/DKIM) but weaponized with deceptive phishing URLs / credential harvest links")
        return {"verdict": verdict, "confidence": confidence, "reasons": reasons}
        
    # 2. Legitimate: Auth passes, domain aligned, clean infrastructure and NO phishing URLs
    if spf == "pass" and dkim == "pass" and dmarc == "pass" and domain_aligned and not has_phish_url:
        verdict = "legitimate"
        confidence = 90
        reasons.append("Full authentication pass (SPF/DKIM/DMARC) with domain alignment and clean telemetry")
        return {"verdict": verdict, "confidence": confidence, "reasons": reasons}
    
    # 2. Compromised Account: Auth passes but unusual origin/infrastructure
    # (e.g., SPF/DKIM pass but from unexpected IP/ISP, or internal sender from external IP)
    if spf == "pass" and dkim == "pass" and domain_aligned:
        if is_vpn_proxy or is_tor or ip_risk in ["High", "Critical"] or "untrusted" in trace_reason.lower():
            verdict = "compromised_account"
            confidence = 75
            reasons.append("Authentication passes but origin IP is suspicious (VPN/TOR/untrusted/cloud)")
            return {"verdict": verdict, "confidence": confidence, "reasons": reasons}
        elif is_cloud and not domain_aligned:
            verdict = "compromised_account"
            confidence = 65
            reasons.append("Authentication passes but sent from cloud infrastructure with domain mismatch")
            return {"verdict": verdict, "confidence": confidence, "reasons": reasons}
    
    # 3. Spoofed Domain: Lookalike/subdomain spoofing detected, auth fails
    if is_lookalike or is_subdomain_spoof:
        verdict = "spoofed_domain"
        confidence = 85
        reasons.append(f"Domain spoofing detected: lookalike={is_lookalike}, subdomain_spoof={is_subdomain_spoof}")
        if not domain_aligned:
            reasons.append("Domain alignment failed (Return-Path != From domain)")
        return {"verdict": verdict, "confidence": confidence, "reasons": reasons}
    
    # 4. Anonymized Infrastructure: VPN/TOR/proxy, cloud hosting, privacy-protected WHOIS
    if is_vpn_proxy or is_tor or is_cloud:
        if whois_privacy or (whois_age is not None and whois_age < 90):
            verdict = "anonymized_infrastructure"
            confidence = 80
            reasons.append(f"Anonymized infrastructure: VPN={is_vpn_proxy}, TOR={is_tor}, Cloud={is_cloud}")
            if whois_privacy:
                reasons.append("WHOIS privacy protection enabled")
            if whois_age is not None and whois_age < 90:
                reasons.append(f"Recently registered domain ({whois_age} days)")
            return {"verdict": verdict, "confidence": confidence, "reasons": reasons}
    
    # 5. Direct Actor: No VPN/TOR, but auth fails, infrastructure is residential/ISP, 
    #    domain is not lookalike but may be attacker-owned
    if not is_vpn_proxy and not is_tor and not is_cloud:
        if spf in ["fail", "softfail", "none"] or dkim in ["fail", "none"] or dmarc in ["fail", "none"]:
            if not is_lookalike and not is_subdomain_spoof:
                verdict = "direct_actor"
                confidence = 70
                reasons.append("Direct actor: Failed auth, residential/ISP infrastructure, no spoofing")
                if whois_age is not None and whois_age < 180:
                    reasons.append(f"Attacker-owned domain registered {whois_age} days ago")
                return {"verdict": verdict, "confidence": confidence, "reasons": reasons}
    
    # 6. Fallback: Unknown with whatever signals we have
    if ip_listed:
        verdict = "anonymized_infrastructure" if (is_vpn_proxy or is_tor) else "direct_actor"
        confidence = 50
        reasons.append(f"IP listed on blocklists, infrastructure type: {infra_type}")
    
    if not reasons:
        reasons.append("Insufficient signals for definitive classification")
    
    return {"verdict": verdict, "confidence": confidence, "reasons": reasons}