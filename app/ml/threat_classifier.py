from typing import Dict, Any, List
import numpy as np

from app.ml.trained_model import predict_ml_probabilities, extract_top_predictive_tokens

# Threat categories supported by the platform
THREAT_CATEGORIES = [
    "clean",
    "phishing_credential_harvesting",
    "bec_executive_impersonation",
    "invoice_payment_fraud",
    "extortion_blackmail",
    "malware_delivery",
    "brand_impersonation"
]

def softmax(x: np.ndarray) -> np.ndarray:
    """Computes softmax values for a score vector."""
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=0)

def classify_email_threat(
    features: Dict[str, Any],
    domain_check: Dict[str, Any],
    auth_analysis: Dict[str, Any],
    bec_analysis: Dict[str, Any],
    raw_text: str = ""
) -> Dict[str, Any]:
    """
    Multi-class threat classifier fusing:
    1. Trained Scikit-Learn TF-IDF N-gram Model
    2. Deep Structural, BEC, Entity, and Protocol Heuristics
    """
    # 1. Obtain Base Probabilities from Trained Scikit-Learn Pipeline
    ml_probs = predict_ml_probabilities(raw_text)
    
    # 2. Compute Logits with Heuristic Telemetry Adjustments
    logits = {cat: np.log(max(ml_probs.get(cat, 0.05), 1e-4)) for cat in THREAT_CATEGORIES}
    
    manip = features.get("manipulation_vectors", {}).get("scores", {})
    intent = features.get("intent_analysis", {}).get("cta_scores", {})
    entities = features.get("entities", {})
    suspicious_attachments = features.get("suspicious_attachments", [])
    
    # 3. Apply Deep Heuristic Adjustments
    # Phishing / Credential Harvesting
    cred_cta = intent.get("credential_harvesting", 0)
    fear_score = manip.get("fear_intimidation", 0)
    if cred_cta > 0:
        logits["phishing_credential_harvesting"] += cred_cta * 2.5 + 1.5
        logits["clean"] -= 2.5
    if fear_score > 0 and cred_cta > 0:
        logits["phishing_credential_harvesting"] += fear_score * 1.0

    # BEC / Executive Impersonation
    bec_score = bec_analysis.get("bec_confidence_score", 0)
    if bec_score > 30:
        logits["bec_executive_impersonation"] += (bec_score / 20.0) + 1.0
        logits["clean"] -= (bec_score / 25.0)
    if bec_analysis.get("is_vip_impersonation"):
        logits["bec_executive_impersonation"] += 3.0
        logits["clean"] -= 3.0

    # Invoice & Payment Fraud
    fin_cta = intent.get("financial_redirection", 0)
    fin_greed = manip.get("financial_greed", 0)
    if fin_cta > 0 or (fin_greed > 0 and len(entities.get("financial_amounts", [])) > 0):
        logits["invoice_payment_fraud"] += (fin_cta * 2.0) + (fin_greed * 1.5)
        logits["clean"] -= 2.0

    # Forensic Adjustments (from trace_pipeline.py)
    if features.get("forensic_report"):
        report = features["forensic_report"]
        if report.geo and (report.geo.is_tor_exit or report.geo.is_known_vpn):
            logits["phishing_credential_harvesting"] += 1.5
            logits["clean"] -= 1.5
        
        if report.domain and report.domain.domain_age_days is not None and report.domain.domain_age_days < 30:
            logits["brand_impersonation"] += 1.5
            logits["invoice_payment_fraud"] += 1.0
            logits["clean"] -= 1.5
        
        if report.domain and report.domain.lookalike_of:
            logits["brand_impersonation"] += 2.5
            logits["clean"] -= 2.5
            
        if report.related_incidents:
            logits["bec_executive_impersonation"] += 1.0
            logits["invoice_payment_fraud"] += 1.0
            logits["clean"] -= 2.0

    crypto_count = len(entities.get("crypto_wallets", []))
    if crypto_count > 0:
        logits["extortion_blackmail"] += (crypto_count * 3.5) + (fear_score * 2.0) + 2.0
        logits["clean"] -= 4.0

    # Malware Delivery
    if suspicious_attachments:
        logits["malware_delivery"] += len(suspicious_attachments) * 3.5 + 2.0
        logits["clean"] -= 3.0

    # Brand Impersonation & Typosquatting
    if domain_check.get("is_lookalike") or domain_check.get("is_subdomain_spoof"):
        logits["brand_impersonation"] += 4.5
        logits["clean"] -= 3.5
        
    # Only penalize for alignment if the email ACTUALLY attempted SPF/DKIM but failed
    has_auth_attempt = auth_analysis.get("spf") != "not_present" or auth_analysis.get("dkim") != "not_present"
    if has_auth_attempt and not auth_analysis.get("domain_alignment_pass", True):
        logits["brand_impersonation"] += 1.0
        logits["phishing_credential_harvesting"] += 0.5
        
    # Baseline reinforcement for legitimate authenticated messages
    if auth_analysis.get("domain_alignment_pass") and auth_analysis.get("spf") == "pass" and auth_analysis.get("dkim") == "pass":
        logits["clean"] += 2.0


    # Convert final adjusted logits to probabilities
    raw_array = np.array([logits[cat] for cat in THREAT_CATEGORIES], dtype=np.float64)
    probs = softmax(raw_array)
    prob_dict = {cat: round(float(probs[i]), 4) for i, cat in enumerate(THREAT_CATEGORIES)}
    
    top_category = max(prob_dict, key=prob_dict.get)
    top_confidence = prob_dict[top_category]
    
    # Extract top explainable predictive n-grams from the email text
    explainable_tokens = extract_top_predictive_tokens(raw_text, top_category, top_n=4)
    
    competing_threats = [cat for cat, p in prob_dict.items() if cat != "clean" and p > 0.25]
    is_multi_vector_attack = len(competing_threats) > 1

    return {
        "primary_threat": top_category,
        "confidence": top_confidence,
        "is_threat": top_category != "clean" and top_confidence >= 0.75,
        "probabilities": prob_dict,
        "raw_ml_probabilities": ml_probs,
        "explainable_tokens": explainable_tokens,
        "is_multi_vector_attack": is_multi_vector_attack,
        "detected_attack_vectors": competing_threats if is_multi_vector_attack else ([top_category] if top_category != "clean" else [])
    }
