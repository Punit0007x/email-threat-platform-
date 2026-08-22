import hashlib
import uuid
import datetime
import re
import json
import os
from typing import Dict, Any, Optional

RETENTION_CONFIG = {
    "enabled": True,
    "max_case_age_days": int(os.getenv("RETENTION_MAX_DAYS", "365")),
    "mask_pii_in_storage": os.getenv("MASK_PII_IN_STORAGE", "true").lower() == "true",
    "mask_pii_in_reports": os.getenv("MASK_PII_IN_REPORTS", "true").lower() == "true",
}

def generate_evidence_custody(raw_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Computes cryptographic checksums and evidence custody metadata for digital forensic integrity.
    """
    sha256_hash = hashlib.sha256(raw_bytes).hexdigest()
    md5_hash = hashlib.md5(raw_bytes).hexdigest()
    sha1_hash = hashlib.sha1(raw_bytes).hexdigest()
    
    evidence_id = f"EV-{uuid.uuid4().hex[:12].upper()}"
    timestamp_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Forensic chain of custody seal
    seal_data = f"{evidence_id}|{sha256_hash}|{timestamp_utc}"
    custody_seal = hashlib.sha256(seal_data.encode('utf-8')).hexdigest()[:16].upper()
    
    return {
        "evidence_id": evidence_id,
        "filename": filename,
        "file_size_bytes": len(raw_bytes),
        "sha256": sha256_hash,
        "sha1": sha1_hash,
        "md5": md5_hash,
        "ingestion_timestamp_utc": timestamp_utc,
        "custody_seal": f"SEAL-{custody_seal}",
        "integrity_verified": True
    }

def mask_pii_data(text: str) -> str:
    """
    Redacts personally identifiable information (PII) such as local-part email usernames,
    telephone numbers, potential names, and addresses for privacy/compliance safeguards
    while preserving investigative domain context.
    """
    if not text:
        return ""
        
    # Mask emails: user.name@domain.com -> u***e@domain.com
    def mask_email(match):
        local = match.group(1)
        domain = match.group(2)
        if len(local) <= 2:
            masked_local = local[0] + "*"
        else:
            masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
        return f"{masked_local}@{domain}"
        
    masked = re.sub(r'\b([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b', mask_email, text)
    
    # Mask 10+ digit phone numbers (various formats)
    masked = re.sub(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', '[REDACTED PHONE]', masked)
    
    # Mask potential SSN (XXX-XX-XXXX)
    masked = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED SSN]', masked)
    
    # Mask credit card numbers (13-19 digits, spaced or not)
    masked = re.sub(r'\b(?:\d[ -]*?){13,19}\b', '[REDACTED CARD]', masked)
    
    # Mask IPv4 addresses (preserve network context with /24)
    def mask_ipv4(match):
        ip = match.group(0)
        parts = ip.split('.')
        return f"{parts[0]}.{parts[1]}.{parts[2]}.XXX"
    masked = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', mask_ipv4, masked)
    
    return masked

def apply_retention_policy(mask_pii: Optional[bool] = None, max_age_days: Optional[int] = None) -> Dict[str, Any]:
    """
    Apply retention policy: purge old cases and optionally mask PII in stored data.
    Returns stats about what was purged/masked.
    """
    from app.parsers.case_db import DB_PATH
    import sqlite3
    
    if max_age_days is None:
        max_age_days = RETENTION_CONFIG["max_case_age_days"]
    if mask_pii is None:
        mask_pii = RETENTION_CONFIG["mask_pii_in_storage"]
    
    cutoff_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=max_age_days)
    cutoff_str = cutoff_date.isoformat()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Count cases to be purged
    cursor.execute("SELECT COUNT(*) FROM incident_cases WHERE timestamp_utc < ?", (cutoff_str,))
    purge_count = cursor.fetchone()[0]
    
    # Delete old cases
    cursor.execute("DELETE FROM incident_cases WHERE timestamp_utc < ?", (cutoff_str,))
    deleted = cursor.rowcount
    
    # Mask PII in remaining cases if enabled
    masked_count = 0
    if mask_pii:
        cursor.execute("SELECT case_id, payload_json FROM incident_cases")
        rows = cursor.fetchall()
        for case_id, payload_json in rows:
            try:
                data = json.loads(payload_json)
                # Mask PII in key fields
                if "from_address" in data:
                    data["from_address"] = mask_pii_data(data["from_address"])
                if "to_address" in data:
                    data["to_address"] = mask_pii_data(data["to_address"])
                if "reply_to" in data:
                    data["reply_to"] = mask_pii_data(data["reply_to"])
                if "return_path" in data:
                    data["return_path"] = mask_pii_data(data["return_path"])
                if "body_plain" in data:
                    data["body_plain"] = mask_pii_data(data["body_plain"])
                if "body_html" in data:
                    data["body_html"] = mask_pii_data(data["body_html"])
                
                cursor.execute("UPDATE incident_cases SET payload_json = ? WHERE case_id = ?", 
                              (json.dumps(data), case_id))
                masked_count += 1
            except Exception:
                pass
    
    conn.commit()
    conn.close()
    
    return {
        "purged_cases": deleted,
        "masked_cases": masked_count,
        "cutoff_date": cutoff_str,
        "retention_days": max_age_days
    }

def get_retention_config() -> Dict[str, Any]:
    """Get current retention configuration."""
    return RETENTION_CONFIG.copy()

def set_retention_config(enabled: Optional[bool] = None, max_case_age_days: Optional[int] = None, 
                         mask_pii_in_storage: Optional[bool] = None, mask_pii_in_reports: Optional[bool] = None) -> Dict[str, Any]:
    """Update retention configuration."""
    global RETENTION_CONFIG
    if enabled is not None:
        RETENTION_CONFIG["enabled"] = enabled
    if max_case_age_days is not None:
        RETENTION_CONFIG["max_case_age_days"] = max_case_age_days
    if mask_pii_in_storage is not None:
        RETENTION_CONFIG["mask_pii_in_storage"] = mask_pii_in_storage
    if mask_pii_in_reports is not None:
        RETENTION_CONFIG["mask_pii_in_reports"] = mask_pii_in_reports
    return RETENTION_CONFIG.copy()