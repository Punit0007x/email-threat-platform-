# Email Threat Intelligence Platform — Complete Technical Breakdown & Workflow

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EMAIL THREAT INTELLIGENCE PLATFORM                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────────────┐  │
│  │   Browser   │    │   Frontend       │    │   Backend API            │  │
│  │   Extension │◄───│   Dashboard      │◄───│   (FastAPI)              │  │
│  │   (Gmail)   │    │   (React 19/Vite)│    │   Port 8000              │  │
│  └──────┬──────┘    └────────┬─────────┘    └───────────┬──────────────┘  │
│         │                    │                          │                  │
│         │ .eml upload        │ REST API / WebSocket     │                  │
│         ▼                    ▼                          ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        ANALYSIS PIPELINE (21 Steps)                 │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  │
│  │  │  Parsing    │ │  Forensics  │ │   ML/AI     │ │  Scoring    │   │  │
│  │  │  & Extract  │ │  & Trace    │ │  Pipeline   │ │  & Fusion   │   │  │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │  │
│  │         │               │               │               │            │  │
│  │         └───────────────┼───────────────┼───────────────┘            │  │
│  │                         ▼               ▼                            │  │
│  │              ┌─────────────────────────────────┐                    │  │
│  │              │    FRAUD SCORE FUSION ENGINE    │                    │  │
│  │              │  (Weighted multi-signal fusion) │                    │  │
│  │              └─────────────────┬──────────────┘                    │  │
│  │                                ▼                                  │  │
│  │              ┌─────────────────────────────────┐                    │  │
│  │              │    PERSISTENCE & INTELLIGENCE   │                    │  │
│  │              │  • SQLite Case DB               │                    │  │
│  │              │  • ChromaDB Vector Store        │                    │  │
│  │              │  • Neo4j/NetworkX Attribution   │                    │  │
│  │              │  • Kafka Event Bus              │                    │  │
│  │              │  • Blockchain Notarization      │                    │  │
│  │              └─────────────────────────────────┘                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Backend API** | FastAPI 0.110, Uvicorn, Python 3.11+, Pydantic v2 |
| **Authentication** | JWT (python-jose), bcrypt (passlib), OAuth2 |
| **Rate Limiting** | SlowAPI |
| **Observability** | structlog (JSON), Prometheus Client, OpenTelemetry |
| **ML/AI** | scikit-learn 1.5 (TF-IDF + VotingClassifier), numpy, scipy, google-genai (Gemini) |
| **NLP/Vector** | sentence-transformers (all-MiniLM-L6-v2), ChromaDB |
| **Graph** | NetworkX (in-memory), Neo4j driver (production) |
| **Email Parsing** | stdlib `email`, beautifulsoup4, mail-parser |
| **DNS/Network** | dnspython, geoip2, maxminddb, python-whois |
| **Vision/OCR** | opencv-python-headless, pytesseract, pdf2image, pyzbar |
| **Blockchain** | web3.py (EVM compatible - currently mocked) |
| **Async/Queue** | confluent-kafka, celery, redis |
| **Database** | SQLite (cases), ChromaDB (vectors) |
| **Testing** | pytest, pytest-asyncio, httpx |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Framer Motion |
| **Visualization** | react-force-graph-2d, react-globe.gl, Leaflet, three.js |
| **Browser Extension** | Manifest V3, Chrome/Edge, Service Worker |

---

## Core Modules & Components

### 1. Backend API (`/app`)

| Module | File | Purpose |
|--------|------|---------|
| **Entry Point** | `app/main.py` | FastAPI app, lifespan, CORS, auth, metrics, health checks |
| **Config** | `app/core/config.py` | Pydantic Settings (env-based) |
| **Auth** | `app/core/auth.py` | JWT tokens, user management |
| **Logging** | `app/core/logging.py` | Structured JSON logging |
| **Metrics** | `app/core/metrics.py` | Prometheus counters/histograms |
| **Rate Limit** | `app/core/rate_limit.py` | SlowAPI integration |
| **Events** | `app/core/events.py` | Kafka event bus |

### 2. Parsers (`/app/parsers`)

| Module | Function |
|--------|----------|
| `email_parser.py` | `.eml` → `ParsedEmail` model; headers, body, attachments, URLs, OCR/QR |
| `auth_analysis.py` | SPF/DKIM/DMARC parsing, live DNS verification, domain alignment |
| `origin_trace.py` | Received-chain walking → true origin IP, trusted relay skipping |
| `geolocation.py` | IP → country/region/city/ISP/ASN; Tor/VPN/hosting flags |
| `dns_intel.py` | MX, TXT, SPF, DMARC, DKIM record queries |
| `whois_intel.py` | Domain age, registrar, privacy protection, risky registrar detection |
| `ip_reputation.py` | DNSBL blocklist, Tor exit, network context |
| `domain_recon.py` | Subdomain enumeration, suspicious subdomain detection |
| `history_intel.py` | Wayback Machine crawl for domain age/content volatility |
| `tech_fingerprint.py` | HTTP headers, TLS, WAF/CDN detection, phishing kit signatures |
| `dork_intel.py` | Google dork scanning for phishing pages, leaked creds |
| `infra_intel.py` | Infrastructure classification (hosting, CDN, corporate) |
| `origin_verdict.py` | Unified origin classification (legit/spoofed/compromised/anonymized) |
| `case_db.py` | SQLite persistence: cases, campaigns, alerts, IOC search |
| `advanced_network.py` | Hop latency analysis for triangulation |
| `advanced_vision.py` | OCR (Tesseract), QR code extraction (pyzbar), PDF vision |
| `attribution.py` | Threat actor attribution logic |
| `custody.py` | Chain-of-custody manifest generation (SHA-256, timestamps) |
| `unicode_evasion.py` | Zero-width char, homoglyph, CSS overlay detection |
| `stylometry.py` | Behavioral writing style analysis |

### 3. ML Pipeline (`/app/ml`)

| Module | Function |
|--------|----------|
| `pipeline.py` | Main orchestrator: Features → BEC → Synthetic → Spam → Threat Classifier → AI Forensics |
| `feature_extractor.py` | Structural metrics, manipulation vectors, CTA intent, entities, attachment risk |
| `bec_engine.py` | BEC detection: VIP impersonation, display-name spoofing, Reply-To hijack, behavioral triggers |
| `synthetic_detector.py` | LLM template phrases, burstiness analysis, type-token ratio |
| `threat_classifier.py` | TF-IDF + Ensemble (LogReg + RF) → 7-class + logit fusion with heuristics |
| `trained_model.py` | Singleton model loader, explainable token extraction |
| `train_model.py` | Training on `synthetic_dataset.json` (54,994 samples) |
| `spam_model.py` | Isolated Naive Bayes spam/ham classifier |
| `genai_analyzer.py` | Deterministic MITRE ATT&CK mapping + SOC actions; optional Gemini LLM enrichment |
| `graph_intel.py` | NetworkX attribution graph: incidents, IPs, domains, ASNs, campaigns |
| `vector_db.py` | ChromaDB semantic threat matching (fallback: TF-IDF cosine) |
| `adversarial_loop.py` | Adversarial training/robustness testing |

### 4. Scoring (`/app/scoring`)

| Module | Function |
|--------|----------|
| `fraud_score.py` | Weighted fusion of 20+ signals → 0-100 score + human-readable reasons |
| `text_signals.py` | Urgency, authority, link mismatch, shortener detection |
| `domain_check.py` | Lookalike/typosquatting detection (edit distance + homoglyph normalization) |
| `config.py` | Weight constants for all scoring factors |

### 5. Forensics (`/app/forensics`)

| Module | Function |
|--------|----------|
| `trace_pipeline.py` | End-to-end forensic trace: headers → geo → domain → attribution → logit fusion |
| `header_analyzer.py` | Deep header parsing, anomaly scoring (0-1) |
| `geo_intel.py` | GeoIP + Tor/VPN/hosting fingerprinting (MaxMind provider interface) |
| `domain_intel.py` | Domain risk scoring (age, lookalike, registrar) |
| `attribution_graph.py` | NetworkX/Neo4j graph clustering for campaign detection |
| `report_generator.py` | HTML forensic report rendering |
| `custody.py` | Cryptographic chain-of-custody, retention policies |
| `blockchain_notary.py` | Evidence notarization on EVM chain (SHA-256 anchor) |

### 6. Frontend Components (`/frontend/src/components/`)

| Component | Purpose |
|-----------|---------|
| `DashboardView.jsx` | Main layout, file upload, results orchestration |
| `LandingPage.jsx` | Hero, feature overview, quick start |
| `AuthPanel.jsx` | Login/token management |
| `HeaderPanel.jsx` | Email headers, authentication results, anomalies |
| `EmailBodyDissector.jsx` | Body text/HTML, URLs, attachments, OCR/QR results |
| `AIMLThreatPanel.jsx` | ML classification, BEC, synthetic, spam, explainable tokens |
| `FraudScorePanel.jsx` | 0-100 score gauge, risk level, reason breakdown |
| `GraphAttributionPanel.jsx` | NetworkX graph visualization (react-force-graph-2d) |
| `DeepOSINTPanel.jsx` | DNS, WHOIS, IP reputation, subdomains, Wayback, tech fingerprint, dorks |
| `RelayHopVisualizer.jsx` | Received chain hops with geolocation |
| `MapPanel.jsx` / `CyberGlobe.jsx` | Geographic origin mapping |
| `CaseHistoryPanel.jsx` | Case list, campaign clusters, search |
| `CustodyReportPanel.jsx` | Chain-of-custody, blockchain receipt |
| `AdvancedSOC.jsx` | MITRE ATT&CK TTPs, SOC playbook, remediation actions |
| `IOCSearchModal.jsx` | Indicator of Compromise search |
| `PlaybookModal.jsx` | Incident response playbooks |
| `ThreatRadarGraphic.jsx` / `ThreatWaveform.jsx` | Visual threat indicators |

---

## ML/AI Logic Deep Dive

### 1. Feature Extraction (`app/ml/feature_extractor.py`)

**Inputs**: Subject, plain body, HTML body, attachments, URLs

**Outputs**:
- **Structural Metrics**: char/word count, Shannon entropy, uppercase ratio, punctuation bursts, HTML cloaking risk
- **Manipulation Vectors** (4 categories, regex-based):
  - `urgency` — "urgent", "immediately", "act now", deadlines
  - `fear_intimidation` — "account suspended", "legal action", "arrest warrant"
  - `authority` — "CEO", "CFO", "HR", "IT helpdesk", "government agency"
  - `financial_greed` — "wire transfer", "invoice overdue", "lottery", "crypto"
  - `trust_secrecy` — "confidential", "don't tell anyone", "quick favor"
- **CTA Intent Analysis** (5 categories):
  - `credential_harvesting`, `financial_redirection`, `quishing_qr`, `malware_macro`, `remote_access`
- **Entities**: Crypto wallets (BTC), financial amounts, phone numbers, QR mentions
- **Attachment Risk**: Suspicious extensions (.exe, .scr, .zip, .iso, .docm, etc.)

### 2. BEC Engine (`app/ml/bec_engine.py`)

**Detection Logic** (score 0-100):
1. **VIP Title in Display Name/Subject** — Regex match against 12 executive roles (+25 pts)
2. **Display Name Spoofing via Free Webmail** — Corporate name + @gmail.com/yahoo.com/etc (+35 pts)
3. **Reply-To Hijack** — Reply-To domain ≠ From domain (+30 pts)
4. **Behavioral Triggers** (+25 each): Payroll diversion, Gift card scam, Vendor wire diversion, Conversational lure

### 3. Synthetic Content Detector (`app/ml/synthetic_detector.py`)

**Three Signals**:
1. **Formulaic Phrase Matching** — 10 common LLM templates — up to 50 pts
2. **Sentence Burstiness** — Coefficient of variation of sentence lengths; low variance = synthetic (≤0.35 → +25 pts)
3. **Type-Token Ratio** — Vocabulary diversity; moderate TTR (0.45-0.70) + formulaic → +15 pts

**Threshold**: Score ≥ 55 = "likely synthetic"

### 4. Threat Classifier (`app/ml/threat_classifier.py`) — **LOGIT FUSION ARCHITECTURE**

**Base Model** (`train_model.py`):
- **Pipeline**: TF-IDF (1-3 grams, 10K features, sublinear TF) → VotingClassifier (LogReg C=5 + RF 150 trees, soft voting)
- **Training Data**: `synthetic_dataset.json` (54,994 samples across 7 classes)
- **Classes**: `clean`, `phishing_credential_harvesting`, `bec_executive_impersonation`, `invoice_payment_fraud`, `extortion_blackmail`, `malware_delivery`, `brand_impersonation`

**Heuristic Logit Adjustments**:
| Signal | Target Class | Logit Delta |
|--------|--------------|-------------|
| Credential CTA + Fear | phishing_credential_harvesting | +2.5 to +4.0 |
| BEC Score > 30 | bec_executive_impersonation | +1.0 to +4.0 |
| Financial CTA + Amounts | invoice_payment_fraud | +2.5 to +4.0 |
| Crypto wallets + Fear | extortion_blackmail | +3.5 to +5.5 |
| Suspicious attachments | malware_delivery | +3.5 to +5.5 |
| Domain lookalike/subdomain spoof | brand_impersonation | +4.5 |
| Auth fail (SPF/DKIM/DMARC) | brand_impersonation, phishing | +0.5 to +1.0 |
| Full auth pass (SPF+DKIM+DMARC) | clean | +2.0 |

**Output**: Probabilities for all 7 classes, primary threat, confidence, explainable tokens (top TF-IDF n-grams), multi-vector detection

### 5. AI Forensic Reasoner (`app/ml/genai_analyzer.py`)

**Deterministic Baseline (Always Runs)**:
- **MITRE ATT&CK Mapping** — Rule-based TTP assignment per threat class
- **SOC Remediation Actions** — Concrete steps per threat type

**Optional LLM Enrichment** (if `GEMINI_API_KEY` set):
- Prompt: Principal Cyber Threat Intelligence Analyst persona
- Input: Email summary, threat class, BEC indicators, manipulation vectors, URLs, attachments
- Output: Forensic summary, attacker intent, recommended SOC actions (JSON)

### 6. Vector Threat DB (`app/ml/vector_db.py`)

- **Primary**: ChromaDB + `all-MiniLM-L6-v2` embeddings (384-dim)
- **Fallback**: In-memory TF-IDF + cosine similarity
- **Operations**: `store_email(id, text, metadata)`, `find_similar_threats(text, n=3)`

---

## Forensic Pipeline Details

### Header Analysis (`app/forensics/header_analyzer.py`)

**Parses**:
- Received chain → Hop objects (index, from_host, from_ip, by_host, protocol, timestamp, private IP flag)
- Authentication-Results → SPF/DKIM/DMARC status
- From, Return-Path, Reply-To, Message-ID domains

**Anomaly Detection** (score 0-1):
1. Return-Path ≠ From domain (+0.25)
2. Reply-To ≠ From domain (+0.30)
3. Message-ID domain unrelated (+0.15)
4. Timestamp ordering violations (+0.35)
5. SPF/DKIM/DMARC fail (+0.25-0.30 each)
6. No SPF/DKIM at all (+0.15)
7. No Received headers (+0.20)

**Origin IP Extraction**: Walk chain from earliest hop; skip private IPs + trusted relays; first public untrusted IP = origin

### Geo Intelligence (`app/forensics/geo_intel.py`)

**Provider Interface**: `GeoProvider.lookup(ip) → GeoResult`
- **Production**: MaxMind GeoLite2 City/ASN MMDB (`MaxMindProvider`)
- **Development**: `StaticSeedProvider` with hardcoded examples

**Risk Flags**:
- Tor exit node (refreshed from Tor Project bulk list)
- Known VPN ASN org (NordVPN, ExpressVPN, etc.)
- Hosting provider CIDR (Linode, DigitalOcean, AWS)

**Risk Contribution**: Tor (0.5), VPN (0.3), Hosting (0.15) — feeds logit fusion

### Domain Intelligence (`app/forensics/domain_intel.py`)

- Domain age (WHOIS + Wayback cross-check)
- Lookalike detection (edit distance to known brands + homoglyph normalization)
- Registrar risk scoring
- Privacy protection flag

### Attribution Graph (`app/forensics/attribution_graph.py`)

**Graph Model** (NetworkX/Neo4j):
- **Nodes**: Incident, IP, Domain, ASN, Campaign
- **Edges**: Incident→IP (originated_from), Incident→Domain (sent_from), IP→ASN (belongs_to), Incident→Campaign (part_of)
- **Campaign Clustering**: Connected components sharing infrastructure

### Trace Pipeline Fusion (`app/forensics/trace_pipeline.py::fuse_with_ml_logits`)

| Forensic Signal | ML Class Bump | Clean Penalty |
|-----------------|---------------|---------------|
| Tor/VPN origin | Phishing +0.15 | -0.15 |
| Domain age < 30d | Brand Impersonation +0.15, Invoice +0.10 | -0.15 |
| Domain lookalike | Brand Impersonation +0.25 | -0.25 |
| Related incidents (campaign) | BEC +0.10, Invoice +0.10 | -0.20 |

---

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Username/password → access + refresh tokens |
| POST | `/api/auth/refresh` | Refresh token → new access + refresh |
| GET | `/api/auth/me` | Current user info |

### Email Analysis
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/parse` | Upload .eml → full forensic + ML analysis |
| POST | `/api/report/html` | JSON → printable HTML forensic report |

### Case Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cases` | List recent investigated cases |
| GET | `/api/campaigns` | Aggregated threat campaigns |
| GET | `/api/alerts` | High-risk alerts (with `?limit=`) |
| GET | `/api/alerts/stats` | Alert statistics |
| POST/GET | `/api/alerts/webhook` | Configure/get webhook for alerts |
| GET/POST | `/api/retention/config` | Retention policy config |
| POST | `/api/retention/purge` | Manual retention purge |

### Threat Intelligence
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/indicators/{value}` | IOC lookup (IP, domain, email, SHA256, keyword) |

### Monitoring
| Method | Path | Description |
|--------|------|-------------|
| GET | `/metrics` | Prometheus metrics |
| GET | `/health` | Liveness probe |
| GET | `/health/ready` | Readiness probe (DB, Vector DB, Kafka) |

---

## Configuration & Deployment

### Environment Variables (`.env`)
```bash
# App
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=["http://localhost:5173", "http://localhost:5174"]

# Auth
JWT_SECRET_KEY=<secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# Intel Feeds
INTEL_FEED_REFRESH_INTERVAL_SECONDS=3600
TRUSTED_RELAYS=["google.com", "outlook.com", "protection.outlook.com", "amazonses.com", "mimecast.com"]

# AI/LLM
GEMINI_API_KEY=<optional>

# Blockchain
BLOCKCHAIN_RPC_URL=<EVM RPC>
BLOCKCHAIN_PRIVATE_KEY=<notary wallet>
BLOCKCHAIN_CONTRACT_ADDRESS=<notary contract>

# Vector DB
CHROMA_PERSIST_DIR=./data/chroma_db

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>

# MaxMind GeoIP
MAXMIND_DB_PATH=./data/GeoLite2-City.mmdb
MAXMIND_ASN_DB_PATH=./data/GeoLite2-ASN.mmdb
```

### Docker Compose Services
- `backend` (FastAPI)
- `frontend` (Vite dev server)
- `redis` (Celery broker)
- `kafka` (event bus)
- `neo4j` (attribution graph)
- `chromadb` (vector store)

---

## Complete Workflow: Start to End

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE DATA FLOW (21 STEPS)                        │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: EMAIL INGESTION
────────────────────────
User uploads .eml file via:
  • Frontend Dashboard (drag & drop)
  • Browser Extension (Gmail integration)
  • API directly (POST /api/parse)

STEP 2: CRYPTOGRAPHIC CHAIN-OF-CUSTODY
───────────────────────────────────────
generate_evidence_custody(contents, filename)
  → SHA-256 hash of raw .eml
  → evidence_id (EV-<hash_prefix>)
  → ingestion_timestamp_utc
  → custody_seal (SEAL-<hash>)
  → Stores in SQLite with integrity_verified=true

STEP 3: EMAIL PARSING
─────────────────────
parse_eml_file(tmp_path) → ParsedEmail model:
  • Headers (From, To, Subject, Date, Message-ID, Return-Path, Reply-To, Received[])
  • Body (plain text + HTML)
  • Attachments (filename, content-type, size, SHA-256)
  • URLs (extracted from body + attachments)
  • OCR text (from images/PDFs via Tesseract)
  • QR codes (extracted via pyzbar)
  • Raw headers dict

STEP 4: BLOCKCHAIN NOTARIZATION
───────────────────────────────
BlockchainNotary.notarize_evidence(tmp_path, parsed_email)
  → Hashes evidence + metadata
  → Submits to EVM chain (web3.py)
  → Returns: transaction_hash, blockchain_network, status="NOTARIZED_ON_LEDGER"
  → Currently mocked as "Local-Ethereum-Notary"

STEP 5: AUTHENTICATION ANALYSIS
───────────────────────────────
analyze_auth(auth_header, from_header, return_path_header)
  • Parses Authentication-Results header
  • SPF/DKIM/DMARC status (pass/fail/none)
  • Live DNS verification of records
  • Domain alignment check (From vs SPF/DKIM domains)
  • Returns: spf, dkim, dmarc, alignment, overall_score

STEP 6: ORIGIN TRACING
──────────────────────
trace_origin(received_chain, raw_headers, from_address, return_path)
  • Reverses Received chain (newest-first → chronological)
  • Walks hops from earliest → latest
  • Skips private IPs (10.x, 192.168.x, 172.16-31.x)
  • Skips trusted relays (google.com, outlook.com, amazonses.com, etc.)
  • First public untrusted IP = true origin
  • Hop objects: index, from_host, from_ip, by_host, protocol, timestamp, private_flag
  • Anomaly detection: timestamp violations, forged hops

STEP 7: LATENCY TRIANGULATION
─────────────────────────────
analyze_hop_latency(received_chain)
  • Parses timestamps from each hop
  • Calculates inter-hop latency
  • Speed-of-light constraint check
  • Flags impossible geographic transitions (e.g., Moscow → NYC in 5ms)
  • Returns: anomalies, physical_impossibility_flags

STEP 8: GEOLOCATION (PARALLEL PER HOP)
──────────────────────────────────────
geolocate_ip(hop["ip"]) for each hop + best_guess_ip
  • MaxMind GeoLite2 City + ASN MMDB
  • Returns: country, region, city, coordinates, ISP, ASN
  • Risk flags: Tor exit, VPN, hosting provider
  • Risk contribution: Tor=0.5, VPN=0.3, Hosting=0.15

STEP 9: PARALLEL OSINT & RECONNAISSANCE (8-thread ThreadPoolExecutor)
───────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────────┐
│ ALL RUN IN PARALLEL (max_workers=8)                                 │
├─────────────────────────────────────────────────────────────────────┤
│ DNS Intel        │ query_domain_dns │ MX, TXT, SPF, DMARC, DKIM     │
│ WHOIS Intel      │ query_whois_intel│ Domain age, registrar, privacy│
│ Infra Intel      │ analyze_infrastructure│ IP classification        │
│ IP Reputation    │ query_ip_reputation│ DNSBL, Tor, abuse scores     │
│ IP Network Ctx   │ expand_ip_network│ CIDR, ASN peers, hosting      │
│ Domain Recon     │ enumerate_subdomains│ Subdomain discovery        │
│ History Intel    │ crawl_wayback_history│ Domain age/content changes│
│ Tech Fingerprint │ fingerprint_technology│ HTTP, TLS, WAF, phishing kits│
│ Dork Intel       │ run_dork_scan    │ Google dorks for phishing     │
└─────────────────────────────────────────────────────────────────────┘

STEP 10: ORIGIN VERDICT CLASSIFICATION
──────────────────────────────────────
classify_origin_verdict(auth_analysis, infra_intel, ip_reputation, trace_results, domain_check, whois_intel)
  → Unified classification: LEGITIMATE / SPOOFED / COMPROMISED / ANONYMIZED
  → Confidence score + evidence summary

STEP 11: HEURISTIC & LEXICAL SIGNALS
────────────────────────────────────
analyze_text_signals(subject, body_plain, body_html, urls)
  • Urgency phrases density
  • Authority impersonation keywords
  • Link text vs href mismatch
  • URL shortener detection
  • Suspicious TLDs, IP-based URLs

check_domain_lookalike(from_domain)
  • Levenshtein edit distance to known brands
  • Homoglyph normalization (0→o, rn→m, vv→w, @→a, etc.)
  • Typosquatting detection

STEP 12: AI/ML THREAT CLASSIFICATION PIPELINE
─────────────────────────────────────────────
analyze_email_ai_ml(...) → 6 stages:

  12a. FEATURE EXTRACTION
      extract_advanced_features() → structural, manipulation vectors, CTA intent, entities, attachment risk

  12b. BEC ENGINE
      analyze_bec_threat() → VIP spoofing, display-name mismatch, Reply-To hijack, behavioral triggers
      → bec_confidence_score (0-100), risk level, indicators, matched scenarios

  12c. SYNTHETIC DETECTOR
      detect_synthetic_content() → formulaic phrases, burstiness, type-token ratio
      → score (0-100), is_likely_synthetic boolean

  12d. SPAM MODEL
      predict_spam() → Naive Bayes on TF-IDF
      → spam_probability, is_spam (>0.85)

  12e. THREAT CLASSIFIER (LOGIT FUSION)
      classify_email_threat() → 
        • Base ML: TF-IDF + VotingClassifier → 7-class probabilities
        • Heuristic logit adjustments (see table above)
        → primary_threat, confidence, explainable_tokens, multi_vector

  12f. AI FORENSIC REASONER
      perform_ai_forensic_reasoning() →
        • Deterministic: MITRE ATT&CK TTPs + SOC remediation actions
        • Optional (Gemini): Forensic summary, attacker intent, enriched actions

STEP 13: SEMANTIC VECTOR MATCHING
─────────────────────────────────
vector_db.find_similar_threats(full_text)
  • full_text = subject + body_plain + ocr_text
  • ChromaDB similarity search (all-MiniLM-L6-v2, 384-dim)
  • Fallback: TF-IDF cosine similarity
  → Top 3 similar historical threats with confidence scores

STEP 14: THREAT INTELLIGENCE CORRELATION
────────────────────────────────────────
_check_historical_correlations(from_domain, best_guess_ip, from_address)
  • Queries SQLite case DB for matching IOCs
  • Cross-references: domain, IP, sender email
  → Historical cases linked, campaign membership

STEP 15: FRAUD SCORING (FUSION ENGINE)
──────────────────────────────────────
calculate_fraud_score(...) → 0-100 score + risk_level + reasons[]

Weighted fusion of 20+ signals:
  • NLP/ML classification confidence
  • Authentication failures (SPF/DKIM/DMARC)
  • Origin anomalies (VPN/Tor/hosting/geo-mismatch)
  • Domain intelligence (age, lookalike, registrar)
  • Threat intel hits (AbuseIPDB, VirusTotal)
  • Attribution/campaign linkage
  • Text manipulation vectors
  • BEC confidence
  • Synthetic content score

Output: score (0-100), risk_level (Low/Medium/High/Critical), reasons[] (human-readable)

STEP 16: GRAPH-BASED ATTRIBUTION
────────────────────────────────
build_forensic_attribution_graph(email_data, trace_results, ai_ml_results, dns_intel)
  • NetworkX graph: Incident nodes + Infrastructure nodes (IP, Domain, ASN)
  • Edges: originated_from, sent_from, belongs_to, part_of
  • Campaign discovery = connected components
  • Attribution confidence = weighted shared edges (IP=1.0, Domain=0.75, Reply-To=0.5)
  → Graph JSON for visualization, campaign_id

STEP 17: ADVANCED FORENSIC TRACING (PHASE 2)
────────────────────────────────────────────
run_forensic_trace(incident_id, raw_email, known_brand_domains, tenant_id)
  • Header analysis → anomaly_score
  • Geo profile → risk_contribution
  • Domain analysis → risk_contribution, lookalike detection
  • Attribution graph → related_incidents, campaign clustering
  • origin_risk_score = 0.45×header + 0.35×domain + 0.20×geo
  • fuse_with_ml_logits() → adjusts ML probabilities with forensic signals

STEP 18: PERSISTENCE & EVENTING
────────────────────────────────
save_incident_case(response_data) → SQLite
  • Stores: case_id, evidence_id, timestamp, from_address, subject, primary_threat, fraud_score, campaign_id, raw_json

vector_db.store_email(campaign_id, full_text, metadata) → ChromaDB

event_bus.publish_email_ingested(campaign_id, response_data) → Kafka
  • Topics: email-ingestion-events, high-risk-alerts
  • Enables async microservices (ScamBaiter, enrichment, notification)

create_alert(response_data, fraud_assessment) → if score ≥ 70
  • Alert stored in SQLite with webhook notification

STEP 19: RESPONSE ASSEMBLY
──────────────────────────
Unified JSON response with ALL analysis results:
  • custody, blockchain_receipt, semantic_matches
  • dns_intel, whois_intel, ip_reputation, ip_network_context
  • domain_recon, history_intel, tech_fingerprint, dork_intel
  • threat_correlations, origin_verdict, infra_intel
  • auth_analysis, trace, text_signals, domain_check
  • ai_ml_analysis (all 6 substages), attribution_graph
  • fraud_assessment, advanced_forensics, campaign_id, alert_id

STEP 20: FRONTEND RENDERING
───────────────────────────
DashboardView.jsx orchestrates 17+ panels:
  1. HeaderPanel → authentication badges, anomalies
  2. EmailBodyDissector → body, URLs, attachments, OCR/QR
  3. AIMLThreatPanel → 7-class probs, BEC, synthetic, explainable tokens
  4. FraudScorePanel → gauge, risk level, reason breakdown
  5. RelayHopVisualizer → hop chain with geo flags
  6. MapPanel/CyberGlobe → geographic visualization
  7. DeepOSINTPanel → all OSINT results
  8. GraphAttributionPanel → interactive force-directed graph
  9. AdvancedSOC → MITRE TTPs, SOC playbooks
  10. CustodyReportPanel → chain-of-custody, blockchain receipt
  11. CaseHistoryPanel → historical cases, campaigns
  12. IOCSearchModal → cross-case IOC lookup
  13. PlaybookModal → incident response procedures
  14. ThreatRadarGraphic/ThreatWaveform → visual indicators
  15. CyberBackground → ambient visualization

STEP 21: EXPORT & ACTIONS
─────────────────────────
  • HTML Forensic Report (/api/report/html) → printable, court-ready
  • STIX Export (/api/stix_export) → threat intel sharing
  • Alert webhooks → SIEM/SOAR integration
  • ScamBaiter (async via Kafka) → active defense for high-confidence BEC
  • Retention policies → PII masking, auto-purge
```

---

## Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Logit Fusion Over Pure ML** | Heuristic protocol/forensic signals adjust ML logits before softmax — explainable, robust to adversarial examples |
| 2 | **Deterministic Baseline + Optional LLM** | Core forensic reasoning runs locally (zero latency, zero cost, auditable); Gemini enrichment is opt-in |
| 3 | **Provider Interfaces** | GeoIP, vector DB, blockchain all use swappable provider patterns for testing/production parity |
| 4 | **Chain-of-Custody First** | Evidence hashing and notarization happen before any analysis — legal admissibility |
| 5 | **Campaign-Aware** | Attribution graph clusters incidents by shared infrastructure (IP, domain, ASN) |
| 6 | **Defensive Parsing** | All header/email parsing is regex-based with graceful degradation |
| 7 | **Explainability by Default** | Every classification includes top predictive n-grams, matched phrases, MITRE TTPs |

---

## Running the Platform

```bash
# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.ml.train_model          # Train ML model (first time only)
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev

# Extension
# Load /extension as unpacked extension in Chrome/Edge

# Docker (full stack)
docker-compose up -d
```

---

## Testing

```bash
# All tests
pytest test_all.py -v

# Specific modules
pytest test_ml_layer.py -v      # ML pipeline
pytest test_parser.py -v        # Email parsing
pytest test_fraud.py -v         # Fraud scoring
pytest test_full_platform.py -v # End-to-end
pytest tests/test_forensics.py -v # Forensic pipeline
```

---

## Extending the Platform

| Task | Steps |
|------|-------|
| **Add New Threat Class** | 1. Add to `THREAT_CATEGORIES` in `threat_classifier.py` 2. Add samples to `synthetic_dataset.json` 3. Add MITRE TTP mapping in `genai_analyzer.py` 4. Add SOC actions 5. Retrain |
| **Add New Parser** | 1. Create `app/parsers/new_parser.py` 2. Import in `analyze.py` (parallel executor) 3. Add to response dict 4. Add fraud score weights in `scoring/config.py` and `fraud_score.py` |
| **Add New Geo Provider** | 1. Implement `GeoProvider` protocol in `geo_intel.py` 2. Update `build_origin_profile` 3. Configure via env var |

---

This platform is a **production-grade email forensic intelligence system** combining deterministic protocol analysis, ML/AI classification, graph-based attribution, cryptographic evidence handling, and active defense — all orchestrated through a parallel, event-driven pipeline with comprehensive observability.