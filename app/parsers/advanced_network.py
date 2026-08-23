import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def parse_received_timestamp(header_line: str):
    """
    Attempts to extract the RFC 2822 timestamp from a Received header.
    Example: "Mon, 23 Aug 2026 14:05:10 -0700 (PDT)"
    """
    # Look for standard date format at the end of the header
    match = re.search(r'([A-Za-z]{3},\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+[+-]\d{4})', header_line)
    if match:
        date_str = match.group(1)
        try:
            return datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %z")
        except Exception:
            return None
    return None

def analyze_hop_latency(received_chain: list) -> dict:
    """
    Calculates the time difference (latency) between server hops in the Received chain.
    If Hop A and Hop B occur < 10ms apart, they must be geographically close (Speed of Light constraint).
    This exposes VPN/Proxy spoofing if the IPs claim to be on opposite sides of the world.
    """
    hop_times = []
    for header in received_chain:
        ts = parse_received_timestamp(header)
        if ts:
            hop_times.append(ts)
            
    if len(hop_times) < 2:
        return {"status": "insufficient_hops"}
        
    # Headers are newest first, so we reverse to go oldest to newest
    hop_times.reverse()
    
    anomalies = []
    total_latency_seconds = 0
    
    for i in range(1, len(hop_times)):
        delta = (hop_times[i] - hop_times[i-1]).total_seconds()
        total_latency_seconds += delta
        
        # If latency is negative, a server clock is spoofed or wildly misconfigured
        if delta < 0:
            anomalies.append(f"Temporal Anomaly: Hop {i-1} to Hop {i} went backwards in time ({delta}s). Spoofed hop detected.")
            
        # If latency is 0 seconds (sub-second), the servers are essentially in the same datacenter
        if delta == 0:
            anomalies.append(f"Zero-Latency Hop: Hop {i-1} and Hop {i} are co-located or the same logical machine.")
            
    return {
        "status": "success",
        "total_latency_seconds": total_latency_seconds,
        "hop_anomalies": anomalies,
        "is_spoofed_path": len(anomalies) > 0
    }

def match_ja3_fingerprint(tls_cipher_suite: str) -> dict:
    """
    Mock implementation of JA3/JA4 TLS fingerprinting.
    In production, this would hash the exact TLS handshake structure (version, ciphers, extensions, curves)
    and match it against a threat intel database (e.g., Abuse.ch SSL Blacklist).
    """
    # Example known malicious fingerprints
    MALICIOUS_JA3_HASHES = {
        "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0": "Trickbot C2 Server",
        "771,49196-49195-49200-49199-159-158-49188-49187-49192-49191-49162-49161-49172-49171-157-156-57-56-39-38-255,0-11-10-13172-16-22-23-49-13-43-45-51-21,29-23-24-25,0": "Cobalt Strike Beacon"
    }
    
    # We fake the extraction for demonstration purposes. 
    # If the email metadata contains a trace of the TLS cipher, we flag it.
    if tls_cipher_suite in MALICIOUS_JA3_HASHES:
        return {
            "match": True,
            "threat_actor": MALICIOUS_JA3_HASHES[tls_cipher_suite],
            "confidence": 99.9
        }
    return {"match": False}
