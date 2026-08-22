import dns.resolver
import dns.reversename
import ipaddress
from typing import Dict, Any, List, Optional

DNSBL_ZONES = [
    ("zen.spamhaus.org", "Spamhaus ZEN"),
    ("bl.spamcop.net", "SpamCop"),
    ("b.barracudacentral.org", "Barracuda"),
    ("dnsbl.dronebl.org", "DroneBL"),
    ("tor.dan.me.uk", "TOR Exit Nodes"),
]

REVERSE_DNS_TIMEOUT = 2.0
DNSBL_TIMEOUT = 3.0


def _reverse_ip(ip: str) -> Optional[str]:
    """Convert IP to reverse DNS lookup format for DNSBL queries."""
    try:
        addr = ipaddress.ip_address(ip)
        if isinstance(addr, ipaddress.IPv4Address):
            return str(dns.reversename.from_address(ip))
        elif isinstance(addr, ipaddress.IPv6Address):
            return str(dns.reversename.from_address(ip))
    except Exception:
        pass
    return None


def _query_dnsbl(reverse_ip: str, zone: str) -> Dict[str, Any]:
    """Query a single DNSBL zone."""
    # reverse_ip already ends with a dot, strip it to avoid double-dot
    query = f"{reverse_ip.rstrip('.')}.{zone}"
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = DNSBL_TIMEOUT
        resolver.lifetime = DNSBL_TIMEOUT
        answers = resolver.resolve(query, "A")
        return {
            "listed": True,
            "zone": zone,
            "responses": [str(r) for r in answers]
        }
    except dns.resolver.NXDOMAIN:
        return {"listed": False, "zone": zone, "responses": []}
    except Exception as e:
        return {"listed": False, "zone": zone, "error": str(e)}


def _get_reverse_dns(ip: str) -> Optional[str]:
    """Get PTR record for an IP."""
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = REVERSE_DNS_TIMEOUT
        resolver.lifetime = REVERSE_DNS_TIMEOUT
        rev = dns.reversename.from_address(ip)
        answers = resolver.resolve(rev, "PTR")
        return str(answers[0]).rstrip(".")
    except Exception:
        return None


def query_ip_reputation(ip: str) -> Dict[str, Any]:
    """
    Performs IP reputation intelligence lookups:
    - Reverse DNS (PTR)
    - DNSBL checks across multiple blocklists (Spamhaus, SpamCop, Barracuda, DroneBL, TOR)
    - Returns listing status and details for each blocklist
    """
    ip = ip.strip()
    result: Dict[str, Any] = {
        "ip": ip,
        "reverse_dns": None,
        "dnsbl_results": [],
        "listed_count": 0,
        "is_tor_exit": False,
        "is_listed": False,
        "risk_level": "Clean",
        "risk_indicators": []
    }

    if not ip:
        result["risk_indicators"].append("No IP provided for reputation check")
        return result

    # Skip private IPs
    try:
        addr = ipaddress.ip_address(ip)
        if addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_multicast:
            result["risk_level"] = "Private/Reserved"
            result["risk_indicators"].append(f"IP {ip} is private/reserved — reputation checks skipped")
            return result
    except Exception:
        result["risk_indicators"].append(f"Invalid IP address format: {ip}")
        return result

    # 1. Reverse DNS
    ptr = _get_reverse_dns(ip)
    result["reverse_dns"] = ptr

    # 2. DNSBL queries
    reverse_ip = _reverse_ip(ip)
    if not reverse_ip:
        result["risk_indicators"].append("Could not construct reverse DNS for DNSBL lookup")
        return result

    for zone, name in DNSBL_ZONES:
        dnsbl_result = _query_dnsbl(reverse_ip, zone)
        dnsbl_result["blocklist_name"] = name
        result["dnsbl_results"].append(dnsbl_result)
        
        if dnsbl_result.get("listed"):
            result["listed_count"] += 1
            result["is_listed"] = True
            if "tor" in zone.lower():
                result["is_tor_exit"] = True
                result["risk_indicators"].append(f"TOR exit node detected via {name} ({', '.join(dnsbl_result.get('responses', []))})")
            else:
                result["risk_indicators"].append(f"Listed on {name}: {', '.join(dnsbl_result.get('responses', []))}")

    # 3. Risk level assessment
    if result["is_tor_exit"]:
        result["risk_level"] = "Critical"
    elif result["listed_count"] >= 3:
        result["risk_level"] = "High"
    elif result["listed_count"] >= 1:
        result["risk_level"] = "Medium"
    else:
        result["risk_level"] = "Clean"

    if not result["risk_indicators"] and result["risk_level"] == "Clean":
        result["risk_indicators"].append("No blocklist listings found")

    return result