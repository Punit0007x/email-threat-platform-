import requests
import json
import time

def test_full_integration():
    url = "http://localhost:8003/api/parse"
    
    # We can test parsing directly via FastAPI TestClient
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    
    # 1. Health check
    h = client.get("/health")
    print(f"Health Check: {h.status_code} - {h.json()}")
    assert h.status_code == 200
    
    # 2. Parse sample email
    with open("test_emails/bec_ceo_fraud.eml", "rb") as f:
        resp = client.post("/api/parse", files={"file": ("bec_ceo_fraud.eml", f, "message/rfc822")})
        
    print(f"Parse Response Code: {resp.status_code}")
    assert resp.status_code == 200
    data = resp.json()
    
    print("\n--- CHAIN OF CUSTODY ---")
    print(f"Evidence ID: {data.get('custody', {}).get('evidence_id')}")
    print(f"SHA-256: {data.get('custody', {}).get('sha256')}")
    print(f"Seal: {data.get('custody', {}).get('custody_seal')}")
    
    print("\n--- DNS & INFRASTRUCTURE INTEL ---")
    print(f"DNS Resolvable: {data.get('dns_intel', {}).get('is_resolvable')}")
    print(f"MX Records: {data.get('dns_intel', {}).get('mx_records')}")
    print(f"Infra Tier: {data.get('infra_intel', {}).get('infra_type')}")
    
    print("\n--- AI/ML & MITRE ---")
    print(f"Primary Threat: {data.get('ai_ml_analysis', {}).get('classification', {}).get('primary_threat')}")
    print(f"Campaign ID: {data.get('campaign_id')}")
    
    print("\n--- ATTRIBUTION GRAPH ---")
    print(f"Nodes: {data.get('attribution_graph', {}).get('total_nodes')}")
    print(f"Links: {data.get('attribution_graph', {}).get('total_links')}")
    
    # 3. Check Case Management & Campaigns Endpoints
    cases = client.get("/api/cases").json()
    print(f"\n--- CASE DATABASE ---")
    print(f"Total Logged Cases: {len(cases)}")
    
    campaigns = client.get("/api/campaigns").json()
    print(f"Campaign Clusters: {[c['campaign_id'] for c in campaigns]}")
    
    # 4. Report Generation Endpoint
    report = client.post("/api/report/html", json=data)
    print(f"\n--- FORENSIC REPORT HTML ---")
    print(f"Report Status: {report.status_code}, Length: {len(report.text)} chars")
    assert report.status_code == 200
    assert "EMAIL FORENSIC INVESTIGATION REPORT" in report.text
    
    print("\n>>> ALL PLATFORM TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_full_integration()
