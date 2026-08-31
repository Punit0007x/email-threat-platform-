import json
from app.scoring.fraud_score import calculate_fraud_score

with open('result.json', 'r') as f:
    data = json.load(f)

score = calculate_fraud_score(
    auth_analysis=data.get('auth_analysis', {}),
    text_signals=data.get('text_signals', {}),
    domain_check=data.get('domain_check', {}),
    trace_results=data.get('trace', {}),
    ai_ml_analysis=data.get('ai_ml_analysis', {}),
    threat_correlations=data.get('threat_correlations', {}),
    tech_fingerprint=data.get('tech_fingerprint', {})
)

print(json.dumps(score, indent=2))
