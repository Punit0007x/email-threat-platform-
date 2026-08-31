import sqlite3
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

DB_PATH = "data/cases.db"

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

def _check_historical_correlations(domain: str, origin_ip: str, from_addr: str) -> Dict[str, Any]:
    """Check if indicators have been seen in previous cases using Graph Network."""
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
    
    # Remove temp incident
    GLOBAL_GRAPH.remove_node(f"incident:{temp_id}")
    
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
    return correlations

