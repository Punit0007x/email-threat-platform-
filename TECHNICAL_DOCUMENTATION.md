# Email Threat Intelligence & Forensic Platform — Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Core Components](#core-components)
5. [ML/AI Logic Deep Dive](#mlai-logic-deep-dive)
6. [Forensic Pipeline](#forensic-pipeline)
7. [API Endpoints](#api-endpoints)
8. [Frontend Dashboard](#frontend-dashboard)
9. [Browser Extension](#browser-extension)
10. [Data Flow](#data-flow)
11. [Configuration & Deployment](#configuration--deployment)

---

## Project Overview

**Email Threat Intelligence Platform** is an enterprise-grade email forensics and threat classification system that combines:

- **Protocol-level header analysis** (SPF/DKIM/DMARC, Received chain tracing)
- **AI/ML multi-class threat classification** (7 threat categories)
- **BEC (Business Email Compromise) specialized detection**
- **Synthetic/LLM-generated content detection**
- **Graph-based infrastructure attribution**
- **Cryptographic chain-of-custody with blockchain notarization**
- **Semantic vector threat matching**
- **Real-time OSINT reconnaissance**
- **SOC-ready remediation playbooks with MITRE ATT&CK mapping**

The platform consists of three main deployable components:
1. **Backend API** (FastAPI, Python) — Port 8000
2. **Frontend Dashboard** (React 19 + Vite + Tailwind) — Port 5173
3. **Browser Extension** (Manifest V3, Gmail integration)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EMAIL THREAT PLATFORM ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────────────┐  │
│  │   Browser   │    │   Frontend       │    │   Backend API            │  │
│  │   Extension │◄───│   Dashboard      │◄───│   (FastAPI)              │  │
│  │   (Gmail)   │    │   (React/Vite)   │    │                          │  │
│  └──────┬──────┘    └────────┬─────────┘    └───────────┬──────────────┘  │
│         │                    │                          │                  │
│         │ .eml upload        │ REST API / WebSocket     │                  │
│         ▼                    ▼                          ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        ANALYSIS PIPELINE                            │  │
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
│  │              │  • Neo4j Attribution Graph      │                    │  │
│  │              │  • Kafka Event Bus              │                    │  │
│  │              │  • Blockchain Notarization      │                    │  │
│  │              └─────────────────────────────────┘                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend (Python 3.11+)
| Category | Technologies |
|----------|--------------|
| **Web Framework** | FastAPI 0.110, Uvicorn |
| **Authentication** | python-jose (JWT), passlib (bcrypt), OAuth2 |
| **Rate Limiting** | slowapi |
| **Observability** | structlog, Prometheus Client, OpenTelemetry |
| **ML/AI** | scikit-learn 1.5, numpy, scipy, google-genai (Gemini) |
| **NLP/Vector** | sentence-transformers, chromadb |
| **Graph** | networkx, neo4j driver |
| **Email Parsing** | stdlib `email`, beautifulsoup4 |
| **DNS/Network** | dnspython, geoip2, maxminddb |
| **Vision/OCR** | opencv-python-headless, pytesseract, pdf2image, pyzbar |
| **Blockchain** | web3.py (EVM compatible) |
| **Async/Queue** | confluent-kafka, celery, redis |
| **Database** | SQLite (cases), asyncpg/SQLAlchemy (future), alembic |
| **Testing** | pytest, pytest-asyncio, httpx |

### Frontend (React 19)
| Category | Technologies |
|----------|--------------|
| **Framework** | React 19, Vite 8 |
| **Styling** | Tailwind CSS 4, clsx, tailwind-merge |
| **Animation** | Framer Motion |
| **Visualization** | react-force-graph-2d, react-globe.gl, leaflet/react-leaflet, three.js |
| **Icons** | lucide-react |
| **Linting** | oxlint |

### Browser Extension
| Category | Technologies |
|----------|--------------|
| **Platform** | Manifest V3, Chrome/Edge |
| **Content Scripts** | Gmail DOM extraction |
| **Background** | Service Worker |

---

## Core Components

### 1. Backend API (`/app`)

#### Entry Point: `app/main.py`
- FastAPI application with lifespan management
- CORS, rate limiting, authentication middleware
- Prometheus metrics endpoint (`/metrics`)
- Health checks (`/health`, `/health/ready`)
- JWT-based auth with access/refresh tokens
- Routers: `/api/parse`, `/api/report/html`, `/api/cases`, `/api/campaigns`, `/api/alerts`, `/api/indicators/{value}`

#### Core Modules (`/app/core`)
| File | Purpose |
|------|---------|
| `config.py` | Pydantic Settings management (env-based config) |
| `auth.py` | JWT token creation/validation, user management |
| `logging.py` | Structured JSON logging with structlog |
| `metrics.py` | Prometheus counters/histograms for all pipeline stages |
| `rate_limit.py` | SlowAPI integration with configurable limits |
| `events.py` | Kafka event bus for async microservices |

#### Parsers (`/app/parsers`)
| Module | Function |
|--------|----------|
| `email_parser.py` | `.eml` parsing → `ParsedEmail` model; extracts headers, body, attachments, URLs, OCR/QR from images/PDFs |
| `auth_analysis.py` | SPF/DKIM/DMARC parsing from `Authentication-Results`; live DNS verification; domain alignment check |
| `origin_trace.py` | Received-header chain walking → true origin IP; trusted relay skipping; time-travel anomaly detection |
| `geolocation.py` | IP → country/region/city/ISP/ASN; Tor/VPN/hosting flags |
| `dns_intel.py` | MX, TXT, SPF, DMARC, DKIM record queries |
| `whois_intel.py` | Domain age, registrar, privacy protection, risky registrar detection |
| `ip_reputation.py` | DNSBL blocklist checks, Tor exit detection, network context |
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

#### ML Pipeline (`/app/ml`)
| Module | Function |
|--------|----------|
| `pipeline.py` | Main orchestrator: features → BEC → Synthetic → Spam → Threat Classifier → AI Forensics |
| `feature_extractor.py` | Lexical/structural features, manipulation vectors, CTA intent, entities, attachment risk |
| `bec_engine.py` | BEC detection: VIP impersonation, display-name spoofing, Reply-To hijack, behavioral triggers |
| `synthetic_detector.py` | LLM template phrase matching, burstiness analysis, type-token ratio |
| `threat_classifier.py` | TF-IDF + Ensemble (LogReg + RF) → 7-class probabilities + logit fusion with heuristics |
| `trained_model.py` | Singleton model loader, explainable token extraction |
| `train_model.py` | Training pipeline on synthetic_dataset.json (54K samples) |
| `spam_model.py` | Isolated Naive Bayes spam/ham classifier |
| `genai_analyzer.py` | Deterministic MITRE ATT&CK mapping + SOC actions; optional Gemini LLM enrichment |
| `graph_intel.py` | NetworkX attribution graph: incidents, IPs, domains, ASNs, campaigns |
| `vector_db.py` | ChromaDB semantic threat matching (fallback: TF-IDF cosine similarity) |

#### Scoring (`/app/scoring`)
| Module | Function |
|--------|----------|
| `fraud_score.py` | Weighted fusion of 20+ signals → 0-100 score + human-readable reasons |
| `text_signals.py` | Urgency, authority, link mismatch, shortener detection |
| `domain_check.py` | Lookalike/typosquatting detection (edit distance) |
| `config.py` | Weight constants for all scoring factors |

#### Forensics (`/app/forensics`)
| Module | Function |
|--------|----------|
| `trace_pipeline.py` | End-to-end forensic trace: headers → geo → domain → attribution graph → logit fusion |
| `header_analyzer.py` | Deep header parsing, anomaly scoring (0-1) |
| `geo_intel.py` | GeoIP + Tor/VPN/hosting fingerprinting (MaxMind provider interface) |
| `domain_intel.py` | Domain risk scoring (age, lookalike, registrar) |
| `attribution_graph.py` | Neo4j/NetworkX graph clustering for campaign detection |
| `report_generator.py` | HTML forensic report rendering |
| `custody.py` | Cryptographic chain-of-custody, retention policies |
| `blockchain_notary.py` | Evidence notarization on EVM chain (SHA-256 anchor) |

---

## ML/AI Logic Deep Dive

### 1. Feature Extraction (`app/ml/feature_extractor.py`)

**Input**: Subject, plain body, HTML body, attachments, URLs

**Outputs**:
- **Structural Metrics**: char/word count, Shannon entropy, uppercase ratio, punctuation bursts, HTML cloaking risk
- **Manipulation Vectors** (4 categories, regex-based):
  - `urgency` — "urgent", "immediately", "act now", deadlines
  - `fear_intimidation` — "account suspended", "legal action", "arrest warrant"
  - `authority` — "CEO", "CFO", "HR", "IT helpdesk", "government agency"
  - `financial_greed` — "wire transfer", "invoice overdue", "lottery", "crypto"
  - `trust_secrecy` — "confidential", "don't tell anyone", "quick favor"
- **CTA Intent Analysis** (5 categories):
  - `credential_harvesting` — "verify login", "reset password"
  - `financial_redirection` — "update bank details", "process wire"
  - `quishing_qr` — "scan QR code"
  - `malware_macro` — "enable macros", "open attachment"
  - `remote_access` — "AnyDesk", "TeamViewer"
- **Entities**: Crypto wallets (BTC), financial amounts, phone numbers, QR mentions
- **Attachment Risk**: Suspicious extensions (.exe, .scr, .zip, .iso, .docm, etc.)

### 2. BEC Engine (`app/ml/bec_engine.py`)

**Detection Logic**:
1. **VIP Title in Display Name/Subject** — Regex match against 12 executive roles (+25 pts)
2. **Display Name Spoofing via Free Webmail** — Corporate name + @gmail.com/yahoo.com/etc (+35 pts)
3. **Reply-To Hijack** — Reply-To domain ≠ From domain (+30 pts)
4. **Behavioral Triggers** (4 scenarios, +25 each):
   - Payroll diversion
   - Gift card scam
   - Vendor wire diversion
   - Conversational lure ("are you at your desk")

**Output**: `bec_confidence_score` (0-100), risk level (None/Low/Medium/High), indicators, matched scenarios

### 3. Synthetic Content Detector (`app/ml/synthetic_detector.py`)

**Three Signals**:
1. **Formulaic Phrase Matching** — 10 common LLM templates ("I hope this email finds you well", "we appreciate your prompt attention") — up to 50 pts
2. **Sentence Burstiness** — Coefficient of variation of sentence lengths; low variance = synthetic (≤0.35 → +25 pts)
3. **Type-Token Ratio** — Vocabulary diversity; moderate TTR (0.45-0.70) + formulaic phrases → +15 pts

**Threshold**: Score ≥ 55 = "likely synthetic"

### 4. Threat Classifier (`app/ml/threat_classifier.py`)

**Architecture**: **Logit Fusion** — Base ML probabilities + Heuristic adjustments

**Base Model** (`app/ml/train_model.py`):
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

### 5. Spam Model (`app/ml/spam_model.py`)

- Isolated Naive Bayes (TF-IDF) trained on `spam.csv`
- Threshold: spam probability > 0.85 = "spam"

### 6. AI Forensic Reasoner (`app/ml/genai_analyzer.py`)

**Deterministic Baseline (Always Runs)**:
- **MITRE ATT&CK Mapping** — Rule-based TTP assignment per threat class:
  - Phishing → T1566.002 (Spearphishing Link), T1598.003
  - Malware → T1566.001 (Spearphishing Attachment)
  - BEC/Invoice → T1656 (Impersonation), T1534 (Financial Diversion)
  - Extortion → T1486 (Extortion)
  - Display-name mismatch → T1586.002 (Domain Spoofing)
- **SOC Remediation Actions** — Concrete steps per threat type (quarantine, blocklist, password reset, finance verification, sandbox submission)

**Optional LLM Enrichment** (if `GEMINI_API_KEY` set):
- Prompt: Principal Cyber Threat Intelligence Analyst persona
- Input: Email summary, threat class, BEC indicators, manipulation vectors, URLs, attachments
- Output: Forensic summary, attacker intent, recommended SOC actions (JSON)

### 7. Vector Threat DB (`app/ml/vector_db.py`)

- **Primary**: ChromaDB + `all-MiniLM-L6-v2` embeddings (384-dim)
- **Fallback**: In-memory TF-IDF + cosine similarity
- **Operations**: `store_email(id, text, metadata)`, `find_similar_threats(text, n=3)`
- **Use Case**: Detect same phishing template with different wording/URLs

---

## Forensic Pipeline

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

**Origin IP Extraction**: Walk chain from earliest hop; skip private IPs + trusted relays (configurable); first public untrusted IP = origin

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
- Lookalike detection (edit distance to known brands)
- Registrar risk scoring
- Privacy protection flag

### Attribution Graph (`app/forensics/attribution_graph.py`)

**Graph Model** (NetworkX/Neo4j):
- **Nodes**: Incident, IP, Domain, ASN, Campaign
- **Edges**: Incident→IP (originated_from), Incident→Domain (sent_from), IP→ASN (belongs_to), Incident→Campaign (part_of)
- **Campaign Clustering**: Connected components sharing infrastructure

### Trace Pipeline Fusion (`app/forensics/trace_pipeline.py::fuse_with_ml_logits`)

Same logit-fusion pattern as threat classifier:
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

## Frontend Dashboard

**Location**: `/frontend/src/`

**Main Components** (`/frontend/src/components/`):

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
| `MapPanel.jsx` / `CyberGlobe.jsx` | Geographic origin mapping (Leaflet/Globe.gl) |
| `CaseHistoryPanel.jsx` | Case list, campaign clusters, search |
| `CustodyReportPanel.jsx` | Chain-of-custody, blockchain receipt |
| `AdvancedSOC.jsx` | MITRE ATT&CK TTPs, SOC playbook, remediation actions |
| `IOCSearchModal.jsx` | Indicator of Compromise search across cases |
| `PlaybookModal.jsx` | Incident response playbooks |
| `ThreatRadarGraphic.jsx` / `ThreatWaveform.jsx` | Visual threat indicators |

**Services** (`/frontend/src/services/`):
- `api.js` — Axios wrapper with auth interceptors, token refresh

---

## Browser Extension

**Location**: `/extension/`

**Files**:
| File | Purpose |
|------|---------|
| `manifest.json` | Manifest V3 config (Gmail content script, background worker, popup) |
| `gmail_content.js` | Extracts email from Gmail DOM (message body, headers, attachments) |
| `gmail_inject.css` | Injection styles for Gmail UI |
| `background.js` | Service worker: API communication, notifications, downloads |
| `popup.html/js/css` | Extension popup UI (file upload, quick scan) |
| `extract_ik.js` | Injected script for Gmail DOM access |

**Flow**:
1. User opens email in Gmail
2. Content script extracts email data (headers, body, attachments)
3. Popup or context menu triggers analysis
4. Extension sends .eml to backend `/api/parse`
5. Results displayed in popup or side panel

---

## Data Flow

```
.eml FILE UPLOAD
       │
       ▼
┌──────────────────┐
│  Chain of Custody │  generate_evidence_custody() → SHA-256, timestamps
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Email Parsing    │  parse_eml_file() → ParsedEmail model
│  • Headers        │
│  • Body (text/HTML)│
│  • Attachments    │
│  • URLs           │
│  • OCR/QR (images, PDFs) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Blockchain       │  BlockchainNotary.notarize_evidence() → tx hash
│  Notarization     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Auth Analysis    │     │  Origin Trace    │  PARALLEL
│  • SPF/DKIM/DMARC │     │  • Received chain │
│  • Domain alignment│     │  • Trusted relays │
│  • Live DNS       │     │  • GeoIP + Tor/VPN│
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         ▼                        ▼
┌──────────────────────────────────────────┐
│       OSINT & RECONNAISSANCE (Parallel)  │
│  DNS • WHOIS • IP Reputation • Infra     │
│  Subdomains • Wayback • Tech Fingerprint │
│  Dorks • Network Context                 │
└─────────────────┬────────────────────────┘
                  │
                  ▼
┌──────────────────┐
│  Heuristic Signals│
│  • Text signals   │  analyze_text_signals()
│  • Domain check   │  check_domain_lookalike()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  AI/ML Pipeline   │  analyze_email_ai_ml()
│  1. Features      │
│  2. BEC Engine    │
│  3. Synthetic     │
│  4. Spam Model    │
│  5. Threat Class. │
│  6. AI Forensics  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Semantic Match   │  vector_db.find_similar_threats()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Threat Correlate │  _check_historical_correlations()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Fraud Scoring    │  calculate_fraud_score() → 0-100 + reasons
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Attribution Graph│  build_forensic_attribution_graph()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Persistence      │  save_incident_case() → SQLite
│  • Case DB        │
│  • Vector DB      │
│  • Kafka Event    │
│  • Alert Gen      │
└────────┬─────────┘
         │
         ▼
    JSON RESPONSE
```

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

### Docker Compose
```yaml
# docker-compose.yml includes:
# - backend (FastAPI)
# - frontend (Vite dev server)
# - redis (Celery broker)
# - kafka (event bus)
# - neo4j (attribution graph)
# - chromadb (vector store)
```

### Running Locally
```bash
# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.ml.train_model  # Train ML model first
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev

# Extension
# Load /extension as unpacked extension in Chrome/Edge
```

### Model Training
```bash
# Main threat classifier (7-class)
python -m app.ml.train_model

# Spam model (binary)
python -m app.ml.train_spam_model
```

---

## Key Design Decisions

1. **Logit Fusion Over Pure ML** — Heuristic protocol/forensic signals adjust ML logits before softmax, making the system explainable and robust to adversarial examples.

2. **Deterministic Baseline + Optional LLM** — Core forensic reasoning runs locally (zero latency, zero cost, auditable); Gemini enrichment is opt-in.

3. **Provider Interfaces** — GeoIP, vector DB, blockchain all use swappable provider patterns for testing/production parity.

4. **Chain-of-Custody First** — Evidence hashing and notarization happen before any analysis, ensuring legal admissibility.

5. **Campaign-Aware** — Attribution graph clusters incidents by shared infrastructure (IP, domain, ASN), enabling campaign-level response.

6. **Defensive Parsing** — All header/email parsing is regex-based with graceful degradation; never crashes on malformed input.

7. **Explainability by Default** — Every classification includes top predictive n-grams, matched manipulation phrases, and MITRE TTPs.

---

## File Structure Summary

```
email_threat_platform/
├── app/
│   ├── main.py                    # FastAPI entry point
│   ├── core/                      # Config, auth, logging, metrics, rate limit, events
│   ├── api/                       # Routers: analyze.py, advanced_soc.py
│   ├── parsers/                   # 16 parser modules
│   ├── ml/                        # 10 ML modules + models/ + synthetic_dataset.json
│   ├── scoring/                   # Fraud score fusion, text signals, domain check
│   ├── forensics/                 # 8 forensics modules
│   ├── models/                    # Pydantic models (email.py)
│   └── microservices/             # (Future) async workers
├── frontend/
│   └── src/
│       ├── components/            # 22 React components
│       ├── services/              # API client
│       └── App.jsx, main.jsx
├── extension/                     # Chrome/Edge Manifest V3 extension
├── data/                          # ChromaDB, GeoIP DBs, SQLite cases
├── requirements.txt               # Python deps
├── docker-compose.yml
├── Dockerfile.backend / .frontend
└── *.md (README, architecture, playbook)
```

---

## Testing

```bash
# Run all tests
pytest test_all.py -v

# Specific modules
pytest test_ml_layer.py -v
pytest test_parser.py -v
pytest test_fraud.py -v
pytest test_full_platform.py -v
```

---

## Extending the Platform

### Adding a New Threat Class
1. Add to `THREAT_CATEGORIES` in `threat_classifier.py`
2. Add training samples to `synthetic_dataset.json`
3. Add MITRE TTP mapping in `genai_analyzer.py::get_mitre_ttps`
4. Add SOC actions in `genai_analyzer.py::generate_soc_remediations`
5. Retrain: `python -m app.ml.train_model`

### Adding a New Parser
1. Create `app/parsers/new_parser.py` with `parse_*` function
2. Import and call in `app/api/analyze.py` (parallel executor)
3. Add results to response dict
4. Add fraud score weights in `app/scoring/config.py` and logic in `fraud_score.py`

### Adding a New Geo Provider
1. Implement `GeoProvider` protocol in `geo_intel.py`
2. Update `build_origin_profile` to use new provider
3. Configure via environment variable

---

## Security Considerations

- **No secrets in code** — All via environment variables
- **JWT with short expiry** — 30min access, 7d refresh
- **Rate limiting** — Per-IP and per-user
- **Input validation** — Pydantic models on all endpoints
- **Chain-of-custody** — SHA-256 of raw .eml stored before processing
- **PII masking** — Configurable retention policy with PII redaction
- **Audit logging** — Structured JSON logs for all analysis operations

---

## Performance Notes

- **Parallel OSINT** — 8-thread ThreadPoolExecutor for DNS, WHOIS, IP rep, subdomains, Wayback, tech fingerprint, dorks
- **Model caching** — Singleton pattern for TF-IDF pipeline and spam model
- **Vector DB fallback** — In-memory TF-IDF if ChromaDB unavailable
- **Async lifespan** — Background feed refresh (Tor exits) via asyncio task
- **Streaming responses** — HTML report generation streams large outputs

---

## License & Credits

Internal enterprise platform. Key open-source dependencies acknowledged in respective license files.