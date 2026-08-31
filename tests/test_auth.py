import os
import json

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
target_path = os.path.join(base_dir, 'result.json')

if os.path.exists(target_path):
    with open(target_path, 'r') as f:
        data = json.load(f)
        print("from_domain inside result.json:", data.get('auth_analysis', {}).get('from_domain'))
else:
    print(f"Notice: {target_path} not found. Skipping auth file inspection.")


