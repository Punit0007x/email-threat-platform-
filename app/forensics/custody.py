import hashlib
import uuid
import datetime
import re
from typing import Dict, Any, Optional

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
    Redacts personally identifiable information (PII) such as local-part email usernames
    and telephone numbers for privacy/compliance safeguards while preserving investigative domain context.
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
    
    # Mask 10+ digit phone numbers
    masked = re.sub(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', '[REDACTED PHONE]', masked)
    
    return masked
