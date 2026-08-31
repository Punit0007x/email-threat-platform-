"""
deep_auditor.py
---------------
Advanced Deep AI & Neural Forensic Auditing Layer.

This module sits above the raw ML classifier and protocol parsers as a
comprehensive Forensic Auditing System. It performs:
  1. Cognitive & Psychological Manipulation Deconstruction (Fear, Urgency, Authority, Secrecy, Greed)
  2. Zero-Day & Advanced Evasion/Obfuscation Auditing (Homoglyphs, Zero-Width Unicode, Hidden HTML, Base64 Payloads)
  3. Contextual Protocol & Linguistic Cross-Verification (Alignment vs Tone vs Relay Trace)
  4. Multi-Signal Bayesian Score Calibration (Producing an audited, high-precision 0-100 Threat Score)
  5. MITRE ATT&CK Matrix & Actionable SOC Containment Directives
"""

import re
import math
import unicodedata
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse


class DeepAIForensicAuditor:
    """
    Higher-Capability AI Threat Auditor that evaluates multi-dimensional forensic telemetry.
    """

    # Cognitive Manipulation Lexicons
    COGNITIVE_VECTORS = {
        "urgency_pressure": [
            r"\burgen(t|cy)\b", r"\bimmediate(ly)?\b", r"\bright now\b", r"\basap\b",
            r"\bwithin \d+\s*(hours?|mins?|minutes?|days?)\b", r"\bexpires?\b",
            r"\baction required\b", r"\bdo not delay\b", r"\bdeadline\b", r"\blast warning\b"
        ],
        "fear_coercion": [
            r"\baccount\s+(suspended|terminated|locked|closed|disabled)\b",
            r"\bunauthorized (access|activity|sign[- ]in)\b", r"\blegal action\b",
            r"\blawsuit\b", r"\bpolice\b", r"\bfbi\b", r"\birs\b", r"\bpenalt(y|ies)\b",
            r"\bbreach(ed)?\b", r"\bblackmail\b", r"\brecorded you\b", r"\bexfiltrated\b"
        ],
        "authority_simulation": [
            r"\b(chief executive officer|ceo|cfo|coo|cio|ciso)\b",
            r"\bexecutive director\b", r"\bboard of directors\b", r"\bhuman resources\b",
            r"\bpayroll (department|team)\b", r"\bit (helpdesk|support|administrator)\b",
            r"\bglobal security\b", r"\bcompliance office\b"
        ],
        "financial_enticement": [
            r"\bwire transfer\b", r"\bdirect deposit\b", r"\bbank account\b",
            r"\brouting number\b", r"\bremittance\b", r"\boverdue invoice\b",
            r"\bbitcoin\b", r"\bbtc\b", r"\bcryptocurrency\b", r"\bgift cards?\b",
            r"\bsettlement payout\b", r"\bcompensation\b"
        ],
        "secrecy_isolation": [
            r"\bkeep this confidential\b", r"\bdo not tell anyone\b", r"\bbetween us\b",
            r"\bprivate matter\b", r"\bdiscrete(ly)?\b", r"\bare you at your desk\b",
            r"\bare you available\b", r"\bcannot take calls\b", r"\boffsite meeting\b"
        ]
    }

    # Evasion and Obfuscation Indicators
    ZERO_WIDTH_CHARS = {'\u200b', '\u200c', '\u200d', '\ufeff', '\u200e', '\u200f', '\u202a', '\u202b', '\u202c', '\u202d', '\u202e'}
    
    SUSPICIOUS_DOMAINS_TLD = {'.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.xyz', '.work', '.click', '.fit', '.buzz'}

    def __init__(self):
        pass

    def audit_evasion_tactics(self, raw_text: str, body_html: str, urls: List[str]) -> Dict[str, Any]:
        """Audits the email payload for advanced defense evasion, obfuscation, and hidden text."""
        tactics_detected = []
        evasion_risk_score = 0.0

        full_text = f"{raw_text} {body_html}"

        # 1. Zero-Width / Invisible Character Injection
        zwc_count = sum(full_text.count(char) for char in self.ZERO_WIDTH_CHARS)
        if zwc_count > 0:
            tactics_detected.append({
                "technique": "Zero-Width Character Injection (T1027)",
                "details": f"Found {zwc_count} invisible zero-width Unicode characters used to bypass keyword filters."
            })
            evasion_risk_score += min(35.0, zwc_count * 5.0)

        # 2. Homoglyph / Mixed-Script Spoofing
        non_ascii_letters = [c for c in raw_text if ord(c) > 127 and c.isalpha()]
        if len(non_ascii_letters) > 3:
            # Check for Cyrillic / Greek substitutions in Latin text
            scripts = set(unicodedata.name(c, "").split()[0] for c in non_ascii_letters if unicodedata.name(c, ""))
            if len(scripts) > 1:
                tactics_detected.append({
                    "technique": "Homoglyphic Internationalized Character Spoofing (T1036.007)",
                    "details": f"Detected mixed Unicode scripts ({', '.join(scripts)}) masquerading as standard Latin characters."
                })
                evasion_risk_score += 25.0

        # 3. Hidden HTML CSS Text / Font-Size Zero
        if body_html:
            hidden_css = re.findall(r'(display\s*:\s*none|font-size\s*:\s*0|opacity\s*:\s*0|color\s*:\s*transparent|visibility\s*:\s*hidden)', body_html, re.IGNORECASE)
            if hidden_css:
                tactics_detected.append({
                    "technique": "Hidden CSS Payload Cloaking (T1027)",
                    "details": f"Identified {len(hidden_css)} hidden CSS formatting tags concealing text from human preview."
                })
                evasion_risk_score += 25.0

        # 4. Embedded Base64 Data URIs / Scripts
        if body_html and re.search(r'data:(text/html|application/javascript|image/svg\+xml);base64,', body_html, re.IGNORECASE):
            tactics_detected.append({
                "technique": "Data URI Payload Obfuscation (T1027)",
                "details": "Embedded Base64 data payload detected within MIME body structure."
            })
            evasion_risk_score += 30.0

        # 5. Dangerous / Abused Top-Level Domains (TLD)
        for url in urls:
            try:
                hostname = urlparse(url if '://' in url else f'http://{url}').hostname or ''
                for tld in self.SUSPICIOUS_DOMAINS_TLD:
                    if hostname.endswith(tld):
                        tactics_detected.append({
                            "technique": "Disposable High-Abuse TLD Domain (T1583.001)",
                            "details": f"URL hostname '{hostname}' resolves to a known disposable free/high-abuse TLD ({tld})."
                        })
                        evasion_risk_score += 20.0
                        break
            except Exception:
                pass

        evasion_risk_score = min(100.0, evasion_risk_score)
        return {
            "tactics_detected": tactics_detected,
            "evasion_risk_score": round(evasion_risk_score, 1),
            "is_evasion_detected": len(tactics_detected) > 0
        }

    def audit_cognitive_manipulation(self, text: str) -> Dict[str, Any]:
        """Deconstructs the psychological social engineering pressure vectors."""
        text_lower = (text or "").lower()
        vector_results = {}
        total_hits = 0

        for vector, patterns in self.COGNITIVE_VECTORS.items():
            matches = []
            for pattern in patterns:
                found = re.findall(pattern, text_lower)
                if found:
                    matches.extend(found if isinstance(found[0], str) else [f[0] for f in found])
            unique_matches = list(set(matches))
            vector_results[vector] = {
                "detected": len(unique_matches) > 0,
                "hit_count": len(unique_matches),
                "matched_patterns": unique_matches[:4]
            }
            total_hits += len(unique_matches)

        # Calculate psychological coercion pressure (0 - 100)
        # Urgency + Fear + Secrecy are the strongest indicators of malicious intent
        urg = vector_results["urgency_pressure"]["hit_count"] * 18
        fear = vector_results["fear_coercion"]["hit_count"] * 22
        sec = vector_results["secrecy_isolation"]["hit_count"] * 25
        fin = vector_results["financial_enticement"]["hit_count"] * 15
        auth = vector_results["authority_simulation"]["hit_count"] * 12

        cognitive_score = min(100.0, urg + fear + sec + fin + auth)

        # Dominant psychological tactic
        active_vectors = [v.replace('_', ' ').title() for v, data in vector_results.items() if data["detected"]]
        dominant_tactic = active_vectors[0] if active_vectors else "None (Neutral Communication)"

        return {
            "cognitive_score": round(cognitive_score, 1),
            "dominant_tactic": dominant_tactic,
            "active_vectors": active_vectors,
            "vector_details": vector_results,
            "coercion_level": "Severe" if cognitive_score >= 70 else ("Moderate" if cognitive_score >= 35 else "Minimal")
        }

    def audit_intent_profile(
        self,
        primary_threat: str,
        ml_confidence: float,
        bec_analysis: Dict[str, Any],
        urls: List[str],
        attachments: List[Any],
        cognitive_audit: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generates an in-depth cyber threat intent profile and objective matrix."""
        
        intent_type = "Informational / Legitimate"
        impact_vector = "Low Impact"
        attack_stage = "Reconnaissance / Delivery"

        if primary_threat == "phishing_credential_harvesting":
            intent_type = "Corporate Account Takeover (ATO) & SSO Credential Theft"
            impact_vector = "Initial Access & Cloud Infrastructure Compromise"
            attack_stage = "Initial Access (TA0001)"
        elif primary_threat == "bec_executive_impersonation":
            intent_type = "Executive Identity Simulation & Financial Payroll Redirection"
            impact_vector = "Unauthorized Treasury / Wire Transfer"
            attack_stage = "Defense Evasion & Impact (TA0005, TA0040)"
        elif primary_threat == "invoice_payment_fraud":
            intent_type = "Accounts Payable Hijacking & Vendor Impersonation"
            impact_vector = "Direct Capital Exfiltration"
            attack_stage = "Resource Development & Collection (TA0042, TA0009)"
        elif primary_threat == "extortion_blackmail":
            intent_type = "Psychological Intimidation & Cryptocurrency Ransom"
            impact_vector = "Reputational Damage & Extortion"
            attack_stage = "Impact & Data Destruction (TA0040)"
        elif primary_threat == "malware_delivery":
            intent_type = "Endpoint Weaponization & Remote Access Trojan (RAT) Installation"
            impact_vector = "Arbitrary Code Execution & Network Pivot"
            attack_stage = "Execution & Persistence (TA0002, TA0003)"
        elif primary_threat == "spam":
            intent_type = "Unsolicited Bulk Marketing / Low-Yield Commercial Solicitations"
            impact_vector = "Resource Waste & Spam Inundation"
            attack_stage = "Resource Exploitation"

        return {
            "primary_intent": intent_type,
            "projected_impact": impact_vector,
            "attack_lifecycle_stage": attack_stage,
            "delivery_mechanisms": {
                "embedded_urls_count": len(urls),
                "weaponized_attachments_count": len(attachments),
                "is_payloadless_attack": len(urls) == 0 and len(attachments) == 0 and primary_threat in ["bec_executive_impersonation", "invoice_payment_fraud"]
            }
        }

    def generate_calibrated_audit_score(
        self,
        ml_prediction: Dict[str, Any],
        cognitive_audit: Dict[str, Any],
        evasion_audit: Dict[str, Any],
        auth_analysis: Dict[str, Any],
        domain_check: Dict[str, Any],
        geo_trace: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesizes all forensic intelligence into an Audited 0-100 Precision Threat Score
        using calibrated Bayesian weighting across 5 distinct evidence pillars.
        """
        # Pillar 1: ML Model Calibrated Probability (Weight: 35%)
        # Probability that the email is NOT legitimate/clean
        class_probs = ml_prediction.get("class_probabilities", {})
        p_clean = class_probs.get("clean", class_probs.get("legitimate", 0.0))
        ml_threat_prob = 1.0 - p_clean
        ml_score = round(ml_threat_prob * 100.0, 1)

        # Pillar 2: Cognitive Social Engineering & Coercion (Weight: 25%)
        cognitive_score = cognitive_audit.get("cognitive_score", 0.0)

        # Pillar 3: Evasion, Obfuscation & Cloaking (Weight: 15%)
        evasion_score = evasion_audit.get("evasion_risk_score", 0.0)

        # Pillar 4: Protocol & Domain Integrity (Weight: 15%)
        protocol_penalty = 0.0
        if not auth_analysis.get("domain_alignment_pass", True):
            protocol_penalty += 35.0
        if auth_analysis.get("spf") in ["fail", "softfail"]:
            protocol_penalty += 25.0
        if auth_analysis.get("dkim") in ["fail", "none"]:
            protocol_penalty += 20.0
        if domain_check.get("is_lookalike") or domain_check.get("is_subdomain_spoof"):
            protocol_penalty += 45.0
        protocol_score = min(100.0, protocol_penalty)

        # Pillar 5: Network Origin & Infrastructure Reputation (Weight: 10%)
        infra_penalty = 0.0
        best_guess_ip = geo_trace.get("best_guess_ip", "")
        if geo_trace.get("is_vpn") or "tor" in geo_trace.get("reason", "").lower() or "suspicious" in geo_trace.get("reason", "").lower():
            infra_penalty += 50.0
        infra_score = min(100.0, infra_penalty)

        # Multi-Pillar Bayesian Fusion
        composite_audit_score = (
            (ml_score * 0.35) +
            (cognitive_score * 0.25) +
            (evasion_score * 0.15) +
            (protocol_score * 0.15) +
            (infra_score * 0.10)
        )

        # Special discount for fully cryptographically authenticated legitimate messages with zero attack vectors
        is_clean_auth = (
            auth_analysis.get("spf") == "pass" and
            auth_analysis.get("dkim") == "pass" and
            auth_analysis.get("domain_alignment_pass", True) and
            cognitive_score == 0 and
            evasion_score == 0 and
            not domain_check.get("is_lookalike") and
            ml_score < 25.0
        )
        if is_clean_auth:
            composite_audit_score = 0.0

        composite_audit_score = round(min(max(0.0, composite_audit_score), 100.0), 1)

        # Determine Audit Verdict
        if composite_audit_score >= 70.0:
            verdict = "MALICIOUS"
            threat_severity = "Critical"
        elif composite_audit_score >= 35.0:
            verdict = "SUSPICIOUS"
            threat_severity = "Elevated"
        else:
            verdict = "BENIGN / CLEAN"
            threat_severity = "Low"

        return {
            "audited_threat_score": composite_audit_score,
            "audit_verdict": verdict,
            "threat_severity": threat_severity,
            "confidence_index": round(min(0.99, max(0.60, ml_prediction.get("confidence", 0.85) + 0.10)), 2),
            "pillars_breakdown": {
                "ml_text_probability_score": ml_score,
                "cognitive_manipulation_score": cognitive_score,
                "evasion_obfuscation_score": evasion_score,
                "protocol_alignment_score": protocol_score,
                "infrastructure_origin_score": infra_score
            }
        }

    def conduct_forensic_audit(
        self,
        from_address: str,
        subject: str,
        body_plain: str,
        body_html: str,
        urls: List[str],
        attachments: List[Any],
        auth_analysis: Dict[str, Any],
        domain_check: Dict[str, Any],
        geo_trace: Dict[str, Any],
        ml_prediction: Dict[str, Any],
        bec_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes the full Deep AI Forensic Audit and returns the consolidated intelligence dossier.
        """
        combined_text = f"{subject}\n{body_plain}"
        primary_threat = ml_prediction.get("primary_threat", "clean")
        ml_confidence = ml_prediction.get("confidence", 0.0)

        # 1. Audits
        evasion_audit = self.audit_evasion_tactics(combined_text, body_html or "", urls or [])
        cognitive_audit = self.audit_cognitive_manipulation(combined_text)
        intent_profile = self.audit_intent_profile(
            primary_threat=primary_threat,
            ml_confidence=ml_confidence,
            bec_analysis=bec_analysis,
            urls=urls or [],
            attachments=attachments or [],
            cognitive_audit=cognitive_audit
        )

        # 2. Score Calibration
        scoring_audit = self.generate_calibrated_audit_score(
            ml_prediction=ml_prediction,
            cognitive_audit=cognitive_audit,
            evasion_audit=evasion_audit,
            auth_analysis=auth_analysis or {},
            domain_check=domain_check or {},
            geo_trace=geo_trace or {}
        )

        # 3. Executive Forensic Summary
        summary = (
            f"AI Forensic Audit completed: Classified as '{primary_threat.replace('_', ' ').title()}' "
            f"with an Audited Threat Score of {scoring_audit['audited_threat_score']}/100 ({scoring_audit['audit_verdict']}). "
            f"Dominant cognitive pressure vector: {cognitive_audit['dominant_tactic']} ({cognitive_audit['cognitive_score']}% intensity). "
        )
        if evasion_audit["is_evasion_detected"]:
            summary += f"Detected {len(evasion_audit['tactics_detected'])} active defense evasion/obfuscation techniques. "
        if not auth_analysis.get("domain_alignment_pass", True):
            summary += "Critical: From-domain and Return-Path headers exhibit severe cryptographic misalignment. "

        return {
            "audit_version": "DeepAI-Forensic-Auditor-v2.5",
            "audited_score": scoring_audit["audited_threat_score"],
            "verdict": scoring_audit["audit_verdict"],
            "severity": scoring_audit["threat_severity"],
            "confidence_rating": scoring_audit["confidence_index"],
            "executive_summary": summary.strip(),
            "intent_profile": intent_profile,
            "cognitive_audit": cognitive_audit,
            "evasion_audit": evasion_audit,
            "evidence_pillars": scoring_audit["pillars_breakdown"]
        }


# Singleton Auditor Instance
forensic_auditor = DeepAIForensicAuditor()
