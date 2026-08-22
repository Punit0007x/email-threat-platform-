import networkx as nx
from typing import List, Dict, Any, Set
import sqlite3

DB_PATH = "data/cases.db"

def build_attribution_graph() -> nx.Graph:
    """
    Builds a graph from all historical incident cases.
    Nodes: Emails (case_id), Domains, IPs.
    Edges: Connect Email to its Domain, Email to its IP.
    """
    G = nx.Graph()
    
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='incident_cases'")
        if not cursor.fetchone():
            conn.close()
            return G
            
        cursor.execute("SELECT case_id, sender_domain, origin_ip, primary_threat FROM incident_cases")
        rows = cursor.fetchall()
        conn.close()
    except sqlite3.Error:
        return G

    for row in rows:
        case_id = row["case_id"]
        domain = row["sender_domain"]
        ip = row["origin_ip"]
        
        # Add the email case as a central node
        G.add_node(case_id, type="case", threat=row["primary_threat"])
        
        # Connect domain infrastructure
        if domain and domain != "unknown":
            domain_node = f"DOMAIN:{domain}"
            G.add_node(domain_node, type="domain")
            G.add_edge(case_id, domain_node)
            
        # Connect IP infrastructure
        if ip:
            ip_node = f"IP:{ip}"
            G.add_node(ip_node, type="ip")
            G.add_edge(case_id, ip_node)
            
    return G

def discover_campaigns() -> List[Dict[str, Any]]:
    """
    Discovers campaigns by finding connected components in the infrastructure graph
    that contain more than one email case.
    """
    G = build_attribution_graph()
    campaigns = []
    
    # Each connected component represents shared infrastructure
    for i, component in enumerate(nx.connected_components(G)):
        cases = [n for n in component if G.nodes[n].get("type") == "case"]
        
        # If multiple emails share the same IP/Domain, it's a campaign
        if len(cases) > 1:
            domains = [n.replace("DOMAIN:", "") for n in component if G.nodes[n].get("type") == "domain"]
            ips = [n.replace("IP:", "") for n in component if G.nodes[n].get("type") == "ip"]
            threats = list(set([G.nodes[c].get("threat") for c in cases if G.nodes[c].get("threat")]))
            
            campaigns.append({
                "campaign_id": f"GRAPH-CAMP-{i+1}",
                "case_count": len(cases),
                "cases": cases,
                "shared_domains": domains,
                "shared_ips": ips,
                "threat_types": threats
            })
            
    # Sort campaigns by size (largest first)
    campaigns.sort(key=lambda x: x["case_count"], reverse=True)
    return campaigns

def assign_campaign_dynamically(case_id: str, sender_domain: str, origin_ip: str) -> str:
    """
    Determines if a new case links to an existing campaign graph.
    Returns the campaign ID if found, otherwise falls back to a standalone ID.
    """
    # Simple check against current graph (for demo purposes)
    G = build_attribution_graph()
    
    # If graph is empty, fallback immediately
    if len(G.nodes) == 0:
         return None

    # Check if this case shares infrastructure with an existing component
    domain_node = f"DOMAIN:{sender_domain}" if sender_domain and sender_domain != "unknown" else None
    ip_node = f"IP:{origin_ip}" if origin_ip else None
    
    for i, component in enumerate(nx.connected_components(G)):
        if (domain_node and domain_node in component) or (ip_node and ip_node in component):
            return f"GRAPH-CAMP-{i+1}"
            
    return None
