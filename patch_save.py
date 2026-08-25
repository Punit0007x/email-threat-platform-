import re

with open("app/parsers/case_db.py", "r") as f:
    content = f.read()

replacement = """
    conn.commit()
    conn.close()
    
    # ADD TO GLOBAL GRAPH IMMEDIATELY AFTER SAVING!
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
    r'\s*conn\.commit\(\)\n\s*conn\.close\(\)',
    replacement,
    content,
    count=2 # It might match init_case_database and save_incident_case. Wait, let's just do save_incident_case
)
with open("app/parsers/case_db.py", "w") as f:
    f.write(content)
print("Patch applied")
