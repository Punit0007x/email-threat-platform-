"""
app/forensics/trace_pipeline.py

Forensic Trace Pipeline
-------------------------
Ties header_analyzer.py -> geo_intel.py -> domain_intel.py ->
attribution_graph.py into ONE consolidated forensic report per email,
and fuses the result with the existing ML threat-classifier output using
the same "logit fusion" pattern threat_classifier.py already uses for
credential-harvesting links and Bitcoin wallet addresses:

    raw ML probabilities are adjusted by hard forensic telemetry,
    not trusted blindly.

This is the piece that turns "we classified this email as phishing"
into "we classified this email as phishing, it originated from a Tor
exit node in a hosting range, the sending domain was registered 4 days
ago, and it's the 3rd incident in an active campaign we're already
tracking" -- which is what the problem statement's "confidence-based
assessment of fraud risk and probable sender origin" is actually asking
for.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import networkx as nx

from app.forensics.header_analyzer import analyze_headers, HeaderReport
from app.forensics.geo_intel import build_origin_profile, GeoResult
from app.forensics.domain_intel import analyze_domain, DomainReport
from app.forensics.attribution_graph import (
    Incident, add_incident, find_related_incidents, cluster_campaigns,
)


@dataclass
class ForensicReport:
    incident_id: str
    header: HeaderReport
    geo: Optional[GeoResult]
    domain: Optional[DomainReport]
    related_incidents: set[str] = field(default_factory=set)
    origin_risk_score: float = 0.0

    def summary_text(self) -> str:
        lines = [
            f"FORENSIC TRACE REPORT — {self.incident_id}",
            "=" * 50,
            f"From:            {self.header.from_addr}",
            f"Originating IP:  {self.header.originating_ip or 'undetermined'}",
        ]
        if self.geo:
            lines.append(f"Geolocation:     {self.geo.city}, {self.geo.region}, {self.geo.country} "
                          f"({self.geo.asn_org or self.geo.isp or 'unknown ISP'})")
            flags = []
            if self.geo.is_tor_exit:
                flags.append("TOR EXIT NODE")
            if self.geo.is_known_vpn:
                flags.append("KNOWN VPN")
            if self.geo.is_hosting_provider:
                flags.append("HOSTING/CLOUD IP")
            if flags:
                lines.append(f"Infra flags:     {', '.join(flags)}")
        if self.domain:
            age = f"{self.domain.domain_age_days}d old" if self.domain.domain_age_days is not None else "age unknown"
            lines.append(f"Sender domain:   {self.domain.domain} ({age}, registrar={self.domain.registrar or 'unknown'})")
            if self.domain.lookalike_of:
                lines.append(f"Lookalike:       impersonates '{self.domain.lookalike_of}' (edit distance {self.domain.lookalike_distance})")
        if self.header.anomalies:
            lines.append("Header anomalies:")
            lines.extend(f"  - {a}" for a in self.header.anomalies)
        if self.related_incidents:
            lines.append(f"Linked incidents: {sorted(self.related_incidents)} (shared infrastructure — likely same campaign)")
        lines.append(f"Origin risk score: {self.origin_risk_score:.2f} / 1.00")
        return "\n".join(lines)


def run_forensic_trace(
    incident_id: str,
    raw_email: str,
    known_brand_domains: Optional[list[str]] = None,
    graph: Optional[nx.Graph] = None,
) -> ForensicReport:
    header_report = analyze_headers(raw_email)

    geo_report = None
    if header_report.originating_ip:
        geo_report = build_origin_profile(header_report.originating_ip)

    domain_report = None
    from_domain = header_report.from_addr.split("@")[-1].rstrip(">").lower() if header_report.from_addr and "@" in header_report.from_addr else None
    if from_domain:
        domain_report = analyze_domain(from_domain, known_brand_domains=known_brand_domains)

    # Weighted blend: header anomalies and domain intel are the most
    # reliable (deterministic, protocol-level); origin/geo is supporting
    # evidence since a clean-looking IP doesn't clear an email, but a
    # dirty one strongly indicts it.
    origin_risk = 0.45 * header_report.anomaly_score
    origin_risk += 0.35 * (domain_report.risk_contribution if domain_report else 0.0)
    origin_risk += 0.20 * (geo_report.risk_contribution if geo_report else 0.0)

    related: set[str] = set()
    if graph is not None:
        incident = Incident(
            incident_id=incident_id,
            from_address=header_report.from_addr,
            from_domain=from_domain,
            originating_ip=header_report.originating_ip,
            asn=geo_report.asn if geo_report else None,
            reply_to_domain=header_report.reply_to.split("@")[-1].rstrip(">").lower() if header_report.reply_to and "@" in header_report.reply_to else None,
            fraud_score=origin_risk,
        )
        add_incident(graph, incident)
        related = find_related_incidents(graph, incident_id)
        if related:
            origin_risk = min(origin_risk + 0.1, 1.0)  # part of an active campaign -> extra confidence boost

    return ForensicReport(
        incident_id=incident_id,
        header=header_report,
        geo=geo_report,
        domain=domain_report,
        related_incidents=related,
        origin_risk_score=origin_risk,
    )


def fuse_with_ml_logits(ml_class_probs: dict[str, float], report: ForensicReport) -> dict[str, float]:
    """
    Same pattern as threat_classifier.py's Deep Heuristic Logit Fusion:
    adjust raw ML class probabilities using hard forensic signal instead
    of trusting the model in isolation. Kept as simple additive nudges
    with renormalization so this drops into the existing fusion step
    with minimal change.
    """
    adjusted = dict(ml_class_probs)

    def bump(cls: str, amount: float):
        if cls in adjusted:
            adjusted[cls] = min(adjusted[cls] + amount, 1.0)

    def penalize(cls: str, amount: float):
        if cls in adjusted:
            adjusted[cls] = max(adjusted[cls] - amount, 0.0)

    if report.geo and (report.geo.is_tor_exit or report.geo.is_known_vpn):
        bump("Phishing", 0.15)
        penalize("Clean", 0.15)

    if report.domain and report.domain.domain_age_days is not None and report.domain.domain_age_days < 30:
        bump("Brand Impersonation", 0.15)
        bump("Invoice Fraud", 0.1)
        penalize("Clean", 0.15)

    if report.domain and report.domain.lookalike_of:
        bump("Brand Impersonation", 0.25)
        penalize("Clean", 0.25)

    if report.related_incidents:
        # Confirmed part of an active campaign -- strongest possible signal.
        bump("BEC/Executive Impersonation", 0.1)
        bump("Invoice Fraud", 0.1)
        penalize("Clean", 0.2)

    total = sum(adjusted.values()) or 1.0
    return {k: v / total for k, v in adjusted.items()}


if __name__ == "__main__":
    sample_email = """From: "Finance Dept" <billing@trusted-vendor.com>
Return-Path: <bounce@totally-different-domain.ru>
Reply-To: payouts@totally-different-domain.ru
Message-ID: <abc123@totally-different-domain.ru>
Received: by 10.10.10.1 with SMTP id abc; Tue, 25 Aug 2026 09:15:00 +0000
Received: from mail.totally-different-domain.ru (185.220.101.45) by mx.victimcorp.com with ESMTPS id xyz; Tue, 25 Aug 2026 09:14:55 +0000
Received: from [10.0.0.5] by internal-relay.victimcorp.com; Tue, 25 Aug 2026 09:14:50 +0000
Authentication-Results: mx.victimcorp.com; spf=fail smtp.mailfrom=totally-different-domain.ru; dkim=none; dmarc=fail
Subject: Urgent: Updated payment instructions

Please update the wire transfer details for this month's invoice.
"""

    graph = nx.Graph()
    # Simulate two prior incidents already in the system, sharing infra
    # with the email we're about to trace.
    add_incident(graph, Incident("INC-001", from_domain="totally-different-domain.ru",
                                  originating_ip="185.220.101.45", asn="AS208294"))
    add_incident(graph, Incident("INC-002", from_domain="totally-different-domain.ru",
                                  originating_ip="185.220.101.46", asn="AS208294"))

    report = run_forensic_trace(
        incident_id="INC-003",
        raw_email=sample_email,
        known_brand_domains=["trusted-vendor.com", "paypal.com", "microsoft.com"],
        graph=graph,
    )
    print(report.summary_text())

    print("\n=== Logit fusion against a hypothetical ML output ===")
    ml_probs = {"Clean": 0.55, "Phishing": 0.20, "Brand Impersonation": 0.15, "Invoice Fraud": 0.10}
    print("Before fusion:", ml_probs)
    print("After fusion: ", {k: round(v, 3) for k, v in fuse_with_ml_logits(ml_probs, report).items()})

    print("\n=== Active campaigns tracked so far ===")
    for i, c in enumerate(cluster_campaigns(graph), 1):
        print(f"  Campaign {i}: {sorted(c)}")
