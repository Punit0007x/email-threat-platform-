import re

with open("app/parsers/case_db.py", "r") as f:
    content = f.read()

# Remove the ADD TO GLOBAL GRAPH block at the bottom
content = re.sub(
    r'\n    # ADD TO GLOBAL GRAPH IMMEDIATELY AFTER SAVING!.*?\n    add_incident\(GLOBAL_GRAPH, inc\)\n',
    '',
    content,
    flags=re.DOTALL
)

# Insert it BEFORE determining campaign
replacement = """    primary_threat = data.get("ai_ml_analysis", {}).get("classification", {}).get("primary_threat", "clean")
    
    # ADD TO GLOBAL GRAPH BEFORE CALCULATING CAMPAIGN
    inc = Incident(
        incident_id=case_id,
        from_address=from_addr,
        from_domain=domain,
        originating_ip=origin_ip,
        subject=data.get("subject", ""),
        fraud_score=score
    )
    add_incident(GLOBAL_GRAPH, inc)
"""

content = re.sub(
    r'    primary_threat = data\.get\("ai_ml_analysis", \{\}\)\.get\("classification", \{\}\)\.get\("primary_threat", "clean"\)',
    replacement,
    content
)

with open("app/parsers/case_db.py", "w") as f:
    f.write(content)
print("Patch applied")
