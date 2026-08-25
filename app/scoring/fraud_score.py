from typing import Dict, Any, List, Optional
from app.scoring.config import WEIGHTS

def calculate_fraud_score(
    auth_analysis: Dict[str, Any], 
    text_signals: Dict[str, Any], 
    domain_check: Dict[str, Any],
    trace_results: Dict[str, Any],
    ai_ml_analysis: Optional[Dict[str, Any]] = None,
    whois_intel: Optional[Dict[str, Any]] = None,
    ip_reputation: Optional[Dict[str, Any]] = None,
    threat_correlations: Optional[Dict[str, Any]] = None,
    domain_recon: Optional[Dict[str, Any]] = None,
    history_intel: Optional[Dict[str, Any]] = None,
    tech_fingerprint: Optional[Dict[str, Any]] = None,
    dork_intel: Optional[Dict[str, Any]] = None,
    ip_network_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Combines protocol, forensic, and AI/ML threat signals into a single 0-100 fraud score and generates plain English reasons.
    """
    score = 0
    reasons = []
    
    # 1. Auth Failures (SPF/DKIM/DMARC)
    auth_issues = []
    for protocol in ["spf", "dkim", "dmarc"]:
        status = auth_analysis.get(protocol, "not_present")
        if status in ["fail", "softfail", "none", "not_present"]:
            auth_issues.append(protocol.upper())
            
    if auth_issues:
        score += WEIGHTS["auth_fail_or_missing"]
        reasons.append(f"Email authentication issues detected: {', '.join(auth_issues)} check(s) were missing or failed.")
        
    # 2. Domain Alignment (Return-Path vs From)
    if not auth_analysis.get("domain_alignment_pass", False):
        score += WEIGHTS["domain_alignment_fail"]
        reasons.append("Sender identity mismatch: The Return-Path domain does not match the 'From' domain.")
        
    # 3. Domain Lookalike
    if domain_check.get("is_lookalike") or domain_check.get("is_subdomain_spoof"):
        score += WEIGHTS["domain_lookalike"]
        reasons.append(domain_check.get("details", "Sender domain is a lookalike to a known brand."))
        
    # 4. Text Signals (Urgency & Authority)
    urgency_count = text_signals.get("urgency_count", 0)
    if urgency_count > 0:
        pts = min(WEIGHTS["urgency_phrase"] * urgency_count, 20) # Cap at 20 points
        score += pts
        reasons.append(f"High-pressure language: {urgency_count} urgency phrase(s) detected.")
        
    auth_count = text_signals.get("authority_count", 0)
    if auth_count > 0:
        pts = min(WEIGHTS["authority_phrase"] * auth_count, 20)
        score += pts
        reasons.append(f"Authority impersonation: {auth_count} reference(s) to banks/organizations detected.")
        
    # 5. Link Mismatch & Shorteners
    link_mismatches = text_signals.get("link_mismatch_count", 0)
    if link_mismatches > 0:
        pts = min(WEIGHTS["link_mismatch"] * link_mismatches, 20)
        score += pts
        reasons.append(f"Deceptive links: {link_mismatches} link(s) display a different destination than where they actually go.")
        
    if text_signals.get("has_shortener", False):
        score += WEIGHTS["url_shortener"]
        reasons.append("URL shortener used: Email contains shortened links often used to hide malicious destinations.")
        
    # 6. Suspicious IP (Tor / VPN / Blocklist)
    best_guess_ip = trace_results.get("best_guess_ip")
    if best_guess_ip and ("tor" in trace_results.get("reason", "").lower() or "suspicious" in trace_results.get("reason", "").lower() or trace_results.get("is_vpn")):
        score += WEIGHTS["suspicious_ip"]
        reasons.append(f"Suspicious origin: Sent from an anonymized/suspicious IP ({best_guess_ip}).")
        
    # 6b. WHOIS Registrar Intelligence
    if whois_intel and whois_intel.get("queried"):
        age_days = whois_intel.get("domain_age_days")
        if age_days is not None and age_days < 30:
            score += WEIGHTS["whois_new_domain"]
            reasons.append(f"Newly registered domain: Sender domain created only {age_days} days ago (high phishing risk).")
        elif age_days is not None and age_days < 90:
            score += max(WEIGHTS["whois_new_domain"] // 2, 5)
            reasons.append(f"Recently registered domain: Sender domain created {age_days} days ago.")
            
        if whois_intel.get("is_privacy_protected") and not auth_analysis.get("domain_alignment_pass", False):
            score += WEIGHTS["whois_privacy_protected"]
            reasons.append("Domain registrant information is privacy-protected / redacted.")
            
        registrar = whois_intel.get("registrar", "")
        if registrar and any(risky in registrar.lower() for risky in ["freenom", "dot.tk", "dot.ml", "dot.ga", "dot.cf", "dot.gq"]):
            score += WEIGHTS["whois_risky_registrar"]
            reasons.append(f"High-risk registrar: '{registrar}' associated with disposable/abused domains.")
        
    # 6c. IP Reputation & DNSBL
    if ip_reputation and ip_reputation.get("is_listed"):
        if ip_reputation.get("is_tor_exit"):
            score += WEIGHTS["ip_tor_exit"]
            reasons.append("TOR exit node detected: Origin IP is a known Tor exit node.")
        else:
            score += WEIGHTS["ip_blocklisted"]
            listed_zones = [r["blocklist_name"] for r in ip_reputation.get("dnsbl_results", []) if r.get("listed")]
            reasons.append(f"IP blocklisted on {len(listed_zones)} reputation list(s): {', '.join(listed_zones)}.")
    
    # 6d. Threat Intelligence Correlation / Repeat Offender
    if threat_correlations:
        repeat_score = threat_correlations.get("repeat_offender_score", 0)
        from app.ml.bec_engine import FREE_WEBMAIL_DOMAINS
        sender_domain = auth_analysis.get("from_domain", "")
        print(f"DEBUG FRAUD SCORE: sender_domain={sender_domain}, FREE_WEBMAIL_DOMAINS={FREE_WEBMAIL_DOMAINS}")
        # Don't heavily penalize massive shared domains like gmail.com just because they appear in previous cases
        if repeat_score > 0 and sender_domain not in FREE_WEBMAIL_DOMAINS and not auth_analysis.get("domain_alignment_pass", False):
            score += int(repeat_score * WEIGHTS["repeat_offender"])
            reasons.append(f"Repeat offender intelligence: Indicators seen in {threat_correlations.get('domain_case_count', 0) + threat_correlations.get('ip_case_count', 0)} prior malicious case(s).")
    
    # 6e. Domain Reconnaissance (Subdomain Analysis)
    if domain_recon and not auth_analysis.get("domain_alignment_pass", False):
        if "Suspicious subdomains detected" in " ".join(domain_recon.get("risk_indicators", [])):
            score += WEIGHTS["domain_suspicious_subdomains"]
            reasons.append(f"Suspicious subdomains found: {', '.join([r for r in domain_recon.get('risk_indicators', []) if 'Suspicious' in r][:3])}")
    
    # 6f. Historical Analysis (Wayback)
    if history_intel and not auth_analysis.get("domain_alignment_pass", False):
        age_days = history_intel.get("domain_age_wayback_days")
        if age_days is not None and age_days < 30:
            score += WEIGHTS["history_recent_first_seen"]
            reasons.append(f"Domain first archived only {age_days} days ago — very recent web presence.")
        
        if history_intel.get("content_changes", 0) > 20:
            score += WEIGHTS["history_high_volatility"]
            reasons.append(f"High content volatility ({history_intel.get('content_changes')} unique content hashes) — possible phishing kit rotation.")
    
    # 6g. Technology Fingerprinting
    if tech_fingerprint:
        if tech_fingerprint.get("phishing_kit_detected"):
            score += WEIGHTS["tech_phishing_kit"]
            reasons.append("Phishing kit indicators detected in web technology stack.")
        
        if not auth_analysis.get("domain_alignment_pass", False) and "No WAF/CDN security headers detected" in " ".join(tech_fingerprint.get("risk_indicators", [])):
            score += WEIGHTS["tech_no_waf"]
            reasons.append("No WAF/CDN detected — direct origin exposure.")
    
    # 6h. Dork Intelligence (OSINT)
    if dork_intel and not auth_analysis.get("domain_alignment_pass", False):
        if dork_intel.get("categories", {}).get("phishing_pages"):
            score += WEIGHTS["dork_phishing_pages"]
            reasons.append(f"Dork scan found potential phishing pages ({len(dork_intel['categories']['phishing_pages'])} results).")
        
        if dork_intel.get("categories", {}).get("leaked_credentials"):
            score += WEIGHTS["dork_leaked_creds"]
            reasons.append(f"Dork scan found possible credential leaks ({len(dork_intel['categories']['leaked_credentials'])} results).")
    
    # 6i. IP Network Context
    if ip_network_context and not auth_analysis.get("domain_alignment_pass", False):
        if "cloud hosting CIDR" in " ".join(ip_network_context.get("network_risk_indicators", [])):
            score += WEIGHTS["ip_cloud_hosting_cidr"]
            reasons.append(f"Origin IP in cloud hosting CIDR ({ip_network_context.get('cidr', 'unknown')}).")
    
    # 7. AI/ML Deep Threat Indicators
    if ai_ml_analysis:
        bec = ai_ml_analysis.get("bec_analysis", {})
        if bec.get("bec_confidence_score", 0) >= 40:
            score += 25
            for ind in bec.get("bec_indicators", []):
                reasons.append(f"AI BEC Analysis: {ind}")
                
        classification = ai_ml_analysis.get("classification", {})
        primary_threat = classification.get("primary_threat", "clean")
        if primary_threat != "clean" and classification.get("confidence", 0) >= 0.75:
            score += 20
            reasons.append(f"AI Multi-Class Model: Identified as '{primary_threat.replace('_', ' ').title()}' (Confidence: {round(classification.get('confidence', 0)*100)}%).")
            
        synthetic = ai_ml_analysis.get("synthetic_analysis", {})
        if synthetic.get("is_likely_synthetic"):
            score += 10
            reasons.append(f"AI Language Analysis: High likelihood of synthetic/LLM-generated text (Score: {synthetic.get('synthetic_score')}%).")
            
        spam = ai_ml_analysis.get("spam_analysis", {})
        if spam.get("is_spam"):
            score += 15
            reasons.append(f"AI Spam Detection: Classified as spam using Naive Bayes model (Confidence: {round(spam.get('confidence', 0)*100)}%).")
            
        features = ai_ml_analysis.get("features", {})
        suspicious_att = features.get("suspicious_attachments", [])
        if suspicious_att:
            score += 30
            reasons.append(f"Malicious Attachment Vector: {len(suspicious_att)} high-risk file extension(s) detected ({', '.join([a['filename'] for a in suspicious_att])}).")

    # 8. Cryptographic Authenticity Validation Discount
    is_fully_authenticated = (
        auth_analysis.get("spf") == "pass" and
        auth_analysis.get("dkim") == "pass" and
        auth_analysis.get("dmarc") == "pass" and
        auth_analysis.get("domain_alignment_pass", False)
    )
    has_attack_payload = (
        domain_check.get("is_lookalike", False) or
        text_signals.get("link_mismatch_count", 0) > 0 or
        text_signals.get("has_shortener", False) or
        (ai_ml_analysis and ai_ml_analysis.get("classification", {}).get("primary_threat", "clean") not in ["clean", "legitimate"] and ai_ml_analysis.get("classification", {}).get("confidence", 0) > 0.75)
    )
    
    if is_fully_authenticated and not has_attack_payload and urgency_count == 0 and auth_count == 0:
        score = 0
        reasons = ["Email is cryptographically authenticated (SPF, DKIM, DMARC PASS) and originates from the legitimate domain."]

    # Cap score at 100
    score = min(max(0, score), 100)
    
    # Map score to a risk level
    if score <= 30:
        risk_level = "Low"
    elif score <= 70:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    # If it's a completely clean email, provide a reassuring reason
    if score == 0 and len(reasons) == 0:
        reasons.append("No obvious threat indicators detected. Email conforms to standard legitimate baseline.")
        
    return {
        "score": score,
        "risk_level": risk_level,
        "reasons": reasons
    }

