"""
app/forensics/header_analyzer.py

Email Header and Protocol Analysis Module
------------------------------------------
Answers the "Origin Traceability" and "Header/Protocol Analysis" sections
of the problem statement:

  - Deep analysis of Return-Path, Received headers, Message-ID, Reply-To,
    DKIM, SPF, DMARC.
  - Detection of anomalies in mail routing, forged sender fields, relay
    manipulation, spoofed transmission records.
  - Extraction of the earliest reliable sending node (feeds geo_intel.py).

Design notes:
  - Pure stdlib parsing (email, re, ipaddress) -> no network calls, so this
    module is deterministic and fast enough to run inline on every message
    before the ML classifier even sees it.
  - Received headers are notoriously inconsistent across MTAs, so parsing
    is regex-based and defensive: we never raise on malformed input, we
    just lower our confidence and flag it as an anomaly.
"""

from __future__ import annotations

import re
import ipaddress
from dataclasses import dataclass, field
from datetime import datetime
from email import message_from_string
from email.message import Message
from email.utils import parseaddr, parsedate_to_datetime
from typing import Optional

from app.core.config import get_settings


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class Hop:
    """One hop in the Received: header chain."""
    index: int                     # 0 = earliest (bottom of headers), N = last hop before inbox
    raw: str
    from_host: Optional[str] = None
    from_ip: Optional[str] = None
    by_host: Optional[str] = None
    with_protocol: Optional[str] = None
    timestamp: Optional[datetime] = None
    is_private_ip: bool = False


@dataclass
class AuthResult:
    spf: str = "none"       # pass | fail | softfail | neutral | none
    dkim: str = "none"      # pass | fail | none
    dmarc: str = "none"     # pass | fail | none


@dataclass
class HeaderReport:
    hops: list[Hop] = field(default_factory=list)
    auth: AuthResult = field(default_factory=AuthResult)
    originating_ip: Optional[str] = None
    originating_host: Optional[str] = None
    from_addr: Optional[str] = None
    return_path: Optional[str] = None
    reply_to: Optional[str] = None
    message_id_domain: Optional[str] = None
    anomalies: list[str] = field(default_factory=list)
    anomaly_score: float = 0.0     # 0..1, feeds the logit-fusion layer


# ---------------------------------------------------------------------------
# Received-header parsing
# ---------------------------------------------------------------------------

_IP_RE = re.compile(r"\[?(\d{1,3}(?:\.\d{1,3}){3}|[0-9a-fA-F:]{3,})\]?")
_FROM_RE = re.compile(r"from\s+([^\s]+(?:\s+\([^)]*\))?)", re.IGNORECASE)
_BY_RE = re.compile(r"\bby\s+([^\s]+)", re.IGNORECASE)
_WITH_RE = re.compile(r"\bwith\s+([^\s;]+)", re.IGNORECASE)

# Hosting/relay infra that legitimate mail almost always passes through.
# We don't stop tracing at these -- we skip past them looking for the
# first hop that is NOT one of the org's own trusted relays.
# The list is pulled from global config.
_TRUSTED_RELAY_HINTS = None # will be fetched dynamically from config


def get_trusted_relays() -> tuple[str, ...]:
    return tuple(get_settings().trusted_relays)


def _extract_ip(text: str) -> Optional[str]:
    for match in _IP_RE.finditer(text):
        candidate = match.group(1)
        try:
            ipaddress.ip_address(candidate)
            return candidate
        except ValueError:
            continue
    return None


def _parse_received_line(raw: str, index: int) -> Hop:
    hop = Hop(index=index, raw=raw)

    from_match = _FROM_RE.search(raw)
    if from_match:
        from_field = from_match.group(1)
        hop.from_host = from_field.split("(")[0].strip()
        hop.from_ip = _extract_ip(from_field)

    by_match = _BY_RE.search(raw)
    if by_match:
        hop.by_host = by_match.group(1).strip().rstrip(";")

    with_match = _WITH_RE.search(raw)
    if with_match:
        hop.with_protocol = with_match.group(1).strip().rstrip(";")

    # Timestamp is whatever trails the last ';'
    if ";" in raw:
        ts_str = raw.rsplit(";", 1)[-1].strip()
        try:
            hop.timestamp = parsedate_to_datetime(ts_str)
        except (TypeError, ValueError):
            hop.timestamp = None

    if hop.from_ip:
        try:
            hop.is_private_ip = ipaddress.ip_address(hop.from_ip).is_private
        except ValueError:
            hop.is_private_ip = False

    return hop


def parse_received_chain(msg: Message) -> list[Hop]:
    """
    Received headers are stacked newest-first in the raw message (each relay
    prepends its own). We reverse them so index 0 = earliest/original hop,
    which is what an investigator actually wants to read top-to-bottom.
    """
    raw_lines = msg.get_all("Received", [])
    raw_lines = list(reversed(raw_lines))
    return [_parse_received_line(line, i) for i, line in enumerate(raw_lines)]


def find_originating_hop(hops: list[Hop]) -> Optional[Hop]:
    """
    Walk the chain from the earliest hop forward and return the first hop
    that has a public IP and isn't a known trusted relay. This is the
    'earliest reliable sending node' the problem statement asks for.
    """
    for hop in hops:
        if not hop.from_ip or hop.is_private_ip:
            continue
        host = (hop.from_host or "").lower()
        if any(hint in host for hint in get_trusted_relays()):
            continue
        return hop
    # fallback: first hop with any public IP, even if it looked "trusted"
    for hop in hops:
        if hop.from_ip and not hop.is_private_ip:
            return hop
    return None


# ---------------------------------------------------------------------------
# Authentication-Results (SPF / DKIM / DMARC)
# ---------------------------------------------------------------------------

_AUTH_FIELD_RE = re.compile(r"(spf|dkim|dmarc)\s*=\s*(\w+)", re.IGNORECASE)


def parse_authentication_results(msg: Message) -> AuthResult:
    result = AuthResult()
    for header_value in msg.get_all("Authentication-Results", []):
        for field_name, status in _AUTH_FIELD_RE.findall(header_value):
            field_name = field_name.lower()
            status = status.lower()
            if field_name == "spf":
                result.spf = status
            elif field_name == "dkim":
                result.dkim = status
            elif field_name == "dmarc":
                result.dmarc = status
    return result


# ---------------------------------------------------------------------------
# Anomaly detection
# ---------------------------------------------------------------------------

def _domain_of(addr: str) -> Optional[str]:
    _, email_addr = parseaddr(addr)
    if "@" in email_addr:
        return email_addr.rsplit("@", 1)[-1].lower()
    return None


def detect_anomalies(msg: Message, hops: list[Hop], auth: AuthResult) -> tuple[list[str], float]:
    anomalies: list[str] = []
    score = 0.0

    from_addr = msg.get("From", "")
    return_path = msg.get("Return-Path", "")
    reply_to = msg.get("Reply-To", "")
    message_id = msg.get("Message-ID", "")

    from_domain = _domain_of(from_addr)
    return_path_domain = _domain_of(return_path)
    reply_to_domain = _domain_of(reply_to)
    msgid_domain = message_id.split("@")[-1].rstrip(">").lower() if "@" in message_id else None

    # 1. Return-Path / From mismatch (classic envelope spoofing signal)
    if from_domain and return_path_domain and from_domain != return_path_domain:
        anomalies.append(f"Return-Path domain ({return_path_domain}) != From domain ({from_domain})")
        score += 0.25

    # 2. Reply-To silently redirects replies to a different domain
    #    (very common in BEC/invoice-fraud: From looks legit, Reply-To doesn't)
    if from_domain and reply_to_domain and reply_to_domain != from_domain:
        anomalies.append(f"Reply-To domain ({reply_to_domain}) differs from From domain ({from_domain}) — replies are silently redirected")
        score += 0.3

    # 3. Message-ID domain unrelated to sending domain
    if from_domain and msgid_domain and not (msgid_domain.endswith(from_domain) or from_domain.endswith(msgid_domain)):
        anomalies.append(f"Message-ID domain ({msgid_domain}) unrelated to From domain ({from_domain})")
        score += 0.15

    # 4. Out-of-order timestamps in the Received chain -> forged/injected hop
    timestamps = [h.timestamp for h in hops if h.timestamp]
    for earlier, later in zip(timestamps, timestamps[1:]):
        if later < earlier:
            anomalies.append("Received-chain timestamps are out of chronological order (possible forged/injected hop)")
            score += 0.35
            break

    # 5. Authentication failures
    if auth.spf == "fail":
        anomalies.append("SPF check failed")
        score += 0.25
    if auth.dkim == "fail":
        anomalies.append("DKIM signature invalid")
        score += 0.25
    if auth.dmarc == "fail":
        anomalies.append("DMARC alignment failed")
        score += 0.3
    if auth.spf == "none" and auth.dkim == "none":
        anomalies.append("No SPF or DKIM authentication present at all")
        score += 0.15

    # 6. Missing Received headers entirely (locally injected / direct-to-inbox)
    if not hops:
        anomalies.append("No Received headers found — message may have been injected directly")
        score += 0.2

    return anomalies, min(score, 1.0)


# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------

def analyze_headers(raw_email: str) -> HeaderReport:
    msg = message_from_string(raw_email)

    hops = parse_received_chain(msg)
    auth = parse_authentication_results(msg)
    originating_hop = find_originating_hop(hops)
    anomalies, anomaly_score = detect_anomalies(msg, hops, auth)

    message_id = msg.get("Message-ID", "")
    msgid_domain = message_id.split("@")[-1].rstrip(">").lower() if "@" in message_id else None

    return HeaderReport(
        hops=hops,
        auth=auth,
        originating_ip=originating_hop.from_ip if originating_hop else None,
        originating_host=originating_hop.from_host if originating_hop else None,
        from_addr=msg.get("From"),
        return_path=msg.get("Return-Path"),
        reply_to=msg.get("Reply-To"),
        message_id_domain=msgid_domain,
        anomalies=anomalies,
        anomaly_score=anomaly_score,
    )


if __name__ == "__main__":
    # Quick self-test with a synthetic, mildly-spoofed message.
    sample = """From: "Finance Dept" <billing@trusted-vendor.com>
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
    report = analyze_headers(sample)
    print(f"Originating IP:   {report.originating_ip}")
    print(f"Originating host: {report.originating_host}")
    print(f"SPF/DKIM/DMARC:   {report.auth.spf}/{report.auth.dkim}/{report.auth.dmarc}")
    print(f"Anomaly score:    {report.anomaly_score:.2f}")
    print("Anomalies:")
    for a in report.anomalies:
        print(f"  - {a}")
