import os
import json
from typing import Dict, Any, List

def get_mitre_ttps(primary_threat: str, features: Dict[str, Any], bec_analysis: Dict[str, Any]) -> List[Dict[str, str]]:
    """Deterministic MITRE ATT&CK Enterprise TTP mapping based on threat features."""
    ttps = []
    
    # Base Initial Access
    if primary_threat in ["phishing_credential_harvesting", "brand_impersonation"]:
        ttps.append({
            "id": "T1566.002",
            "name": "Phishing: Spearphishing Link",
            "tactic": "Initial Access",
            "description": "Adversary sent an email containing a malicious link to harvest credentials or manipulate user."
        })
        ttps.append({
            "id": "T1598.003",
            "name": "Phishing for Information: Spearphishing Link",
            "tactic": "Reconnaissance",
            "description": "Targeted link designed to solicit credentials or sensitive organizational intelligence."
        })
    elif primary_threat == "malware_delivery":
        ttps.append({
            "id": "T1566.001",
            "name": "Phishing: Spearphishing Attachment",
            "tactic": "Initial Access",
            "description": "Email contains weaponized file attachment aimed at executing initial payload."
        })
    elif primary_threat in ["bec_executive_impersonation", "invoice_payment_fraud"]:
        ttps.append({
            "id": "T1656",
            "name": "Impersonation",
            "tactic": "Defense Evasion",
            "description": "Adversary impersonates a trusted authority or business executive to induce action."
        })
        ttps.append({
            "id": "T1534",
            "name": "Internal Spearphishing / Financial Diversion",
            "tactic": "Lateral Movement / Impact",
            "description": "Attempts to manipulate payroll, vendor bank details, or internal staff."
        })
    elif primary_threat == "extortion_blackmail":
        ttps.append({
            "id": "T1486",
            "name": "Data Encrypted / Extortion for Impact",
            "tactic": "Impact",
            "description": "Adversary leverages intimidation and threats of disclosure or disruption for financial gain."
        })

    # Display name spoofing
    if bec_analysis.get("has_display_name_mismatch"):
        ttps.append({
            "id": "T1586.002",
            "name": "Compromise Accounts / Domain Spoofing",
            "tactic": "Resource Development",
            "description": "Use of free webmail and display name manipulation to deceive recipients."
        })

    if not ttps:
        ttps.append({
            "id": "T1566",
            "name": "Phishing (Generic Vector)",
            "tactic": "Initial Access",
            "description": "Standard email-based social engineering delivery vector."
        })
        
    return ttps

def generate_soc_remediations(
    primary_threat: str,
    from_address: str,
    suspicious_attachments: List[Any],
    urls: List[str]
) -> List[str]:
    """Generates concrete, actionable SOC remediation guidelines."""
    actions = []
    
    if primary_threat == "clean":
        return [
            "No immediate containment required.",
            "Standard delivery to recipient inbox."
        ]
        
    actions.append(f"Quarantine or purge email matching sender/Message-ID across all organizational mailboxes.")
    
    if from_address:
        domain = from_address.split("@")[-1].strip(">").strip() if "@" in from_address else from_address
        actions.append(f"Add domain '{domain}' to Mail Transfer Agent (MTA) perimeter blocklist.")
        
    if urls:
        actions.append(f"Submit {len(urls)} extracted URL(s) to Web Proxy / Secure Web Gateway (SWG) blocklist.")
        
    if suspicious_attachments:
        actions.append("Block attachment hashes across Endpoint Detection & Response (EDR) agents.")
        actions.append("Submit attachments to isolated sandbox for static and dynamic malware detonation.")
        
    if primary_threat in ["bec_executive_impersonation", "invoice_payment_fraud"]:
        actions.append("Contact finance & payroll teams to confirm no outbound wire transfers or bank account alterations occurred.")
        actions.append("Conduct out-of-band identity verification with the named sender using known phone numbers.")
        
    if primary_threat == "phishing_credential_harvesting":
        actions.append("If recipient interacted with the link, trigger immediate password reset and revoke active session/OAuth tokens.")
        actions.append("Audit Azure AD / Google Workspace authentication logs for anomalous logins from foreign IPs.")
        
    return actions

def perform_ai_forensic_reasoning(
    email_data: Dict[str, Any],
    features: Dict[str, Any],
    threat_classification: Dict[str, Any],
    bec_analysis: Dict[str, Any],
    synthetic_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Performs deep AI forensic reasoning using Google Gemini API if GEMINI_API_KEY is available,
    or high-fidelity local deterministic threat modeling engine as a reliable zero-failure fallback.
    """
    primary_threat = threat_classification.get("primary_threat", "clean")
    from_addr = email_data.get("from_address", "")
    subject = email_data.get("subject", "")
    urls = email_data.get("urls", [])
    suspicious_att = features.get("suspicious_attachments", [])
    
    # 1. Deterministic baseline (Always present and reliable)
    mitre_ttps = get_mitre_ttps(primary_threat, features, bec_analysis)
    soc_actions = generate_soc_remediations(primary_threat, from_addr, suspicious_att, urls)
    
    summary = f"Email evaluated as '{primary_threat.replace('_', ' ').title()}' with confidence {round(threat_classification.get('confidence', 0)*100)}%. "
    if bec_analysis.get("bec_confidence_score", 0) > 40:
        summary += f"High-confidence Business Email Compromise signature detected ({bec_analysis.get('bec_risk_level')} risk). "
    if synthetic_analysis.get("is_likely_synthetic"):
        summary += f"Linguistic entropy and structure strongly indicate AI-generated/templated phrasing ({synthetic_analysis.get('synthetic_score')}%). "
    if not email_data.get("auth_analysis", {}).get("domain_alignment_pass", True):
        summary += "Sender domain alignment failed between From and Return-Path headers. "

    # 2. Check for Gemini API Key to enrich with advanced Generative AI reasoning
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            
            prompt = f"""
            You are a Principal Cyber Threat Intelligence Analyst. Analyze this suspicious email telemetry:
            - From: {from_addr}
            - Subject: {subject}
            - Primary Threat Classification: {primary_threat}
            - BEC Indicators: {bec_analysis.get('bec_indicators')}
            - Manipulation Vectors: {features.get('manipulation_vectors', {}).get('detected')}
            - Extracted URLs: {urls}
            - Attachments: {[a.get('filename') for a in suspicious_att]}
            
            Provide a strict JSON response with:
            {{
                "forensic_summary": "2-3 sentences concise SOC executive summary",
                "attacker_intent": "Detailed breakdown of attacker motivation and desired impact",
                "recommended_soc_actions": ["Action 1", "Action 2", "Action 3"]
            }}
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config={'response_mime_type': 'application/json'}
            )
            parsed_llm = json.loads(response.text)
            if "forensic_summary" in parsed_llm:
                summary = parsed_llm["forensic_summary"]
            if "recommended_soc_actions" in parsed_llm and isinstance(parsed_llm["recommended_soc_actions"], list):
                soc_actions = parsed_llm["recommended_soc_actions"]
        except Exception:
            # Fall back gracefully to local deterministic reasoning
            pass

    return {
        "forensic_summary": summary.strip(),
        "mitre_attack_ttps": mitre_ttps,
        "recommended_soc_actions": soc_actions,
        "evidential_severity": "Critical" if threat_classification.get("confidence", 0) > 0.75 and primary_threat != "clean" else ("High" if primary_threat != "clean" else "Low")
    }
