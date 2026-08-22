import re
import ipaddress
import email.utils
from typing import List, Dict, Any

# A small set of trusted domains for the hackathon (simulating a real ASN/IP DB).
# If a hop's reverse DNS matches one of these, we assume it's a trusted relay
# and keep walking down the chain to find the actual sender.
TRUSTED_DOMAINS = ["google.com", "outlook.com", "protection.outlook.com", "amazonses.com", "mimecast.com"]

def extract_hop_info(header: str) -> Dict[str, Any]:
    """
    Extracts the IP, reverse DNS, receiving server, and timestamp from a Received header.
    """
    info = {"ip": None, "revdns": "", "by": "", "timestamp": None}
    
    # 1. Extract the receiving server (the 'by' clause)
    by_match = re.search(r'\bby\s+([^\s;]+)', header)
    if by_match:
        info["by"] = by_match.group(1).lower()
        
    # 2. Extract the sender IP (usually in brackets)
    ip_pattern = r'\[([0-9a-fA-F\.\:]+)\]'
    ip_match = re.search(ip_pattern, header)
    
    if ip_match:
        ip_str = ip_match.group(1)
        try:
            ipaddress.ip_address(ip_str) # Validate
            info["ip"] = ip_str
        except ValueError:
            pass
            
    # 3. Extract reverse DNS, which our trusted receiving server performed.
    # Format typically: from HELO (revdns [IP])
    if info["ip"]:
        # Escape the IP for regex safety
        escaped_ip = re.escape(info["ip"])
        revdns_match = re.search(r'\(([^)]+)\s+\[' + escaped_ip + r'\]\)', header)
        if revdns_match:
            info["revdns"] = revdns_match.group(1).lower()
            
     # Fallback for IP extraction if no brackets were used
    if not info["ip"]:
        ipv4_match = re.search(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', header)
        if ipv4_match:
             try:
                 ipaddress.ip_address(ipv4_match.group(0))
                 info["ip"] = ipv4_match.group(0)
             except ValueError:
                 pass
                 
    # 4. Extract Date
    # Received headers usually end with '; Date'
    date_split = header.split(';')
    if len(date_split) > 1:
        date_str = date_split[-1].strip()
        try:
            parsed_date = email.utils.parsedate_to_datetime(date_str)
            if parsed_date:
                info["timestamp"] = parsed_date.isoformat()
        except Exception:
            pass

    return info

def is_trusted(revdns: str) -> bool:
    for domain in TRUSTED_DOMAINS:
        if revdns.endswith(domain):
            return True
    return False

def trace_origin(received_chain: List[str]) -> Dict[str, Any]:
    """
    Walks the Received chain to find the most likely TRUE origin IP.
    Headers are ordered newest (closest to recipient) to oldest (closest to sender).
    """
    hops = []
    
    for idx, header in enumerate(received_chain):
        hop_info = extract_hop_info(header)
        hop_info["hop_index"] = idx
        # Clean up header for JSON readability
        clean_header = header.replace('\n', ' ').replace('\t', ' ')
        hop_info["raw_header_snippet"] = clean_header[:100] + "..." if len(clean_header) > 100 else clean_header
        hops.append(hop_info)
        
    best_guess_ip = None
    reason = "undetermined"
    
    # Note on limits: Walking the chain to find the origin is a best-effort heuristic.
    # An attacker can forge 'Received' headers before sending the email to the first trusted server.
    # The first untrusted IP we find (working backwards from the recipient) is the boundary.
    for hop in hops:
        ip_str = hop["ip"]
        if not ip_str:
            continue
            
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            if ip_obj.is_private:
                continue # Skip private IPs (e.g., internal load balancers)
                
            if is_trusted(hop["revdns"]):
                continue # Trusted relay (e.g., Gmail). Keep walking down.
                
            # We found the first public, untrusted IP. This is our origin.
            best_guess_ip = ip_str
            reason = f"Hop {hop['hop_index']} is the first public, untrusted IP ({ip_str}). Earlier hops cannot be verified."
            break
            
        except ValueError:
            continue
            
    # Fallback logic if we didn't find an untrusted public IP
    if not best_guess_ip:
        for hop in hops:
            if hop["ip"]:
                best_guess_ip = hop["ip"]
                reason = "All IPs were private or trusted. Picked the last valid IP as fallback."
                break
                
    if not best_guess_ip:
         reason = "No valid IP addresses could be extracted from the Received chain."
         
    # Check for time-travel anomalies (hop N received before hop N+1)
    # Hops are ordered newest to oldest
    anomalies = []
    from datetime import datetime
    for i in range(len(hops) - 1):
        if hops[i].get("timestamp") and hops[i+1].get("timestamp"):
            try:
                t1 = datetime.fromisoformat(hops[i]["timestamp"])
                t2 = datetime.fromisoformat(hops[i+1]["timestamp"])
                # t1 is newer hop, t2 is older hop. t1 should be >= t2.
                if t1 < t2:
                    anomalies.append(f"Time-travel anomaly between hop {i} and {i+1}: {t1} < {t2}")
            except Exception:
                pass
         
    return {
        "hops": hops,
        "best_guess_ip": best_guess_ip,
        "reason": reason,
        "anomalies": anomalies
    }
