import pytest
import os
import networkx as nx
from datetime import datetime
import ipaddress
from app.forensics.header_analyzer import analyze_headers, Hop, AuthResult
from app.forensics.geo_intel import build_origin_profile, is_tor_exit_node, refresh_tor_exit_nodes_sync
from app.forensics.domain_intel import check_domain_lookalike, _levenshtein, normalize_homoglyphs
from app.forensics.attribution_graph import build_attribution_graph, Incident, add_incident, find_related_incidents
from app.forensics.trace_pipeline import run_forensic_trace, fuse_with_ml_logits
from app.ml.threat_classifier import classify_email_threat

# Sample raw email for testing
SAMPLE_EMAIL = """From: "Finance Dept" <billing@trusted-vendor.com>
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

def test_header_analyzer():
    report = analyze_headers(SAMPLE_EMAIL)
    assert report.from_addr == '"Finance Dept" <billing@trusted-vendor.com>'
    assert report.originating_ip == '185.220.101.45'
    assert report.auth.spf == 'fail'
    assert report.anomaly_score > 0

def test_geo_intel():
    profile = build_origin_profile("185.220.101.45")
    assert profile.ip == "185.220.101.45"
    assert profile.is_tor_exit
    assert profile.risk_contribution() > 0

def test_domain_intel():
    match, dist = check_domain_lookalike("paypa1.com", ["paypal.com", "microsoft.com"], max_distance=2)
    assert match == "paypal.com"
    assert dist == 1

def test_attribution_graph():
    graph = build_attribution_graph()
    inc1 = Incident("INC-1", originating_ip="1.2.3.4")
    inc2 = Incident("INC-2", originating_ip="1.2.3.4")
    
    add_incident(graph, inc1)
    add_incident(graph, inc2)
    
    related = find_related_incidents(graph, "INC-1")
    assert "INC-2" in related

def test_trace_pipeline_and_fusion():
    report = run_forensic_trace("INC-99", SAMPLE_EMAIL, known_brand_domains=["trusted-vendor.com"], tenant_id="test_tenant")
    assert report.header.originating_ip == '185.220.101.45'
    assert report.geo is not None
    assert report.geo.is_tor_exit
    
    ml_probs = {"clean": 0.55, "phishing_credential_harvesting": 0.20, "brand_impersonation": 0.15, "invoice_payment_fraud": 0.10}
    adjusted = fuse_with_ml_logits(ml_probs, report)
    
    assert adjusted["phishing_credential_harvesting"] > ml_probs["phishing_credential_harvesting"]
    assert adjusted["clean"] < ml_probs["clean"]

def test_threat_classifier_integration():
    features = {
        "forensic_report": run_forensic_trace("INC-100", SAMPLE_EMAIL, known_brand_domains=["trusted-vendor.com"], tenant_id="test_tenant")
    }
    
    result = classify_email_threat(
        features=features,
        domain_check={},
        auth_analysis={},
        bec_analysis={},
        raw_text=SAMPLE_EMAIL
    )
    
    assert "primary_threat" in result
    assert result["primary_threat"] != "clean"

def test_refresh_tor():
    refresh_tor_exit_nodes_sync()
    assert is_tor_exit_node("185.220.101.45")
