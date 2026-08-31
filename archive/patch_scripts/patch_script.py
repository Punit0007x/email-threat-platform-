import re

with open("app/parsers/case_db.py", "r") as f:
    content = f.read()

# Add imports at the top
import_block = """import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

import networkx as nx
from app.forensics.attribution_graph import (
    Incident, add_incident, build_attribution_graph, cluster_campaigns,
    find_related_incidents, campaign_confidence, shared_infrastructure
)

GLOBAL_GRAPH = build_attribution_graph()
GRAPH_SYNCED = False

def sync_graph_from_db():
    global GRAPH_SYNCED
    if GRAPH_SYNCED:
        return
    if not os.path.exists(DB_PATH):
        return
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT case_id, from_address, sender_domain, origin_ip, subject, fraud_score FROM incident_cases")
        rows = cursor.fetchall()
        for row in rows:
            inc = Incident(
                incident_id=row[0],
                from_address=row[1],
                from_domain=row[2],
                originating_ip=row[3],
                subject=row[4],
                fraud_score=row[5] or 0.0
            )
            add_incident(GLOBAL_GRAPH, inc)
        conn.close()
        GRAPH_SYNCED = True
    except Exception as e:
        print("Error syncing graph:", e)
"""

content = re.sub(
    r'import sqlite3\nimport json\nimport os\nfrom typing import List, Dict, Any, Optional',
    import_block,
    content,
    count=1
)

# Replace _check_historical_correlations
new_check = """def _check_historical_correlations(domain: str, origin_ip: str, from_addr: str) -> Dict[str, Any]:
    \"\"\"Check if indicators have been seen in previous cases using Graph Network.\"\"\"
    init_case_database()
    sync_graph_from_db()
    
    # Create a temporary incident to see what it connects to
    temp_id = "TEMP_INCIDENT"
    inc = Incident(
        incident_id=temp_id,
        from_address=from_addr,
        from_domain=domain,
        originating_ip=origin_ip,
        fraud_score=0.0
    )
    add_incident(GLOBAL_GRAPH, inc)
    
    related = find_related_incidents(GLOBAL_GRAPH, temp_id)
    
    # Analyze the shared infrastructure to recreate the return dict
    domain_case_count = 0
    ip_case_count = 0
    sender_case_count = 0
    
    for r_id in related:
        shared = shared_infrastructure(GLOBAL_GRAPH, temp_id, r_id)
        for kind, val in shared:
            if kind == "domain": domain_case_count += 1
            elif kind == "ip": ip_case_count += 1
            elif kind == "incident": sender_case_count += 1 # Rough proxy
            
    # Calculate confidence based on sum of edge weights to all related incidents
    total_conf = sum(campaign_confidence(GLOBAL_GRAPH, temp_id, r_id) for r_id in related)
    
    # Remove temp incident safely
    try:
        GLOBAL_GRAPH.remove_node(f"incident:{temp_id}")
    except:
        pass
    
    # Map to legacy format
    correlations = {
        "domain_seen_before": domain_case_count > 0,
        "domain_case_count": domain_case_count,
        "ip_seen_before": ip_case_count > 0,
        "ip_case_count": ip_case_count,
        "sender_seen_before": sender_case_count > 0,
        "sender_case_count": sender_case_count,
        "linked_campaigns": list(related)[:5], # Return first 5 related incidents as campaigns
        "repeat_offender_score": min(total_conf * 100, 45) # Max 45 points from correlations
    }
    return correlations"""

content = re.sub(
    r'def _check_historical_correlations.*?return correlations',
    new_check,
    content,
    flags=re.DOTALL
)

# Replace determine_campaign_cluster
new_cluster = """def determine_campaign_cluster(sender_domain: str, origin_ip: str, primary_threat: str, case_id: str = None) -> str:
    \"\"\"Dynamically cluster related email attacks into persistent threat campaigns via networkx.\"\"\"
    sync_graph_from_db()
    
    if case_id:
        # Check if this case is part of any known campaign cluster
        campaigns = cluster_campaigns(GLOBAL_GRAPH, min_incidents=2)
        for i, campaign in enumerate(campaigns, 1):
            if case_id in campaign:
                return f"CAMP-GRAPH-CLUSTER-{i:03d}"
                
    # Fallback to general categorization if isolated
    if "paypal" in (sender_domain or "") or "paypa1" in (sender_domain or ""):
        return "CAMP-FINANCIAL-SPOOF-PAYPAL"
    elif "apple" in (sender_domain or "") or "exec" in (sender_domain or "") or primary_threat == "bec_executive_impersonation":
        return "CAMP-VIP-EXECUTIVE-IMPERSONATION"
    elif primary_threat == "invoice_payment_fraud":
        return "CAMP-PAYMENT-WIRE-DIVERSION"
    elif primary_threat == "extortion_blackmail":
        return "CAMP-EXTORTION-RANSOM-WAVE"
    elif sender_domain and sender_domain != "unknown":
        clean_d = sender_domain.replace(".", "-").upper()
        return f"CAMP-DOM-{clean_d}"
    elif origin_ip:
        return f"CAMP-IP-{origin_ip.replace('.', '-')}"
    else:
        return "CAMP-GENERAL-PHISHING" """

content = re.sub(
    r'def determine_campaign_cluster\(sender_domain: str, origin_ip: str, primary_threat: str\) -> str:.*?return "CAMP-GENERAL-PHISHING"',
    new_cluster,
    content,
    flags=re.DOTALL
)

with open("app/parsers/case_db.py", "w") as f:
    f.write(content)

print("Patch applied")
