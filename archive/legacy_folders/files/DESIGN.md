# Forensic Tracing & Attribution Layer — Design Notes

Extends the existing ML threat engine to cover the problem statement's
**Origin Traceability**, **Header/Protocol Analysis**, and **Identity
Correlation & Attribution** sections, which the classifier/spam/synthetic-
detector stack doesn't address on its own.

### 6. Email Header and Protocol Analysis — `header_analyzer.py`
- Parses the `Received:` chain using the stdlib `email` package + regex
  (MTAs format these inconsistently, so parsing is defensive — malformed
  hops lower confidence rather than raising).
- Reverses the chain (headers are newest-first) and walks it from the
  earliest hop forward, **skipping known trusted relays** (Google,
  Outlook, SendGrid, etc.) to find the first hop that's a genuine public
  IP — the "earliest reliable sending node" the brief asks for.
- Parses `Authentication-Results` for SPF/DKIM/DMARC pass/fail/none.
- Flags anomalies: Return-Path/From mismatch, Reply-To silently
  redirecting to a different domain (classic BEC signal), Message-ID
  domain mismatch, out-of-order Received timestamps (forged/injected
  hop), and missing headers entirely.
- Output: an `anomaly_score` (0–1) that feeds the fusion layer.

### 7. Origin Traceability and Location Analysis — `geo_intel.py`
- `GeoProvider` interface, swappable backend. Production = local MaxMind
  GeoLite2/GeoIP2 MMDB (deterministic, auditable, no leaking investigated
  IPs to a third-party API on every lookup — matters for chain of
  custody). A `StaticSeedProvider` stands in here since this environment
  has no MMDB license file.
- Tor exit-node matching (seeded from Tor Project's public exit list in
  production), known-VPN ASN-name matching, and hosting/cloud CIDR
  fingerprinting (AWS/GCP/DigitalOcean/Linode ranges).
- Each result carries a `risk_contribution`: Tor > VPN > bare hosting IP,
  since legitimate corporate mail essentially never originates directly
  from any of these.

### 8. Domain Intelligence — `domain_intel.py`
- WHOIS (registrar, creation date → **domain age**, one of the single
  strongest fraud signals — a domain registered days ago sending "urgent
  invoice" mail is a bigger tell than most NLP features) and DNS
  (MX/NS/SPF/DMARC presence), both wrapped so a lookup failure degrades
  the report instead of crashing the pipeline (WHOIS/DNS are live
  protocols, inherently flaky at scale).
- Lookalike/typosquat detection: Levenshtein edit distance **plus** a
  homoglyph-normalization pass (`0→o`, `rn→m`, `vv→w`, `@→a`, …) so
  `paypa1.com` and `rnicrosoft.com` get caught even though raw edit
  distance alone misses the second one.

### 9. Identity Correlation and Attribution — `attribution_graph.py`
- `networkx` graph: incident nodes connect to shared-infrastructure nodes
  (IP, ASN, domain, reply-to domain). Two incidents don't need a direct
  edge — they're linked *through* the shared entity, which is what makes
  this a graph problem instead of a join-table problem.
- Campaign discovery = connected components. Attribution confidence =
  weighted sum of shared edges, **not** edge count — a shared raw IP
  (weight 1.0) is a much stronger link than a shared domain (weight
  0.75, since domains get burned and rotated fast) or reply-to overlap.
- This is the piece a per-email ML classifier structurally cannot give
  you: "10 flagged emails share the same /24 and the same three reply-to
  addresses" only becomes visible once you connect incidents to each
  other.

### 10. Fusion into the existing pipeline — `trace_pipeline.py`
- Orchestrates modules 6–9 into one `ForensicReport` per email, with a
  `summary_text()` suitable for the analyst dashboard / forensic report
  requirement directly.
- `fuse_with_ml_logits()` mirrors `threat_classifier.py`'s existing Deep
  Heuristic Logit Fusion pattern exactly: Tor/VPN origin, sub-30-day
  domain age, lookalike domains, and active-campaign membership each
  nudge the ML class probabilities (boost Phishing/Brand
  Impersonation/Invoice Fraud, penalize Clean) rather than being
  reported as a disconnected second score.

## What's still a stub for production
- `StaticSeedProvider` in `geo_intel.py` → swap for a MaxMind
  GeoLite2/GeoIP2 MMDB reader (`geoip2` package, same interface).
- Tor exit-node / VPN ASN lists are small static seeds → refresh from
  Tor Project's exit-address feed and a maintained VPN/proxy-detection
  dataset on a scheduled job.
- `attribution_graph.py` is in-memory `networkx` → fine at
  hackathon/demo scale; the same node/edge schema maps directly onto
  Neo4j or Amazon Neptune if incident volume grows past what fits in
  memory, with no redesign needed.
- Chain-of-custody / retention / masking (problem statement's Privacy &
  Compliance section) isn't built yet — logging + evidence preservation
  around `ForensicReport` generation would be the next module.
