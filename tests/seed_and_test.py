import json
from app.parsers.case_db import init_case_database, save_incident_case
from app.parsers.attribution import discover_campaigns, build_attribution_graph
import os

def run_seed_and_test():
    # Clean start if possible
    if os.path.exists("data/cases.db"):
        try:
            os.remove("data/cases.db")
        except PermissionError:
            pass
    init_case_database()

    # Mock Email 1 (Phishing via attacker VPS)
    email1 = {
        "custody": {"evidence_id": "CASE-001", "ingestion_timestamp_utc": "2026-08-22T10:00:00Z"},
        "from_address": "Security <admin@paypal-update.com>",
        "subject": "Urgent: Account locked",
        "trace": {"best_guess_ip": "198.51.100.22"},
        "fraud_assessment": {"score": 85, "risk_level": "High"},
        "ai_ml_analysis": {"classification": {"primary_threat": "credential_phishing"}}
    }

    # Mock Email 2 (Completely different sender domain, but SAME attacker IP)
    email2 = {
        "custody": {"evidence_id": "CASE-002", "ingestion_timestamp_utc": "2026-08-22T11:00:00Z"},
        "from_address": "IT Support <support@apple-verify.com>",
        "subject": "Apple ID suspended",
        "trace": {"best_guess_ip": "198.51.100.22"}, # Same IP!
        "fraud_assessment": {"score": 90, "risk_level": "High"},
        "ai_ml_analysis": {"classification": {"primary_threat": "credential_phishing"}}
    }

    # Mock Email 3 (Unrelated spam)
    email3 = {
        "custody": {"evidence_id": "CASE-003", "ingestion_timestamp_utc": "2026-08-22T12:00:00Z"},
        "from_address": "Marketing <deals@cheap-shoes.xyz>",
        "subject": "Buy 1 Get 1 Free",
        "trace": {"best_guess_ip": "203.0.113.5"},
        "fraud_assessment": {"score": 40, "risk_level": "Medium"},
        "ai_ml_analysis": {"classification": {"primary_threat": "spam"}}
    }

    print("1. Seeding Database...")
    camp1 = save_incident_case(email1)
    camp2 = save_incident_case(email2)
    camp3 = save_incident_case(email3)
    print(f"Assigned Campaigns upon saving:\n CASE-001 -> {camp1}\n CASE-002 -> {camp2}\n CASE-003 -> {camp3}\n")

    print("2. Running Graph Attribution...")
    campaigns = discover_campaigns()

    print(json.dumps(campaigns, indent=2))

if __name__ == "__main__":
    run_seed_and_test()

