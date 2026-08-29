"""
analyze.py
-----------
End-to-end pipeline orchestrator. This is the single place that wires
together every fixed component. Notably absent, on purpose, versus the
audited version:
  - No hardcoded geolocation spoof (origin_trace.py has none to call).
  - No post-hoc logit bonuses (threat_classifier.py output is used as-is).
  - No second, disconnected spam model (retired).
"""
import uuid

from app.parsers.email_parser import parse_eml, sender_domain
from app.parsers.auth_analysis import parse_authentication_results, check_from_reply_to_mismatch
from app.parsers.origin_trace import trace_hops, likely_originating_ip
from app.parsers.url_analyzer import analyze_urls_in_email
from app.ml.threat_classifier import classify
from app.scoring.fraud_score import compute_score
from app.scoring.domain_check import check_lookalike_domain
from app.forensics.ledger import append_event


def analyze_email(raw_bytes: bytes, case_id: str = None) -> dict:
    case_id = case_id or str(uuid.uuid4())
    parsed = parse_eml(raw_bytes)

    domain = sender_domain(parsed["headers"])
    auth_result = parse_authentication_results(parsed["headers"])
    reply_to_result = check_from_reply_to_mismatch(parsed["headers"])
    hops = trace_hops(parsed["received_headers"])
    origin_ip = likely_originating_ip(hops)
    url_result = analyze_urls_in_email(parsed["text_body"], parsed["html_body"])
    domain_result = check_lookalike_domain(domain)

    combined_text = f"{parsed['subject']}\n{parsed['text_body']}"
    ml_result = classify(combined_text)

    score_result = compute_score(ml_result, auth_result, url_result, domain_result, reply_to_result)

    report = {
        "case_id": case_id,
        "sender": parsed["from"],
        "sender_domain": domain,
        "subject": parsed["subject"],
        "attachments": parsed["attachments"],
        "authentication": auth_result,
        "reply_to_check": reply_to_result,
        "origin_hops": hops,
        "likely_originating_ip": origin_ip,
        "url_analysis": url_result,
        "domain_check": domain_result,
        "ml_classification": ml_result,
        "risk_assessment": score_result,
    }

    append_event(case_id, "email_analyzed", report)
    return report


if __name__ == "__main__":
    import sys, json
    if len(sys.argv) < 2:
        print("Usage: python analyze.py <path_to_eml_file>")
        sys.exit(1)
    with open(sys.argv[1], "rb") as f:
        raw = f.read()
    result = analyze_email(raw)
    print(json.dumps(result, indent=2, default=str))
