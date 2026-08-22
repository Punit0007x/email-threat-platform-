import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_PATH = "data/cases.db"

def _check_historical_correlations(domain: str, origin_ip: str, from_addr: str) -> Dict[str, Any]:
    """Check if indicators have been seen in previous cases."""
    correlations = {
        "domain_seen_before": False,
        "domain_case_count": 0,
        "ip_seen_before": False,
        "ip_case_count": 0,
        "sender_seen_before": False,
        "sender_case_count": 0,
        "linked_campaigns": [],
        "repeat_offender_score": 0
    }
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check domain history
    if domain:
        cursor.execute("""
            SELECT COUNT(*) as cnt, GROUP_CONCAT(DISTINCT campaign_id) as camps
            FROM incident_cases WHERE sender_domain = ?
        """, (domain,))
        row = cursor.fetchone()
        if row and row[0] > 0:
            correlations["domain_seen_before"] = True
            correlations["domain_case_count"] = row[0]
            if row[1]:
                correlations["linked_campaigns"].extend([c.strip() for c in row[1].split(",")])
    
    # Check IP history
    if origin_ip:
        cursor.execute("""
            SELECT COUNT(*) as cnt, GROUP_CONCAT(DISTINCT campaign_id) as camps
            FROM incident_cases WHERE origin_ip = ?
        """, (origin_ip,))
        row = cursor.fetchone()
        if row and row[0] > 0:
            correlations["ip_seen_before"] = True
            correlations["ip_case_count"] = row[0]
            if row[1]:
                correlations["linked_campaigns"].extend([c.strip() for c in row[1].split(",")])
    
    # Check sender address history
    if from_addr:
        cursor.execute("""
            SELECT COUNT(*) as cnt, GROUP_CONCAT(DISTINCT campaign_id) as camps
            FROM incident_cases WHERE from_address = ?
        """, (from_addr,))
        row = cursor.fetchone()
        if row and row[0] > 0:
            correlations["sender_seen_before"] = True
            correlations["sender_case_count"] = row[0]
            if row[1]:
                correlations["linked_campaigns"].extend([c.strip() for c in row[1].split(",")])
    
    # Deduplicate campaigns
    correlations["linked_campaigns"] = list(set(correlations["linked_campaigns"]))
    
    # Calculate repeat offender score
    if correlations["domain_seen_before"]:
        correlations["repeat_offender_score"] += min(correlations["domain_case_count"] * 5, 25)
    if correlations["ip_seen_before"]:
        correlations["repeat_offender_score"] += min(correlations["ip_case_count"] * 5, 25)
    if correlations["sender_seen_before"]:
        correlations["repeat_offender_score"] += min(correlations["sender_case_count"] * 10, 30)
    
    conn.close()
    return correlations

def init_case_database():
    """Initializes SQLite database and tables for case management & campaign tracking."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS incident_cases (
            case_id TEXT PRIMARY KEY,
            evidence_id TEXT,
            timestamp_utc TEXT,
            from_address TEXT,
            sender_domain TEXT,
            subject TEXT,
            origin_ip TEXT,
            fraud_score INTEGER,
            risk_level TEXT,
            primary_threat TEXT,
            campaign_id TEXT,
            payload_json TEXT
        )
    """)
    conn.commit()
    conn.close()

def determine_campaign_cluster(sender_domain: str, origin_ip: str, primary_threat: str) -> str:
    """Clustering heuristic to group related email attacks into persistent threat campaigns."""
    if not sender_domain:
        sender_domain = "unknown"
    if "paypal" in sender_domain or "paypa1" in sender_domain:
        return "CAMP-FINANCIAL-SPOOF-PAYPAL"
    elif "apple" in sender_domain or "exec" in sender_domain or primary_threat == "bec_executive_impersonation":
        return "CAMP-VIP-EXECUTIVE-IMPERSONATION"
    elif primary_threat == "invoice_payment_fraud":
        return "CAMP-PAYMENT-WIRE-DIVERSION"
    elif primary_threat == "extortion_blackmail":
        return "CAMP-EXTORTION-RANSOM-WAVE"
    elif sender_domain != "unknown":
        clean_d = sender_domain.replace(".", "-").upper()
        return f"CAMP-DOM-{clean_d}"
    elif origin_ip:
        return f"CAMP-IP-{origin_ip.replace('.', '-')}"
    else:
        return "CAMP-GENERAL-PHISHING"

def save_incident_case(data: Dict[str, Any]) -> str:
    """Saves analyzed email into the persistent case management database and assigns a campaign cluster."""
    init_case_database()
    custody = data.get("custody", {})
    case_id = custody.get("evidence_id") or f"CASE-{os.urandom(4).hex().upper()}"
    evidence_id = custody.get("evidence_id", "")
    timestamp_utc = custody.get("ingestion_timestamp_utc", "")
    
    from_addr = data.get("from_address", "")
    domain = from_addr.split("@")[-1].strip(">").strip().lower() if "@" in from_addr else ""
    subject = data.get("subject", "")
    origin_ip = data.get("trace", {}).get("best_guess_ip", "")
    
    fraud = data.get("fraud_assessment", {})
    score = fraud.get("score", 0)
    risk = fraud.get("risk_level", "Low")
    
    primary_threat = data.get("ai_ml_analysis", {}).get("classification", {}).get("primary_threat", "clean")
    campaign_id = determine_campaign_cluster(domain, origin_ip, primary_threat)
    
    # Cross-case threat intelligence correlation
    correlations = _check_historical_correlations(domain, origin_ip, from_addr)
    data["threat_correlations"] = correlations
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO incident_cases (
            case_id, evidence_id, timestamp_utc, from_address, sender_domain,
            subject, origin_ip, fraud_score, risk_level, primary_threat,
            campaign_id, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        case_id, evidence_id, timestamp_utc, from_addr, domain,
        subject, origin_ip, score, risk, primary_threat,
        campaign_id, json.dumps(data)
    ))
    conn.commit()
    conn.close()
    return campaign_id

def get_all_cases(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves recent forensic incident cases."""
    init_case_database()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT case_id, evidence_id, timestamp_utc, from_address, sender_domain,
               subject, origin_ip, fraud_score, risk_level, primary_threat, campaign_id
        FROM incident_cases
        ORDER BY timestamp_utc DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_campaign_clusters() -> List[Dict[str, Any]]:
    """Aggregates cases grouped by campaign cluster."""
    init_case_database()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT campaign_id, COUNT(*) as case_count, AVG(fraud_score) as avg_score,
               MAX(timestamp_utc) as last_seen,
               GROUP_CONCAT(DISTINCT primary_threat) as threats,
               GROUP_CONCAT(DISTINCT sender_domain) as domains
        FROM incident_cases
        GROUP BY campaign_id
        ORDER BY case_count DESC, last_seen DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "campaign_id": r["campaign_id"],
            "case_count": r["case_count"],
            "avg_score": round(r["avg_score"] or 0, 1),
            "last_seen": r["last_seen"],
            "threats": [t.strip() for t in (r["threats"] or "").split(",") if t.strip()],
            "domains": [d.strip() for d in (r["domains"] or "").split(",") if d.strip()]
        })
    return results
