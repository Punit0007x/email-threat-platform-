from typing import Dict, Any, List
from app.ml.feature_extractor import extract_advanced_features
from app.ml.bec_engine import analyze_bec_threat
from app.ml.synthetic_detector import detect_synthetic_content
from app.ml.threat_classifier import classify_email_threat
from app.ml.genai_analyzer import perform_ai_forensic_reasoning
from app.ml.deep_auditor import forensic_auditor

def analyze_email_ai_ml(
    from_address: str,
    reply_to: str,
    subject: str,
    body_plain: str,
    body_html: str,
    attachments: List[Any],
    urls: List[str],
    domain_check: Dict[str, Any],
    auth_analysis: Dict[str, Any],
    forensic_report: Any = None,
    geo_trace: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Main entry point for the AI/ML Threat Analysis & Forensic Reasoning Subsystem.
    Executes feature extraction, BEC detection, synthetic analysis, probabilistic threat
    classification, spam detection, GenAI analysis, and Deep AI Forensic Auditing.
    """
    # 1. Extract lexical, structural, and manipulation features
    sender_domain = (from_address.split('@')[-1].strip('>') if '@' in (from_address or "") else "") or auth_analysis.get("from_domain", "")
    features = extract_advanced_features(
        subject=subject or "",
        body_plain=body_plain or "",
        body_html=body_html or "",
        attachments=attachments or [],
        urls=urls or [],
        sender_domain=sender_domain
    )
    features["forensic_report"] = forensic_report
    
    # 2. Dedicated BEC & Executive Impersonation Analysis
    combined_body = f"{body_plain} {body_html}".strip()
    bec_analysis = analyze_bec_threat(
        from_header=from_address or "",
        reply_to_header=reply_to,
        subject=subject or "",
        body_text=combined_body
    )
    
    # 3. Synthetic / AI-Generated Language Detection
    synthetic_analysis = detect_synthetic_content(combined_body)
    
    # 4. Multi-Class Probabilistic Threat Classification (Unified calibrated model)
    threat_classification = classify_email_threat(
        features=features,
        domain_check=domain_check or {},
        auth_analysis=auth_analysis or {},
        bec_analysis=bec_analysis,
        raw_text=f"{subject} {combined_body}"
    )
    
    # Spam signal derived from calibrated probability
    spam_prob = threat_classification.get("class_probabilities", {}).get("spam", 0.0)
    spam_analysis = {
        "prediction": "spam" if spam_prob >= 0.5 else "ham",
        "is_spam": spam_prob >= 0.5,
        "confidence": round(spam_prob, 4),
        "spam_probability": round(spam_prob, 4),
    }
    
    # 5. Deep AI Forensic Auditing Layer (High-Capability Cognitive, Evasion & Multi-Pillar Calibration)
    ai_audit = forensic_auditor.conduct_forensic_audit(
        from_address=from_address or "",
        subject=subject or "",
        body_plain=body_plain or "",
        body_html=body_html or "",
        urls=urls or [],
        attachments=attachments or [],
        auth_analysis=auth_analysis or {},
        domain_check=domain_check or {},
        geo_trace=geo_trace or {},
        ml_prediction=threat_classification,
        bec_analysis=bec_analysis
    )
    
    # 6. AI / LLM Forensic Reasoning & MITRE ATT&CK Mapping
    email_summary_ctx = {
        "from_address": from_address,
        "subject": subject,
        "body_plain": body_plain,
        "urls": urls,
        "auth_analysis": auth_analysis
    }
    ai_forensics = perform_ai_forensic_reasoning(
        email_data=email_summary_ctx,
        features=features,
        threat_classification=threat_classification,
        bec_analysis=bec_analysis,
        synthetic_analysis=synthetic_analysis
    )
    
    return {
        "classification": threat_classification,
        "spam_analysis": spam_analysis,
        "features": features,
        "bec_analysis": bec_analysis,
        "synthetic_analysis": synthetic_analysis,
        "deep_ai_audit": ai_audit,
        "ai_forensics": ai_forensics
    }
