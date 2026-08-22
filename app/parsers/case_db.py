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


# === ALERTING SYSTEM ===
ALERT_DB_PATH = "data/alerts.db"

def init_alert_database():
    """Initializes SQLite database for alert management."""
    os.makedirs(os.path.dirname(ALERT_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(ALERT_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            alert_id TEXT PRIMARY KEY,
            case_id TEXT,
            evidence_id TEXT,
            timestamp_utc TEXT,
            fraud_score INTEGER,
            risk_level TEXT,
            primary_threat TEXT,
            sender_domain TEXT,
            origin_ip TEXT,
            alert_reason TEXT,
            webhook_sent INTEGER DEFAULT 0,
            webhook_response TEXT,
            payload_json TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS webhook_config (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            webhook_url TEXT,
            min_score_threshold INTEGER DEFAULT 70,
            enabled INTEGER DEFAULT 0,
            updated_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def set_webhook_config(webhook_url: str, min_score_threshold: int = 70, enabled: bool = True) -> bool:
    """Configure webhook for high-risk alerts."""
    init_alert_database()
    conn = sqlite3.connect(ALERT_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO webhook_config (id, webhook_url, min_score_threshold, enabled, updated_at)
        VALUES (1, ?, ?, ?, datetime('now'))
    """, (webhook_url, min_score_threshold, 1 if enabled else 0))
    conn.commit()
    conn.close()
    return True

def get_webhook_config() -> Dict[str, Any]:
    """Get current webhook configuration."""
    init_alert_database()
    conn = sqlite3.connect(ALERT_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM webhook_config WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {"webhook_url": "", "min_score_threshold": 70, "enabled": 0}

def create_alert(case_data: Dict[str, Any], fraud_assessment: Dict[str, Any]) -> Optional[str]:
    """Create an alert for high-risk cases and optionally send webhook."""
    init_alert_database()
    
    score = fraud_assessment.get("score", 0)
    risk_level = fraud_assessment.get("risk_level", "Low")
    
    # Only alert on Medium/High risk (configurable threshold)
    webhook_config = get_webhook_config()
    threshold = webhook_config.get("min_score_threshold", 70)
    
    if score < threshold:
        return None
    
    custody = case_data.get("custody", {})
    alert_id = f"ALT-{os.urandom(4).hex().upper()}"
    case_id = custody.get("evidence_id") or f"CASE-{os.urandom(4).hex().upper()}"
    evidence_id = custody.get("evidence_id", "")
    timestamp_utc = custody.get("ingestion_timestamp_utc", "")
    
    from_addr = case_data.get("from_address", "")
    domain = from_addr.split("@")[-1].strip(">").strip().lower() if "@" in from_addr else ""
    origin_ip = case_data.get("trace", {}).get("best_guess_ip", "")
    primary_threat = case_data.get("ai_ml_analysis", {}).get("classification", {}).get("primary_threat", "clean")
    
    alert_reason = f"High-risk email detected (Score: {score}, Risk: {risk_level}, Threat: {primary_threat})"
    
    conn = sqlite3.connect(ALERT_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO alerts (
            alert_id, case_id, evidence_id, timestamp_utc, fraud_score,
            risk_level, primary_threat, sender_domain, origin_ip,
            alert_reason, webhook_sent, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        alert_id, case_id, evidence_id, timestamp_utc, score,
        risk_level, primary_threat, domain, origin_ip,
        alert_reason, 0, json.dumps(case_data)
    ))
    conn.commit()
    conn.close()
    
    # Send webhook if configured and enabled
    if webhook_config.get("enabled") and webhook_config.get("webhook_url"):
        send_webhook_alert(webhook_config["webhook_url"], alert_id, case_data, fraud_assessment)
    
    return alert_id

def send_webhook_alert(webhook_url: str, alert_id: str, case_data: Dict[str, Any], fraud_assessment: Dict[str, Any]) -> bool:
    """Send alert to configured webhook URL."""
    try:
        import requests
        payload = {
            "alert_id": alert_id,
            "timestamp": case_data.get("custody", {}).get("ingestion_timestamp_utc"),
            "fraud_score": fraud_assessment.get("score"),
            "risk_level": fraud_assessment.get("risk_level"),
            "primary_threat": case_data.get("ai_ml_analysis", {}).get("classification", {}).get("primary_threat"),
            "sender": case_data.get("from_address"),
            "sender_domain": case_data.get("from_address", "").split("@")[-1].strip(">").strip().lower() if "@" in case_data.get("from_address", "") else "",
            "origin_ip": case_data.get("trace", {}).get("best_guess_ip"),
            "reasons": fraud_assessment.get("reasons", [])
        }
        response = requests.post(webhook_url, json=payload, timeout=5)
        
        # Update alert with webhook result
        conn = sqlite3.connect(ALERT_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE alerts SET webhook_sent = 1, webhook_response = ? WHERE alert_id = ?
        """, (f"{response.status_code}: {response.text[:200]}", alert_id))
        conn.commit()
        conn.close()
        return response.status_code < 400
    except Exception as e:
        conn = sqlite3.connect(ALERT_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE alerts SET webhook_sent = 1, webhook_response = ? WHERE alert_id = ?
        """, (f"ERROR: {str(e)[:200]}", alert_id))
        conn.commit()
        conn.close()
        return False

def get_recent_alerts(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve recent alerts."""
    init_alert_database()
    conn = sqlite3.connect(ALERT_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT alert_id, case_id, evidence_id, timestamp_utc, fraud_score,
               risk_level, primary_threat, sender_domain, origin_ip,
               alert_reason, webhook_sent, webhook_response
        FROM alerts
        ORDER BY timestamp_utc DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_alert_stats() -> Dict[str, Any]:
    """Get alert statistics."""
    init_alert_database()
    conn = sqlite3.connect(ALERT_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM alerts")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE fraud_score >= 70")
    high_risk = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE webhook_sent = 1")
    webhook_sent = cursor.fetchone()[0]
    conn.close()
    return {"total_alerts": total, "high_risk_alerts": high_risk, "webhook_delivered": webhook_sent}
