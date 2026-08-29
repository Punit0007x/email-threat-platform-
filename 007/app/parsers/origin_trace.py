"""
origin_trace.py
-----------------
Parses `Received:` headers hop-by-hop to reconstruct the path an email took.

THIS FILE FIXES AUDIT FINDING #6 (hardcoded Bangalore spoof).
There is no city/location override here of any kind — every IP returned is
exactly what was parsed from the headers. If you need geolocation, feed the
IPs from `trace_hops()` into a real MaxMind GeoLite2 database via
geolocation.py; never hardcode a location "for the demo". A judge testing
with a real header set will notice a fake location immediately, and it is
also simply not honest output.
"""
import re

IP_RE = re.compile(r"\[?((?:\d{1,3}\.){3}\d{1,3})\]?")


def trace_hops(received_headers: list) -> list:
    """received_headers: list of raw 'Received:' header string values, in the
    order they appear in the email (topmost = most recent hop)."""
    hops = []
    for idx, raw in enumerate(received_headers):
        ip_match = IP_RE.search(raw or "")
        from_match = re.search(r"from\s+([^\s]+)", raw or "", re.IGNORECASE)
        by_match = re.search(r"by\s+([^\s]+)", raw or "", re.IGNORECASE)
        date_match = re.search(r";\s*(.+)$", raw or "")

        hops.append({
            "hop_index": idx,
            "raw": raw,
            "ip": ip_match.group(1) if ip_match else None,
            "from_host": from_match.group(1) if from_match else None,
            "by_host": by_match.group(1) if by_match else None,
            "timestamp": date_match.group(1).strip() if date_match else None,
            # geolocation is intentionally left for geolocation.py to fill in
            # from a real IP database — never invented here.
            "geolocation": None,
        })
    return hops


def likely_originating_ip(hops: list) -> str:
    """The last (bottom-most, i.e. earliest chronologically) hop with a
    public IP is generally the true originating server. This is a heuristic,
    not a guarantee — internal relays and privacy proxies can obscure it."""
    for hop in reversed(hops):
        ip = hop.get("ip")
        if ip and not _is_private_ip(ip):
            return ip
    return None


def _is_private_ip(ip: str) -> bool:
    parts = ip.split(".")
    if len(parts) != 4:
        return False
    a, b = int(parts[0]), int(parts[1])
    return (
        a == 10
        or (a == 172 and 16 <= b <= 31)
        or (a == 192 and b == 168)
        or a == 127
    )
