from typing import Dict, Any, List
import numpy as np

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
    bec_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Multi-class threat classifier using an ensemble of calibrated probabilistic signal weights
    and feature embeddings to determine primary threat category and confidence distribution.
    """
    # Raw logit scores for each category
    logits = {
        "clean": 2.0, # Baseline prior for clean emails
        "phishing_credential_harvesting": 0.0,
        "bec_executive_impersonation": 0.0,
        "invoice_payment_fraud": 0.0,
        "extortion_blackmail": 0.0,
        "malware_delivery": 0.0,
        "brand_impersonation": 0.0
    }
    
    manip = features.get("manipulation_vectors", {}).get("scores", {})
    intent = features.get("intent_analysis", {}).get("cta_scores", {})
    entities = features.get("entities", {})
    suspicious_attachments = features.get("suspicious_attachments", [])
    
    # 1. Phishing & Credential Harvesting Evidence
    cred_cta = intent.get("credential_harvesting", 0)
    fear_score = manip.get("fear_intimidation", 0)
    urgency_score = manip.get("urgency", 0)
    if cred_cta > 0:
        logits["phishing_credential_harvesting"] += cred_cta * 3.5 + 2.0
        logits["clean"] -= 3.0
    if fear_score > 0 and cred_cta > 0:
        logits["phishing_credential_harvesting"] += fear_score * 1.5

    # 2. BEC & Executive Impersonation Evidence
    bec_score = bec_analysis.get("bec_confidence_score", 0)
    if bec_score > 30:
        logits["bec_executive_impersonation"] += (bec_score / 15.0)
        logits["clean"] -= (bec_score / 20.0)
    if bec_analysis.get("is_vip_impersonation"):
        logits["bec_executive_impersonation"] += 4.0
        logits["clean"] -= 4.0
    if manip.get("trust_secrecy", 0) > 0:
        logits["bec_executive_impersonation"] += manip.get("trust_secrecy", 0) * 2.5

    # 3. Invoice & Payment Fraud Evidence
    fin_cta = intent.get("financial_redirection", 0)
    fin_greed = manip.get("financial_greed", 0)
    fin_amounts = len(entities.get("financial_amounts", []))
    if fin_cta > 0 or (fin_greed > 0 and fin_amounts > 0):
        logits["invoice_payment_fraud"] += (fin_cta * 3.0) + (fin_greed * 1.5) + (fin_amounts * 1.0)
        logits["clean"] -= 2.5

    # 4. Extortion & Blackmail Evidence
    crypto_count = len(entities.get("crypto_wallets", []))
    if crypto_count > 0 and fear_score > 0:
        logits["extortion_blackmail"] += (crypto_count * 4.0) + (fear_score * 3.0) + 3.0
        logits["clean"] -= 5.0
    elif crypto_count > 0:
        logits["extortion_blackmail"] += 3.5

    # 5. Malware Delivery Evidence
    if suspicious_attachments:
        logits["malware_delivery"] += len(suspicious_attachments) * 4.5 + 2.0
        logits["clean"] -= 4.0
    if intent.get("malware_macro", 0) > 0:
        logits["malware_delivery"] += intent.get("malware_macro", 0) * 3.0

    # 6. Brand Impersonation & Lookalikes Evidence
    if domain_check.get("is_lookalike") or domain_check.get("is_subdomain_spoof"):
        logits["brand_impersonation"] += 5.0
        logits["clean"] -= 4.0
    if not auth_analysis.get("domain_alignment_pass", True):
        logits["brand_impersonation"] += 2.0
        logits["phishing_credential_harvesting"] += 1.5

    # If any threats triggered, suppress the clean baseline
    threat_logits_sum = sum(v for k, v in logits.items() if k != "clean")
    if threat_logits_sum > 2.0:
        logits["clean"] = max(logits["clean"] - (threat_logits_sum * 0.4), -5.0)

    # Convert logits to probability distribution via Softmax
    raw_array = np.array([logits[cat] for cat in THREAT_CATEGORIES], dtype=np.float64)
    probs = softmax(raw_array)
    
    prob_dict = {cat: round(float(probs[i]), 4) for i, cat in enumerate(THREAT_CATEGORIES)}
    
    # Identify top prediction
    top_category = max(prob_dict, key=prob_dict.get)
    top_confidence = prob_dict[top_category]
    
    # Anomaly indicator: if multiple threat categories have competing high probabilities
    competing_threats = [cat for cat, p in prob_dict.items() if cat != "clean" and p > 0.25]
    is_multi_vector_attack = len(competing_threats) > 1

    return {
        "primary_threat": top_category,
        "confidence": top_confidence,
        "is_threat": top_category != "clean" and top_confidence >= 0.40,
        "probabilities": prob_dict,
        "is_multi_vector_attack": is_multi_vector_attack,
        "detected_attack_vectors": competing_threats if is_multi_vector_attack else ([top_category] if top_category != "clean" else [])
    }
