"""
app/forensics/domain_intel.py

Domain Intelligence
--------------------
Answers the "domain registration intelligence" part of the problem
statement: WHOIS age/registrar, DNS/MX consistency, and lookalike /
homoglyph domain detection against known brands.

Design notes:
  - WHOIS (port 43) and DNS (port 53) are live network protocols, not
    HTTP -- they will fail in network-restricted sandboxes and are
    inherently best-effort in production too (rate limits, registrars
    that block bulk WHOIS, etc). Every network call here is wrapped so a
    lookup failure degrades the report rather than crashing the pipeline.
  - Domain age is one of the single strongest fraud signals available:
    a domain registered days ago sending "urgent invoice" mail is a much
    stronger tell than almost any NLP feature. It's cheap to compute and
    should be weighted accordingly in the fusion layer.
  - Lookalike detection combines edit distance with a homoglyph
    normalization pass, since "paypa1.com" and "rnicrosoft.com" don't
    look close under raw Levenshtein but are obvious to a human eye.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

try:
    import whois as _whois_lib  # python-whois
except ImportError:
    _whois_lib = None

try:
    import dns.resolver as _dns_resolver  # dnspython
except ImportError:
    _dns_resolver = None

from app.core.config import get_settings


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class DomainReport:
    domain: str
    registrar: Optional[str] = None
    creation_date: Optional[datetime] = None
    domain_age_days: Optional[int] = None
    registrant_country: Optional[str] = None
    mx_hosts: list[str] = field(default_factory=list)
    ns_hosts: list[str] = field(default_factory=list)
    has_spf_record: bool = False
    has_dmarc_record: bool = False
    lookalike_of: Optional[str] = None
    lookalike_distance: Optional[int] = None
    lookup_errors: list[str] = field(default_factory=list)

    @property
    def risk_contribution(self) -> float:
        score = 0.0
        if self.domain_age_days is not None:
            if self.domain_age_days < 7:
                score += 0.5
            elif self.domain_age_days < 30:
                score += 0.35
            elif self.domain_age_days < 90:
                score += 0.15
        if self.lookalike_of:
            score += 0.4
        if not self.has_spf_record:
            score += 0.05
        if not self.has_dmarc_record:
            score += 0.1
        return min(score, 1.0)


# ---------------------------------------------------------------------------
# WHOIS (best-effort, network-dependent)
# ---------------------------------------------------------------------------

def get_whois_data(domain: str) -> tuple[Optional[str], Optional[datetime], Optional[str], list[str]]:
    """Returns (registrar, creation_date, registrant_country, errors)."""
    errors: list[str] = []
    if _whois_lib is None:
        return None, None, None, ["python-whois not installed"]
    try:
        record = _whois_lib.whois(domain)
        creation = record.creation_date
        if isinstance(creation, list):
            creation = creation[0]
        if isinstance(creation, datetime) and creation.tzinfo is None:
            creation = creation.replace(tzinfo=timezone.utc)
        registrar = record.registrar
        country = getattr(record, "country", None)
        return registrar, creation, country, errors
    except Exception as exc:  # WHOIS is flaky by nature: timeouts, rate limits, missing servers
        errors.append(f"WHOIS lookup failed: {exc}")
        return None, None, None, errors


def domain_age_days(creation_date: Optional[datetime]) -> Optional[int]:
    if creation_date is None:
        return None
    now = datetime.now(timezone.utc)
    return (now - creation_date).days


# ---------------------------------------------------------------------------
# DNS (best-effort, network-dependent)
# ---------------------------------------------------------------------------

def get_dns_records(domain: str) -> tuple[list[str], list[str], bool, bool, list[str]]:
    """Returns (mx_hosts, ns_hosts, has_spf, has_dmarc, errors)."""
    errors: list[str] = []
    mx_hosts: list[str] = []
    ns_hosts: list[str] = []
    has_spf = False
    has_dmarc = False

    if _dns_resolver is None:
        return mx_hosts, ns_hosts, has_spf, has_dmarc, ["dnspython not installed"]

    timeout = get_settings().dns_timeout_seconds

    try:
        for rdata in _dns_resolver.resolve(domain, "MX", lifetime=timeout):
            mx_hosts.append(rdata.exchange.to_text().strip(".").lower())
    except Exception as exc:
        errors.append(f"MX lookup failed: {exc}")

    try:
        for rdata in _dns_resolver.resolve(domain, "NS", lifetime=timeout):
            ns_hosts.append(rdata.target.to_text().strip(".").lower())
    except Exception as exc:
        errors.append(f"NS lookup failed: {exc}")

    try:
        for rdata in _dns_resolver.resolve(domain, "TXT", lifetime=timeout):
            txt = "".join(s.decode() if isinstance(s, bytes) else s for s in rdata.strings)
            if txt.startswith("v=spf1"):
                has_spf = True
    except Exception as exc:
        errors.append(f"TXT/SPF lookup failed: {exc}")

    try:
        for rdata in _dns_resolver.resolve(f"_dmarc.{domain}", "TXT", lifetime=timeout):
            txt = "".join(s.decode() if isinstance(s, bytes) else s for s in rdata.strings)
            if txt.startswith("v=DMARC1"):
                has_dmarc = True
    except Exception as exc:
        errors.append(f"DMARC lookup failed: {exc}")

    return mx_hosts, ns_hosts, has_spf, has_dmarc, errors


# ---------------------------------------------------------------------------
# Lookalike / homoglyph detection (pure, offline, deterministic)
# ---------------------------------------------------------------------------

_HOMOGLYPH_MAP = {
    "0": "o", "1": "l", "3": "e", "5": "s", "7": "t", "@": "a",
    "rn": "m", "vv": "w", "cl": "d",
}


def _levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        curr = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            cost = 0 if ca == cb else 1
            curr[j] = min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
        prev = curr
    return prev[-1]


def normalize_homoglyphs(domain: str) -> str:
    normalized = domain.lower()
    for glyph, replacement in _HOMOGLYPH_MAP.items():
        normalized = normalized.replace(glyph, replacement)
    return normalized


def check_domain_lookalike(domain: str, brand_domains: list[str], max_distance: int = 2) -> tuple[Optional[str], Optional[int]]:
    """
    Flags `domain` as a probable lookalike of one of `brand_domains` if:
      - raw edit distance is small (typosquat: paypal.com -> paypa1.com), or
      - homoglyph-normalized edit distance is small (rnicrosoft.com -> microsoft.com)
    Exact matches are not flagged (that's the real domain, not a lookalike).
    """
    domain_norm = normalize_homoglyphs(domain)
    best_match: Optional[str] = None
    best_distance: Optional[int] = None

    for brand in brand_domains:
        if domain == brand:
            continue
        brand_norm = normalize_homoglyphs(brand)
        raw_dist = _levenshtein(domain, brand)
        norm_dist = _levenshtein(domain_norm, brand_norm)
        distance = min(raw_dist, norm_dist)
        if distance <= max_distance and (best_distance is None or distance < best_distance):
            best_match, best_distance = brand, distance

    return best_match, best_distance


# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------

def analyze_domain(domain: str, known_brand_domains: Optional[list[str]] = None) -> DomainReport:
    report = DomainReport(domain=domain)
    
    if known_brand_domains is None:
        known_brand_domains = get_settings().protected_brands

    registrar, creation, country, whois_errors = get_whois_data(domain)
    report.registrar = registrar
    report.creation_date = creation
    report.registrant_country = country
    report.domain_age_days = domain_age_days(creation)
    report.lookup_errors.extend(whois_errors)

    mx_hosts, ns_hosts, has_spf, has_dmarc, dns_errors = get_dns_records(domain)
    report.mx_hosts = mx_hosts
    report.ns_hosts = ns_hosts
    report.has_spf_record = has_spf
    report.has_dmarc_record = has_dmarc
    report.lookup_errors.extend(dns_errors)

    if known_brand_domains:
        match, distance = check_domain_lookalike(domain, known_brand_domains)
        report.lookalike_of = match
        report.lookalike_distance = distance

    return report


if __name__ == "__main__":
    # Offline-testable portion: lookalike detection needs no network at all.
    brands = ["paypal.com", "microsoft.com", "chase.com", "trusted-vendor.com"]
    test_domains = ["paypa1.com", "rnicrosoft.com", "totally-different-domain.ru", "chase.com"]

    print("=== Lookalike detection (offline, deterministic) ===")
    for d in test_domains:
        match, dist = check_domain_lookalike(d, brands)
        print(f"  {d:35s} -> match={match!r:35s} distance={dist}")

    print("\n=== Domain age scoring ===")
    for age, label in [(3, "brand-new"), (25, "young"), (400, "established")]:
        fake_report = DomainReport(domain="example.com", domain_age_days=age)
        print(f"  age={age:4d}d ({label:12s}) -> risk_contribution={fake_report.risk_contribution:.2f}")

    print("\n=== Live WHOIS/DNS (best-effort; may show lookup_errors in this sandbox) ===")
    live = analyze_domain("totally-different-domain.ru", known_brand_domains=brands)
    print(f"  registrar={live.registrar} age_days={live.domain_age_days} errors={live.lookup_errors}")
