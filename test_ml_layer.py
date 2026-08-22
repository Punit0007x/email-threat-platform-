import json
from app.parsers.email_parser import parse_eml_file
from app.parsers.auth_analysis import analyze_auth
from app.parsers.origin_trace import trace_origin
from app.scoring.domain_check import check_domain_lookalike
from app.ml.pipeline import analyze_email_ai_ml
from app.scoring.fraud_score import calculate_fraud_score

def test_file(filepath):
    print(f"\n{'='*70}\nTESTING EMAIL: {filepath}\n{'='*70}")
    parsed = parse_eml_file(filepath)
    auth = analyze_auth(parsed.authentication_results, parsed.from_address, parsed.return_path)
    trace = trace_origin(parsed.received_chain)
    domain_part = parsed.from_address.split('@')[-1].strip('>') if '@' in parsed.from_address else ""
    domain = check_domain_lookalike(domain_part)
    
    ml_analysis = analyze_email_ai_ml(
        from_address=parsed.from_address,
        reply_to=parsed.reply_to,
        subject=parsed.subject,
        body_plain=parsed.body_plain,
        body_html=parsed.body_html,
        attachments=parsed.attachments,
        urls=parsed.urls,
        domain_check=domain,
        auth_analysis=auth
    )
    
    fraud = calculate_fraud_score(
        auth_analysis=auth,
        text_signals={},
        domain_check=domain,
        trace_results=trace,
        ai_ml_analysis=ml_analysis
    )
    
    print(f"Overall Fraud Score: {fraud['score']}/100 ({fraud['risk_level']} Risk)")
    print(f"Primary Threat: {ml_analysis['classification']['primary_threat']} (Confidence: {round(ml_analysis['classification']['confidence']*100)}%)")
    print(f"Probabilities: {ml_analysis['classification']['probabilities']}")
    print(f"BEC Score: {ml_analysis['bec_analysis']['bec_confidence_score']}% ({ml_analysis['bec_analysis']['bec_risk_level']})")
    print(f"Synthetic Score: {ml_analysis['synthetic_analysis']['synthetic_score']}%")
    print("\nMITRE ATT&CK TTPs:")
    for t in ml_analysis['ai_forensics']['mitre_attack_ttps']:
        print(f"  - [{t['id']}] {t['name']} ({t['tactic']})")
    print("\nRecommended SOC Actions:")
    for a in ml_analysis['ai_forensics']['recommended_soc_actions']:
        print(f"  * {a}")

if __name__ == "__main__":
    for path in ["test_emails/clean.eml", "test_emails/sample.eml", "test_emails/multi_hop.eml"]:
        test_file(path)
