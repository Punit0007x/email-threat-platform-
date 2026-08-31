# AI-Powered Email Threat Detection, GeoLocation & Forensic Intelligence Platform
## Complete Build Plan — SIH PS 26106 (AICTE, Cyber Security Cell)

This is the execution playbook. For every module: **why** it matters to the win condition, **how** it technically works, **where** to get the tools/data, and **how** to actually build it. Sprint plan is at the end — start there if you just need "what do I do right now."

---

## 0. Why This Plan Wins

SIH judges see dozens of "phishing email classifier" projects every cycle. The problem statement explicitly asks for **origin tracing, geolocation, and attribution** — most teams under-build this half because it's harder than an NLP classifier. Your win condition:

1. Detection (NLP/ML) — table stakes, keep it simple and explainable
2. **Forensics (headers, SPF/DKIM/DMARC, relay chain)** — deterministic, demoable, differentiator
3. **Origin tracing (GeoIP, infra fingerprinting)** — visual, memorable, differentiator
4. **Attribution (graph correlation across emails)** — this is what turns "spam filter" into "forensic intelligence platform," which is literally the problem statement's title

Build in that order of priority when time runs short. A working header-forensics + geo-trace demo beats a fancy but shallow classifier every time in Q&A.

---

## 1. Module: Ingestion & Parsing

**Why:** Everything downstream depends on getting clean, structured data out of a raw email. Get this wrong and every other module produces garbage.

**How it works:** An email (.eml file, or raw text pasted in) is really a MIME document — headers block + body (possibly multipart: plain text, HTML, attachments). You parse it into a structured object: dict of headers, decoded body, list of attachments with hashes, list of extracted URLs.

**Where to get it:**
- Python's built-in `email` module (stdlib, no install needed) — handles MIME parsing
- `mail-parser` (`pip install mail-parser`) — wraps stdlib with easier API, handles malformed headers better
- `eml_parser` (`pip install eml_parser`) — alternative, good attachment/URL extraction out of the box
- Sample malicious emails for testing: Nazario Phishing Corpus (https://monkey.org/~jose/phishing/), or just export test emails from your own Gmail as .eml

**How to do it:**
```python
import mailparser
mail = mailparser.parse_from_file("sample.eml")
headers = mail.headers          # dict
body = mail.body                # decoded text
attachments = mail.attachments  # list with payload, filename
urls = mail.urls                # auto-extracted links
```
Build a FastAPI endpoint `POST /emails/upload` that accepts a file upload, saves the raw bytes immutably (hash it with SHA-256 immediately — this hash is your chain-of-custody anchor), parses it, and stores the structured JSON in Postgres.

---

## 2. Module: Fraudulent Email Detection Engine (NLP/ML)

**Why:** This is the part judges expect. Keep it *explainable* — a black-box score with no reasoning is a red flag in a forensic tool, since analysts need to justify actions.

**How it works:** Classify subject+body text into legitimate / suspicious / impersonated / phishing / BEC-fraud. Two viable approaches:
- **Classical ML (recommended for hackathon):** TF-IDF vectorize the text, train Logistic Regression or XGBoost on labeled phishing/legit datasets. Fast to train, fast to explain (you can show feature weights), no GPU needed.
- **LLM-based (faster to build, no training needed):** Prompt an LLM (Claude API, or open model) to classify + extract indicators in one call. Skip training entirely, more "wow" in a live demo, easier to add new fraud patterns without retraining.

Best hackathon move: **build both, present the classical ML one as your "production model" (cite precision/recall) and the LLM one as your "explainability/edge case layer."** This shows engineering maturity.

Also build rule-based feature detectors (cheap, high-signal, no ML needed):
- Display-name vs actual email domain mismatch
- Urgency keyword density ("immediately," "verify now," "account suspended")
- Credential-request phrases
- Link text vs actual URL mismatch (`<a href="evil.com">paypal.com</a>`)
- Punycode/homoglyph domain detection (`pаypal.com` with Cyrillic а)
- Shortened URL detection (bit.ly etc.) — unshorten before analysis

**Where to get it:**
- Datasets: Nazario Phishing Corpus (phishing), SpamAssassin Public Corpus (spam/ham), Enron Email Dataset (legit, huge, realistic headers), CEAS 2008 Spam Corpus, IWSPA-AP shared task dataset (has header+body, purpose-built for phishing benchmarks)
- Libraries: `scikit-learn` (TF-IDF + LogReg/XGBoost), `transformers` (if you want a DistilBERT fine-tune and have time/GPU)
- Homoglyph detection: `confusable_homoglyphs` (pip package)
- URL unshortening: just follow redirects with `requests` (HEAD request, follow_redirects=True)

**How to do it:**
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
X = vectorizer.fit_transform(train_texts)
clf = LogisticRegression(max_iter=1000)
clf.fit(X, train_labels)

# inference
score = clf.predict_proba(vectorizer.transform([email_text]))[0][1]
```
Mix Enron (label 0) with Nazario/CEAS (label 1) for training, hold out 20% as test set, report precision/recall/F1 in your slides — judges will ask about false-positive rate specifically, since that's the real pain point with commercial email security tools.

---

## 3. Module: Email Header & Protocol Analysis

**Why:** This is your strongest differentiator. It's deterministic (no ML uncertainty), it's exactly what the problem statement asks for ("Deep analysis of email headers"), and it's easy to explain confidently in Q&A because it's just protocol validation, not a model you have to defend.

**How it works:** Three authentication protocols work together to prevent sender spoofing:
- **SPF (Sender Policy Framework):** DNS TXT record on the sending domain lists which IPs are authorized to send mail for it. You check if the sending IP is in that list.
- **DKIM (DomainKeys Identified Mail):** The sender cryptographically signs the email with a private key; you verify the signature against the public key published in DNS. Proves the email wasn't tampered with in transit and really came from that domain.
- **DMARC (Domain-based Message Authentication):** A policy layer that says "if SPF or DKIM fail/misalign, do this" (quarantine/reject/none) — and requires alignment between the visible From: domain and the SPF/DKIM-validated domain (this is what actually stops display-name spoofing).

You also walk the `Received:` header chain (each mail server that touched the message prepends one), which reveals the actual server-to-server path — and you check for anomalies: forged Message-ID, Return-Path domain ≠ From domain, Reply-To mismatch, hops from suspicious ASNs.

**Where to get it:**
- `checkdmarc` (pip install checkdmarc) — does SPF+DKIM+DMARC validation in one call, actively maintained
- `pyspf` — SPF-specific validation
- `dkimpy` — DKIM signature verification
- RFCs to actually read (10-15 min each, worth it for Q&A confidence): RFC 7208 (SPF), RFC 6376 (DKIM), RFC 7489 (DMARC)

**How to do it:**
```python
import checkdmarc
domain_info = checkdmarc.check_domains(["example.com"])
# returns spf, dkim, dmarc records + validity

# For a specific email's headers, parse Received chain manually:
import re
received_headers = mail.headers.get("Received")  # list, order = most recent first
# each hop looks like: "from mail.evil.com (unknown [203.0.113.5]) by mx.gmail.com..."
ip_pattern = r'\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]'
hops = [re.search(ip_pattern, h) for h in received_headers]
```
Reverse the Received chain (it's listed newest-first) to get chronological order, then walk it to find the **first external/untrusted hop** — this is the actual forensic target, not the last line in the header (a very common mistake — spoofed internal-looking hops can appear after the real origin if attackers inject fake Received lines).

---

## 4. Module: Origin Traceability & Location Analysis

**Why:** This is your visual "wow" moment in the demo — a map with a pin showing where the email actually came from. It also directly satisfies the "GeoLocation" half of the problem statement's title.

**How it works:** Once you've extracted the originating IP from the first external Received hop, you look it up in an IP-to-location database to get country/region/city/ISP/ASN. You then cross-reference that IP against known VPN exit nodes, Tor exit nodes, and cloud/hosting-provider IP ranges — because a phishing email originating from a residential ISP reads very differently from one originating from a disposable cloud VPS or a Tor exit node.

**Where to get it:**
- **MaxMind GeoLite2** (free, https://dev.maxmind.com/geoip/geolite2-free-geolocation-data) — download the offline database (City + ASN editions), no rate limits, works without internet during your demo (critical for reliability)
- **IPinfo.io** — alternative, free tier API if you prefer live lookups
- **Tor exit node list** — https://check.torproject.org/torbulkexitlist (plain text list, refresh periodically)
- **Cloud/hosting ASN ranges** — AWS publishes their IP ranges at https://ip-ranges.amazonaws.com/ip-ranges.json; similar for GCP/Azure/DigitalOcean; or just use the ASN name returned by GeoLite2's ASN database (it usually says "Amazon.com" / "DigitalOcean" directly)
- **WHOIS/DNS:** `python-whois` (domain registration date — freshly registered domains, e.g. <30 days old, are a strong phishing signal), `dnspython` (MX record consistency check)

**How to do it:**
```python
import geoip2.database

city_reader = geoip2.database.Reader('GeoLite2-City.mmdb')
asn_reader = geoip2.database.Reader('GeoLite2-ASN.mmdb')

response = city_reader.city(ip_address)
country, city = response.country.name, response.city.name
asn_info = asn_reader.asn(ip_address)
isp = asn_info.autonomous_system_organization

is_tor = ip_address in tor_exit_node_set
is_hosting = any(keyword in isp.lower() for keyword in ['amazon', 'digitalocean', 'google cloud', 'azure', 'ovh'])
```
Render the hop chain + final geolocation on a Leaflet map in the frontend — draw the trace path as a polyline across hops if you have geo data for intermediate relay servers too, not just the origin.

**Important honest caveat to state in your pitch (judges respect this):** IP geolocation is approximate — city-level accuracy isn't guaranteed, and VPN/CGNAT/hosting will mask the true origin. Frame all outputs as "probable origin," not certain fact.

---

## 5. Module: Identity Correlation & Attribution (Graph)

**Why:** This is what makes it a "forensic intelligence platform" rather than a spam filter — the problem statement explicitly asks for this and almost no competing team will build it well because it requires having multiple emails to correlate, which means you need to seed realistic demo data.

**How it works:** You treat sender domains, IPs, display names, and attachment hashes as nodes, and "appeared together in email X" as edges. When two seemingly unrelated phishing emails share an IP, a domain, or an attachment hash, you can flag them as the same campaign/actor — even if the visible sender details differ. This is standard SOC/threat-intel practice (how real security teams cluster IOCs into campaigns).

**Where to get it:**
- `networkx` (pip install networkx) — in-memory graph library, sufficient for hackathon scale, has built-in clustering/connected-components algorithms
- Neo4j — only if you have spare time and want a genuinely interactive graph visual (steeper setup cost, not worth it under time pressure)
- Threat intel for cross-referencing IOCs: **AbuseIPDB** (free tier API, IP reputation), **VirusTotal** (free tier, URL/domain/file reputation), **PhishTank** (free feed, known phishing URLs)

**How to do it:**
```python
import networkx as nx

G = nx.Graph()
G.add_edge(sender_domain, origin_ip, email_id=email.id)
G.add_edge(origin_ip, attachment_hash, email_id=email.id)

# find campaigns: connected components sharing infra across multiple emails
for component in nx.connected_components(G):
    linked_emails = {G.edges[e]['email_id'] for e in G.edges(component)}
    if len(linked_emails) > 1:
        # this is a campaign — multiple emails share infrastructure
        flag_as_campaign(component, linked_emails)
```
Store the underlying relationships as a simple `edges` table in Postgres (`node_a, node_b, relation_type, email_id`) — query with a recursive CTE for the graph traversal, no separate graph DB needed unless you have time to spare.

**For the demo:** seed 8-10 curated sample emails where 2-3 deliberately share an IP or attachment hash, so the "linked campaign" feature has something real to show live, instead of relying on it triggering by chance.

---

## 6. Module: Risk Scoring Engine

**Why:** Judges will ask "how do you combine all these signals into one number?" — have a clear, defensible answer, not a black box.

**How it works:** A weighted sum of normalized sub-scores from each module. Keep it simple and documented — a transparent weighted formula beats an opaque ensemble model you can't explain under Q&A pressure.

```
risk_score = 0.30 * nlp_score
           + 0.25 * auth_failure_score   (SPF/DKIM/DMARC failures)
           + 0.20 * origin_anomaly_score (VPN/Tor/hosting/geo-mismatch)
           + 0.15 * threat_intel_score   (AbuseIPDB/VirusTotal hits)
           + 0.10 * attribution_score    (linked to known campaign)
```

**Where to get it:** No external tool needed — this is your own fusion logic. Document the weights and rationale in your slides; be ready to explain why you chose them (even "we tuned these against our test set to minimize false positives" is a fine, honest answer).

**How to do it:** Just a Python function in your pipeline orchestrator that runs after all other modules complete, normalizes each sub-score to 0-1, applies weights, and stores the final score + a breakdown (for the explainability panel in the dashboard).

---

## 7. Module: Dashboard & Case Management

**Why:** This is what the judges actually look at for 5 minutes. A clean, fast, visually confident dashboard matters as much as backend correctness.

**How it works / Where to get it:** React + Vite + Tailwind (you already know this stack). Key libraries:
- **Leaflet** (or Mapbox GL) — geo trace map
- **Recharts** or **D3** — risk score breakdown chart (radar or stacked bar)
- **react-force-graph** — campaign/attribution graph visualization

**How to do it — screen priority order (build in this order):**
1. Email detail view (the centerpiece — header authenticity badges, geo map, NLP-flagged phrases highlighted inline in the body, risk score breakdown) — build this first, it alone is a demoable MVP
2. Inbox/list view — sortable by risk score, badge colors (green/amber/red)
3. Case/campaign view — the graph viz, only after core pipeline works
4. Report export view — PDF preview + download (use the pdf skill for this when you get here)

---

## 8. Module: Privacy, Legal & Chain-of-Custody

**Why:** The problem statement explicitly names this, and it's from AICTE's Cyber Security Cell — judges with a security background specifically probe whether teams have thought about evidentiary integrity, not just detection accuracy. This section wins you credibility points cheaply.

**How to do it (all lightweight, high credibility-per-effort):**
- SHA-256 hash every raw .eml on ingestion, store the hash alongside a timestamp — this is your evidentiary integrity anchor
- Append-only `audit_log` table: who viewed/exported which case, when
- A PII-masking toggle on export (regex-mask email addresses/phone numbers in the body for shared reports)
- A simple cron-based data retention purge (even just a scheduled job that's demoable, not necessarily running continuously)

---

## 9. Complete Tech Stack Reference

| Layer | Choice | Get it from |
|---|---|---|
| Frontend | React + Vite, Tailwind, Leaflet, Recharts | npm |
| Backend API | FastAPI (Python) | `pip install fastapi uvicorn` |
| ML/NLP | scikit-learn (TF-IDF+LogReg/XGBoost) | `pip install scikit-learn xgboost` |
| Header parsing | mail-parser, email (stdlib) | `pip install mail-parser` |
| Auth checks | checkdmarc, pyspf, dkimpy | `pip install checkdmarc pyspf dkimpy` |
| GeoIP | MaxMind GeoLite2 | https://dev.maxmind.com/geoip/geolite2-free-geolocation-data (free account signup) |
| WHOIS/DNS | python-whois, dnspython | `pip install python-whois dnspython` |
| Threat intel | AbuseIPDB, VirusTotal, PhishTank | Free-tier API keys from each site |
| Graph | networkx | `pip install networkx` |
| Database | PostgreSQL | Docker image `postgres:16` |
| Queue | Celery + Redis (or FastAPI BackgroundTasks if scope is small) | `pip install celery redis` |
| Deployment | Docker Compose locally; Render/Railway free tier for a live demo link | render.com / railway.app |

---

## 10. Database Schema (Postgres, ready to migrate)

```sql
emails(
  id UUID PK, raw_eml_path TEXT, sha256_hash TEXT,
  received_at TIMESTAMPTZ, from_addr TEXT, display_name TEXT,
  subject TEXT, ingested_at TIMESTAMPTZ
)

headers_analysis(
  email_id FK, spf_result TEXT, dkim_result TEXT, dmarc_result TEXT,
  return_path TEXT, reply_to TEXT, message_id TEXT,
  auth_score FLOAT, anomalies JSONB
)

relay_hops(
  id UUID PK, email_id FK, hop_order INT, ip_address TEXT,
  hostname TEXT, timestamp TIMESTAMPTZ
)

geo_data(
  ip_address TEXT PK, country TEXT, region TEXT, city TEXT,
  isp TEXT, asn TEXT, is_vpn BOOLEAN, is_tor BOOLEAN,
  is_hosting BOOLEAN, updated_at TIMESTAMPTZ
)

nlp_analysis(
  email_id FK, category TEXT, confidence FLOAT,
  triggered_indicators JSONB
)

indicators(
  id UUID PK, type TEXT, value TEXT, first_seen TIMESTAMPTZ,
  threat_intel_hits JSONB
)

email_indicators(email_id FK, indicator_id FK)

cases(
  id UUID PK, title TEXT, status TEXT, created_at TIMESTAMPTZ,
  risk_score FLOAT
)

case_emails(case_id FK, email_id FK)

audit_log(
  id UUID PK, user_id FK, action TEXT, target_id UUID,
  timestamp TIMESTAMPTZ
)

users(id UUID PK, name TEXT, role TEXT, org TEXT)

edges(node_a TEXT, node_b TEXT, relation_type TEXT, email_id FK)  -- graph correlation
```

---

## 11. API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/emails/upload` | POST | Upload .eml or paste raw headers+body |
| `/emails/{id}` | GET | Full parsed detail + all analysis results |
| `/emails/{id}/analyze` | POST | Trigger/re-run the full pipeline |
| `/emails/{id}/report` | GET | Generate forensic PDF report |
| `/cases` | GET/POST | List/create cases |
| `/cases/{id}` | GET | Case detail with linked emails + graph |
| `/indicators/{value}` | GET | IOC lookup across all cases |
| `/alerts` | GET | Real-time high-risk feed |

---

## 12. Role Split (assign now, don't wait)

- **Backend/API owner** — FastAPI, DB schema, pipeline orchestration
- **ML/NLP owner** — classifier training, feature engineering, dataset prep
- **Forensics owner** — header parsing, SPF/DKIM/DMARC, GeoIP/WHOIS/threat-intel integration
- **Frontend owner** — dashboard, maps, charts, report view
- **One person owns the pitch deck + demo script end-to-end** so it's not assembled at the last minute

---

## 13. Sprint Plan (phase-based — slot into whatever time you actually have)

### Phase 1 — Core pipeline (build this first, it's your fallback MVP if time runs out)
- [ ] .eml upload → parse → store (with SHA-256 hash)
- [ ] SPF/DKIM/DMARC check → authenticity score
- [ ] Basic NLP classifier (TF-IDF+LogReg is fine) → fraud category
- [ ] GeoIP lookup on first external hop
- [ ] Single "email detail" page showing all of the above
- **Milestone: this alone is a demoable product. Do not move to Phase 2 until this works end-to-end.**

### Phase 2 — Forensic depth
- [ ] Full Received-chain reconstruction + anomaly flags
- [ ] WHOIS/DNS domain-age checks
- [ ] VPN/Tor/hosting fingerprinting
- [ ] Threat-intel API cross-referencing (AbuseIPDB/VirusTotal)

### Phase 3 — Correlation & case management
- [ ] Graph/edges table + campaign clustering
- [ ] Case management view
- [ ] Alert feed
- [ ] **Seed 8-10 curated demo emails, 2-3 sharing infrastructure**, so the campaign-linking demo is reliable, not luck-dependent

### Phase 4 — Polish for demo
- [ ] Forensic PDF report export
- [ ] Risk score breakdown UI (radar/stacked bar)
- [ ] (Optional, high wow-factor) Chrome extension reading live Gmail headers, POSTing to the same `/analyze` endpoint
- [ ] Record a backup demo video in case live wifi/API calls fail on stage

---

## 14. Demo Script

1. Open with the problem: show a realistic BEC/phishing email that "looks fine" to a human eye
2. Upload it live → dashboard shows fraud score + *why* (SPF fail, spoofed domain, urgency language highlighted inline)
3. Click into the geo trace map → show the hop path and flagged VPN/hosting origin
4. Show the case view → this email is linked to 2 other flagged emails via shared infrastructure — **emphasize this explicitly, it's what separates you from a spam filter**
5. Export the forensic report PDF
6. (If built) show the Chrome extension flagging a live Gmail message
7. Close on privacy/chain-of-custody handling — AICTE Cyber Security Cell judges specifically value this

---

## 15. Honest Caveats to State Proactively (say these before judges ask)

- IP geolocation is approximate — city-level accuracy isn't guaranteed, VPN/CGNAT breaks it. Frame as "probable origin."
- A classifier trained on public datasets may not generalize to novel attack styles — mention a planned continuous-retraining pipeline as future work.
- Real inbox integration (Gmail API) needs OAuth scope review for production; fine for a demo with your own test account — call out the compliance path for real deployment.
- Chain-of-custody/evidentiary standards vary by jurisdiction — position the tool as "supports investigation," not as legal certification.

---

## 16. Reading List (10-15 min each, worth it for Q&A confidence)

- RFC 7208 (SPF), RFC 6376 (DKIM), RFC 7489 (DMARC)
- A recent (2022-2025) survey paper on "phishing email detection machine learning" (search IEEE Xplore/arXiv) — gives you a citable baseline-accuracy table
- MITRE ATT&CK — T1566 (Phishing) — vocabulary that cybersecurity-background judges recognize immediately
