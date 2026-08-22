from typing import Dict, Any, List
from app.ml.feature_extractor import extract_advanced_features
from app.ml.bec_engine import analyze_bec_threat
from app.ml.synthetic_detector import detect_synthetic_content
from app.ml.threat_classifier import classify_email_threat
from app.ml.genai_analyzer import perform_ai_forensic_reasoning

def analyze_email_ai_ml(
    from_address: str,
    reply_to: str,
    subject: str,
    body_plain: str,
    body_html: str,
    attachments: List[Any],
    urls: List[str],
    domain_check: Dict[str, Any],
    auth_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Main entry point for the AI/ML Threat Analysis & Forensic Reasoning Subsystem.
    Executes feature extraction, BEC detection, synthetic analysis, probabilistic threat
    classification, and SOC remediation generation.
    """
    # 1. Extract lexical, structural, and manipulation features
    features = extract_advanced_features(
        subject=subject or "",
        body_plain=body_plain or "",
        body_html=body_html or "",
        attachments=attachments or [],
        urls=urls or []
    )
    
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
    
    # 4. Multi-Class Probabilistic Threat Classification (Trained Scikit-Learn TF-IDF + Heuristic Ensemble)
    threat_classification = classify_email_threat(
        features=features,
        domain_check=domain_check or {},
        auth_analysis=auth_analysis or {},
        bec_analysis=bec_analysis,
        raw_text=f"{subject} {combined_body}"
    )
    
    # 5. AI / LLM Forensic Reasoning & MITRE ATT&CK Mapping
    email_summary_ctx = {
        "from_address": from_address,
        "subject": subject,
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
        "features": features,
        "bec_analysis": bec_analysis,
        "synthetic_analysis": synthetic_analysis,
        "ai_forensics": ai_forensics
    }
