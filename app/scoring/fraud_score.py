from typing import Dict, Any, List
from app.scoring.config import WEIGHTS

def calculate_fraud_score(
    auth_analysis: Dict[str, Any], 
    text_signals: Dict[str, Any], 
    domain_check: Dict[str, Any],
    trace_results: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Combines all signals into a single 0-100 fraud score and generates plain English reasons.
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
        
    # 6. Suspicious IP
    best_guess_ip = trace_results.get("best_guess_ip")
    if best_guess_ip and "untrusted" in trace_results.get("reason", ""):
        score += WEIGHTS["suspicious_ip"]
        reasons.append(f"Suspicious origin: Sent from an untrusted public IP ({best_guess_ip}).")
        
    # Cap score at 100
    score = min(score, 100)
    
    # Map score to a risk level
    if score <= 30:
        risk_level = "Low"
    elif score <= 70:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    # If it's a completely clean email, provide a reassuring reason
    if score == 0 and len(reasons) == 0:
        reasons.append("No obvious threat indicators detected.")
        
    return {
        "score": score,
        "risk_level": risk_level,
        "reasons": reasons
    }
