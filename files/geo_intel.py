"""
app/forensics/geo_intel.py

Origin Traceability and Location Analysis
------------------------------------------
Consumes the originating IP found by header_analyzer.py and answers:
  - probable country / region / city / ISP / hosting provider
  - is this a Tor exit node, known VPN, open relay, or cloud/hosting IP?

Design notes:
  - Forensic and legal use requires geolocation to be REPRODUCIBLE and
    AUDITABLE. A live third-party API call on every lookup is a poor fit:
    it's non-deterministic over time, rate-limited, and leaks the IPs
    you're investigating to a third party. The standard production
    approach is a local MaxMind GeoLite2 / GeoIP2 MMDB file queried via
    the `geoip2` library, refreshed on a schedule, with the DB version
    logged alongside every report for chain-of-custody.
  - `GeoProvider` is a small interface so that backend can be swapped in
    (`MaxMindProvider`) without touching calling code. A `StaticSeedProvider`
    is included so this module is fully testable offline, since this
    environment has no MaxMind license file or live network access to
    geolocation APIs.
  - Tor exit-node and VPN/hosting ASN lists are refreshed from public feeds
    (Tor Project's exit-address list, IPinfo/Spur-style VPN datasets) on a
    scheduled job in production. A small static seed set stands in here.
"""

from __future__ import annotations

import ipaddress
from dataclasses import dataclass, field
from typing import Optional, Protocol


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class GeoResult:
    ip: str
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    isp: Optional[str] = None
    asn: Optional[str] = None
    asn_org: Optional[str] = None
    is_tor_exit: bool = False
    is_known_vpn: bool = False
    is_hosting_provider: bool = False
    source: str = "unknown"        # which provider answered (for audit trail)
    notes: list[str] = field(default_factory=list)

    @property
    def anonymization_flag(self) -> bool:
        return self.is_tor_exit or self.is_known_vpn

    @property
    def risk_contribution(self) -> float:
        """
        How much this origin data should push the fraud-risk score up.
        Legit corporate mail almost never originates directly from Tor,
        a consumer VPN, or a bare cloud/hosting IP that isn't a known
        transactional-mail provider (Sendgrid/SES/etc handled upstream
        by header_analyzer's trusted-relay skip list).
        """
        score = 0.0
        if self.is_tor_exit:
            score += 0.5
        if self.is_known_vpn:
            score += 0.3
        if self.is_hosting_provider:
            score += 0.15
        return min(score, 1.0)


# ---------------------------------------------------------------------------
# Provider interface + offline seed backend
# ---------------------------------------------------------------------------

class GeoProvider(Protocol):
    def lookup(self, ip: str) -> GeoResult: ...


class StaticSeedProvider:
    """
    Offline stand-in for a MaxMind GeoLite2 City/ASN database lookup.
    Swap this for `MaxMindProvider(db_path="GeoLite2-City.mmdb")` in
    production -- same interface, zero changes to callers.
    """

    _SEED = {
        # A handful of illustrative, publicly-documented example entries.
        "185.220.101.45": GeoResult(
            ip="185.220.101.45", country="Germany", region="Hesse", city="Frankfurt",
            isp="Tor Exit Relay Operator", asn="AS208294", asn_org="Example Tor Relay Org",
        ),
        "45.33.32.156": GeoResult(
            ip="45.33.32.156", country="United States", region="New Jersey", city="Newark",
            isp="Linode", asn="AS63949", asn_org="Linode, LLC",
        ),
        "8.8.8.8": GeoResult(
            ip="8.8.8.8", country="United States", region="California", city="Mountain View",
            isp="Google LLC", asn="AS15169", asn_org="Google LLC",
        ),
    }

    def lookup(self, ip: str) -> GeoResult:
        if ip in self._SEED:
            result = self._SEED[ip]
            result.source = "static_seed_provider"
            return result
        return GeoResult(ip=ip, source="static_seed_provider",
                          notes=["No local seed entry -- wire up MaxMindProvider or a live API for production coverage."])


# ---------------------------------------------------------------------------
# Tor / VPN / hosting fingerprinting
# ---------------------------------------------------------------------------

# Seed set. Production: refresh hourly from
# https://check.torproject.org/torbulkexitlist and cache in Redis/DB.
_TOR_EXIT_SEED: set[str] = {
    "185.220.101.45",
    "185.220.101.46",
    "51.15.43.205",
}

# Illustrative CIDR blocks for major hosting/cloud providers. Production:
# use MaxMind's ASN DB or a Team Cymru IP-to-ASN feed for full coverage --
# this is a deliberately small demo subset, not a real allowlist.
_HOSTING_CIDRS: dict[str, str] = {
    "45.33.0.0/16": "Linode",
    "104.131.0.0/16": "DigitalOcean",
    "13.32.0.0/15": "Amazon AWS / CloudFront",
    "34.64.0.0/10": "Google Cloud",
}

# Illustrative known-VPN ASN name fragments. Production: subscribe to a
# maintained VPN/proxy detection feed (IPinfo Privacy Detection, Spur, etc.)
_VPN_ORG_HINTS = ("nordvpn", "expressvpn", "surfshark", "private internet access", "protonvpn")


def is_tor_exit_node(ip: str, exit_nodes: Optional[set[str]] = None) -> bool:
    return ip in (exit_nodes or _TOR_EXIT_SEED)


def hosting_provider_for(ip: str) -> Optional[str]:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return None
    for cidr, provider in _HOSTING_CIDRS.items():
        if addr in ipaddress.ip_network(cidr):
            return provider
    return None


def is_known_vpn_org(asn_org: Optional[str]) -> bool:
    if not asn_org:
        return False
    lowered = asn_org.lower()
    return any(hint in lowered for hint in _VPN_ORG_HINTS)


# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------

def build_origin_profile(ip: str, provider: Optional[GeoProvider] = None) -> GeoResult:
    """
    Full origin profile for a single IP: geolocation + anonymization-
    infrastructure flags + risk contribution. This is what gets attached
    to the forensic report and handed to attribution_graph.py as a node.
    """
    provider = provider or StaticSeedProvider()
    result = provider.lookup(ip)

    result.is_tor_exit = is_tor_exit_node(ip)
    result.is_known_vpn = is_known_vpn_org(result.asn_org)

    hosting = hosting_provider_for(ip)
    if hosting:
        result.is_hosting_provider = True
        result.notes.append(f"IP falls in known hosting range: {hosting}")

    if result.is_tor_exit:
        result.notes.append("IP matches a known Tor exit relay")
    if result.is_known_vpn:
        result.notes.append(f"ASN org '{result.asn_org}' matches known consumer-VPN provider")

    return result


if __name__ == "__main__":
    for test_ip in ("185.220.101.45", "45.33.32.156", "8.8.8.8", "203.0.113.9"):
        profile = build_origin_profile(test_ip)
        print(f"\nIP: {profile.ip}")
        print(f"  Location: {profile.city}, {profile.region}, {profile.country}")
        print(f"  ASN/ISP:  {profile.asn} ({profile.asn_org or profile.isp})")
        print(f"  Tor exit: {profile.is_tor_exit} | Known VPN: {profile.is_known_vpn} | Hosting: {profile.is_hosting_provider}")
        print(f"  Risk contribution: {profile.risk_contribution:.2f}")
        for n in profile.notes:
            print(f"  note: {n}")
