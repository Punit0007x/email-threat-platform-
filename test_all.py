import requests
import json
import os

def test_api():
    files_to_test = ["clean.eml", "sample.eml", "multi_hop.eml"]
    
    port = os.environ.get("PORT", "8000")
    for filename in files_to_test:
        path = f"test_emails/{filename}"
        print(f"\n{'='*50}\nTesting: {filename}\n{'='*50}")
        
        with open(path, 'rb') as f:
            resp = requests.post(f"http://localhost:{port}/api/parse", files={"file": f})
            
        if resp.status_code == 200:
            data = resp.json()
            assessment = data.get("fraud_assessment", {})
            print(f"SCORE: {assessment.get('score')} / 100")
            print(f"RISK LEVEL: {assessment.get('risk_level')}")
            print("REASONS:")
            for r in assessment.get('reasons', []):
                print(f"  - {r}")
        else:
            print(f"Error: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    test_api()
