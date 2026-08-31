import json
with open('result.json', 'r') as f:
    data = json.load(f)
    print("from_domain inside result.json:", data.get('auth_analysis', {}).get('from_domain'))

