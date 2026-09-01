# eRakshak — Deep Technical Documentation

> **Version:** 1.0.0 · **Updated:** 2026-09-01 · **Scope:** Full-stack forensic architecture, module reference, production deployment, security model, and operations runbook.

**Linked documents:** [Repository README](../README.md) · [Technical Breakdown](TECHNICAL_BREAKDOWN.md) · [Technical Documentation](TECHNICAL_DOCUMENTATION.md) · [Platform Playbook](Platform_Playbook.md) · [Architecture Blueprint](god_level_architecture.md)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository Topology](#2-repository-topology)
3. [Backend Architecture](#3-backend-architecture)
   - 3.1 Application Bootstrap (`app/main.py`)
   - 3.2 Configuration Layer (`app/core/config.py`)
   - 3.3 The `/api/parse` Forensic Pipeline (13-stage)
   - 3.4 Parsers & OSINT Intel Stack
   - 3.5 ML & GenAI Layer
   - 3.6 Scoring Engine
   - 3.7 Forensics & Chain of Custody
   - 3.8 Persistence & Case Database
   - 3.9 Event Bus & Messaging
   - 3.10 Observability
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Browser Extension Architecture](#6-browser-extension-architecture)
7. [Production Deployment](#7-production-deployment)
8. [CI/CD & GitOps](#8-cicd--gitops)
9. [Security Hardening](#9-security-hardening)
10. [API Reference](#10-api-reference)
11. [Configuration Reference](#11-configuration-reference)
12. [Operations Runbook](#12-operations-runbook)
13. [Known Limitations & Roadmap](#13-known-limitations--roadmap)
14. [Appendix A — Full Deployment Manifests](#appendix-a--full-deployment-manifests)
15. [Appendix B — SQLite Schema](#appendix-b--sqlite-schema)

---

## 1. System Overview

eRakshak is a **modular, stateless-REST, stateful-flow** email forensic intelligence platform. It ingests raw `message/rfc822` (`.eml`) artifacts — from the React SOC console, the Chrome MV3 extension, or direct API consumers — and executes a **synchronous, multi-stage forensic pipeline** that produces a single unified `ScanResult` JSON envelope.

The pipeline fuses:

* **Structural parsing** — MIME tree decoding, header reconstruction, attachment/URL discovery.
* **Sender authentication forensics** — SPF / DKIM / DMARC / ARC validation and alignment.
* **Relay tracing & origin attribution** — RFC 822 `Received` hop traversal, latency triangulation, MaxMind GeoLite2 geolocation, ASN / ISP enrichment.
* **Parallel OSINT reconnaissance** — live DNS, WHOIS, subdomain enumeration, Wayback history, technology fingerprinting, Google dorking, IP reputation (8-way `ThreadPoolExecutor`).
* **Machine learning classification** — feature extraction + multi-class `LinearSVC` + calibrated probabilities, BEC engine, and Gemini GenAI semantic deep-audit.
* **Heuristic + lexical signal analysis** — typosquatting/lookalike detection, Unicode evasion, stylometry, embedded QR/OCR extraction.
* **Fraud scoring** — a weighted multi-vector score normalized to `0–100` with `Risk: Low/Medium/High`.
* **Graph attribution** — NetworkX multi-graph workflow (`origin` ⇄ `infra` ⇄ `attacker` ⇄ `campaign` nodes) exportable for 3D rendering.
* **Chain of custody** — SHA-256 tamper-evident manifest plus a blockchain (PoW) notarization receipt.
* **Campaign intelligence** — deterministic campaign clustering, cross-case IOC correlation, alerts + webhooks, and a retention policy engine.

Production topology is a **three-container Docker stack on AWS Lightsail (1 GB RAM, 4 GB swap)** behind a **Caddy** TLS reverse proxy with a **DuckDNS** subdomain, plus a **Vercel**-hosted SPA that auto-deploys from GitHub `main`. Full detail in [§7](#7-production-deployment).

---

## 2. Repository Topology

```text
.
├── app/                          # FastAPI backend package
│   ├── __init__.py
│   ├── main.py                   # Application bootstrap, auth routes, SPA mount
│   ├── api/                      # HTTP routers
│   │   ├── __init__.py
│   │   ├── analyze.py            # /api/parse 13-stage pipeline + SOC routes
│   │   ├── advanced_soc.py       # /api/sandbox/screenshot, /api/takedown/generate, /api/chat
│   │   └── stix_export.py        # STIX 2.1 export surface
│   ├── core/                     # Cross-cutting infrastructure
│   │   ├── config.py             # pydantic-settings + Docker secrets reader
│   │   ├── auth.py               # JWT, bcrypt, Google OIDC server-side verification
│   │   ├── logging.py            # structlog JSON pipeline
│   │   ├── metrics.py            # Prometheus counters/histograms
│   │   ├── rate_limit.py         # slowapi limiter
│   │   └── events.py             # async event bus + Kafka publisher
│   ├── parsers/                  # Domain intelligence modules
│   │   ├── email_parser.py       # MIME decoding → ParsedEmail model
│   │   ├── auth_analysis.py      # SPF/DKIM/DMARC/ARC inspection
│   │   ├── origin_trace.py       # Received-chain traversal engine
│   │   ├── geolocation.py        # GeoLite2 MMDB lookup + ASN
│   │   ├── dns_intel.py / whois_intel.py / domain_recon.py
│   │   ├── ip_reputation.py / infra_intel.py / history_intel.py
│   │   ├── tech_fingerprint.py / dork_intel.py / origin_verdict.py
│   │   ├── url_analyzer.py       # per-URL security classifier
│   │   ├── unicode_evasion.py / stylometry.py
│   │   ├── advanced_network.py   # hop latency triangulation
│   │   ├── advanced_vision.py    # OCR + QR/barcode extraction (OpenCV, pytesseract, pyzbar)
│   │   ├── case_db.py            # SQLite persistence + campaign clustering + alerts
│   │   └── attribution.py
│   ├── ml/                       # Machine learning layer
│   │   ├── feature_extractor.py  # text + header feature vectors
│   │   ├── threat_classifier.py  # LinearSVC + CalibratedClassifierCV
│   │   ├── bec_engine.py         # Business Email Compromise reasoner
│   │   ├── genai_analyzer.py     # Gemini semantic audit
│   │   ├── deep_auditor.py / adversarial_loop.py
│   │   ├── graph_intel.py        # NetworkX attribution graph builder
│   │   ├── pipeline.py           # analyze_email_ai_ml() orchestrator
│   │   ├── trained_model.py      # persisted artifact loader
│   │   ├── train_model.py / data_generation.py / synthetic_detector.py
│   │   ├── vector_db.py          # Chroma semantic similarity store
│   ├── forensics/                # Evidentiary layer
│   │   ├── custody.py            # SHA-256 chain-of-custody manifest + retention
│   │   ├── blockchain_notary.py  # PoW notarization receipt
│   │   ├── trace_pipeline.py     # run_forensic_trace() deep tracer
│   │   ├── header_analyzer.py    # header anomaly detection
│   │   ├── attribution_graph.py  # graph export models
│   │   ├── geo_intel.py          # background IP-feed refresh task
│   │   ├── domain_intel.py
│   │   └── report_generator.py   # HTML forensic report renderer
│   ├── scoring/
│   │   ├── config.py             # weight table
│   │   ├── fraud_score.py        # calculate_fraud_score() (0–100)
│   │   ├── text_signals.py       # lexical/urgency/social-engineering cues
│   │   └── domain_check.py       # brand lookalike detection
│   ├── models/email.py           # Pydantic ParsedEmail schema
│   ├── microservices/scambaiter.py
│   └── utils/
├── frontend/                     # React 19 + Vite 8 SOC dashboard (Vercel)
├── extension/                    # Chrome Manifest V3 extension
├── models/                       # Persisted sklearn artifacts (SVC.joblib, vectorizer, scaler)
├── tests/                        # Unit / integration / auth / ML / forensic suites
├── test_emails/                  # Benchmark `.eml` corpus
├── docs/                         # This documentation set
├── data/                         # GeoLite2 MMDB, SQLite DBs, chroma_db, graphs
├── docker-compose.yml            # Full dev stack (Kafka, Redis, Neo4j, API, frontend)
├── docker-compose.prod.yml       # Production: frontend + api + caddy
├── Dockerfile.backend            # python:3.11-slim, uvicorn, healthcheck
├── Dockerfile.frontend           # node:20-alpine → nginx multi-stage
├── Caddyfile                     # Reverse proxy + auto-TLS + security headers
├── deploy.sh                     # Local setup/lint/quick-cloud helper
├── deploy-aws.sh                 # AWS Lightsail provisioning + sync script
├── requirements.txt              # Pinned Python dependency set
└── .env.example                  # Documented env template (no secrets)
```

---

## 3. Backend Architecture

### 3.1 Application Bootstrap (`app/main.py`)

The FastAPI application is assembled in `app/main.py`:

* **Lifespan context** (`asynccontextmanager`) — on startup: `init_default_user()` seeds the bootstrap admin; `app.forensics.geo_intel.refresh_feeds_task` is scheduled as an asyncio task (default interval: `intel_feed_refresh_interval_seconds = 3600`) to refresh GeoLite2-derived IP intel feeds. On shutdown the task is cancelled and the event-bus buffer is flushed.
* **Middleware stack** (declaration order):
  1. `slowapi` rate limiter (`setup_rate_limiting(app)`) — global keyed limiter.
  2. `CORSMiddleware` — `allow_origins=settings.cors_origins`, plus `allow_origin_regex=r"https?://.*"` (this relaxed regex is intentional: it permits the Gmail content-script origin and arbitrary API consumers while still requiring an `https?://` scheme).
  3. Custom `@app.middleware("http")` logging middleware — measures per-request duration (`time.perf_counter`), emits structured `request_logger` records, increments Prometheus HTTP counters/histograms, and propagates `X-Request-ID` from inbound headers.
* **Routers mounted:** `app.api.analyze.router` and `app.api.advanced_soc.router`; auth/health/metrics routes are declared in-place on the root app.
* **Conditional SPA service:** if `frontend/dist` exists (built frontend baked into the image), the app mounts `/assets/*` via `StaticFiles` and serves `/` and `/login` as the SPA `index.html`. This is why the DuckDNS endpoint can serve **both** API and UI.
* **Server entry point:** `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1` (workers pinned to 1 because SQLite + in-process model artifacts are not shareable across workers).

### 3.2 Configuration Layer (`app/core/config.py`)

* Based on `pydantic-settings` `BaseSettings` with `case_sensitive=False`, `extra="ignore"`, and `env_file=".env"`.
* **Secrets can be injected via Docker secrets OR environment variables** — `read_secret(name, default)` checks `/run/secrets/<name>` first, then `os.getenv('<NAME_UPPER>')`. This lets `docker-compose.prod.yml` pass `secrets/` files without baking them into images.
* `get_settings()` is `@lru_cache`d — **single settings singleton per process**.
* Notable defaults: `algorithm="HS256"`, access token TTL 30 min, refresh TTL 7 days, rate limit 100 req/60 s, `database_url="sqlite+aiosqlite:///./data/cases.db"`, protected brands list, trusted-relay allowlist.

### 3.3 The `/api/parse` Forensic Pipeline

`POST /api/parse` (`app/api/analyze.py`) is the core engine. It is a **synchronous pipeline** (the request awaits the full forensic result) executed in 13 stages:

| Stage | Code | Description |
|-------|------|-------------|
| 0 | `file.filename.endswith('.eml')` | Pre-flight: enforce `.eml` file type (400 otherwise). |
| 1 | `generate_evidence_custody(contents, filename)` | SHA-256 custody manifest — evidence ID, immutable hash, timestamp; baseline for tamper-evidence. |
| 2 | `parse_eml_file(tmp)` | Decode MIME structure into `ParsedEmail` (headers, auth headers, received chain, bodies, attachments, URLs, QR/OCR text). |
| 2.5 | `BlockchainNotary().notarize_evidence()` | Compute PoW notarization receipt (work over SHA-256 evidence digest). |
| 3 | `analyze_auth(...)` | Parse `Authentication-Results`; evaluate SPF/DKIM/DMARC/ARC pass/fail + alignment vs. `From`/`Return-Path`. |
| 4 | `trace_origin(...)` | Traverse RFC 822 `Received` headers (bottom-up) → ordered hops, best-guess origin, client EHLO, agent. |
| 4b | `analyze_hop_latency(...)` | Latency triangulation across hops to rank plausible origins. |
| 5 | `geolocate_ip(hop["ip"])` | GeoLite2 city/ASN lookup for **every resolvable hop** + best-guess origin (`best_guess_geolocation`). |
| 6–7 | **8-way `ThreadPoolExecutor`** | Concurrent OSINT: `query_domain_dns`, `query_whois_intel`, `analyze_infrastructure`, `query_ip_reputation`, `expand_ip_network_context`, `enumerate_subdomains`, `crawl_wayback_history`, `fingerprint_technology`, `run_dork_scan` — all capped by individual timeouts (WHOIS/DNS each 2.0 s). |
| 8 | `analyze_text_signals(...)` + `check_domain_lookalike(...)` | Lexical urgency/social-engineering cues; brand-lookalike/typosquat detection. |
| 8b | `classify_origin_verdict(...)` | Rule-based provenance verdict fusing auth, infra, reputation, trace, whois, URLs. |
| 8c | `run_forensic_trace(...)` | Deep header-anomaly + attribution tracer producing `advanced_forensics` (incident_id, techniques, related_incidents). |
| 9 | `analyze_email_ai_ml(...)` | Feature extraction → classifier inference → BEC reasoner → Gemini deep audit (`ai_ml_analysis`, `deep_ai_audit`). |
| 9.5 | `SemanticThreatDB().find_similar_threats(full_text)` | Chroma semantic similarity vs. historical threats (graceful no-op if Chroma unavailable). |
| 10a | `_check_historical_correlations(from_domain, ip, sender)` | Cross-case IOC match against the incident DB. |
| 10 | `calculate_fraud_score(...)` | Weighted multi-vector score (see §3.6). |
| 11 | `build_forensic_attribution_graph(...)` | NetworkX attribution workflow object. |
| 12 | **Envelope assembly** | `parsed_email.model_dump()` + custody, blockchain_receipt, semantic_matches, all OSINT buckets, origin_verdict, infra_intel, url_intel, ai_ml_analysis, attribution_graph, fraud_assessment, advanced_forensics. |
| 13 | **Persistence & propagation** | `save_incident_case()` → campaign_id + cluster; `vector_db.store_email()` (Chroma); `event_bus.publish_email_ingested()` (Kafka, if producer present); `create_alert()` for fraud ≥ threshold. Persistence failure degrades gracefully to `campaign_id="CAMP-AUTONOMOUS"`. |

The unified envelope is returned as JSON; `POST /api/report/html` re-renders the same data as an evidentiary HTML report.

### 3.4 Parsers & OSINT Intel Stack

Every parser in `app/parsers/` returns a JSON-serializable dict. Represented capabilities:

* `email_parser.py` — MIME tree walk, nested QP/base64 decoding, attachment metadata, `Reply-To`/`List-*` extraction, embedded URL discovery, inline-image → OCR/QR pipeline hook (`advanced_vision.py`).
* `url_analyzer.py` — per-URL classification: IP-literal hosts, tunneling domains, homoglyphs, credential-harvest path patterns.
* `unicode_evasion.py` — punycode/homoglyph/zero-width detection in headers & body.
* `perators` for DNS (`dns_intel`), `whois_intel`, `domain_recon` (subdomains), `history_intel` (Wayback), `tech_fingerprint` (technology stack via HTTP), `dork_intel` (Google-dork OSINT), `infra_intel` (IP infrastructure profile), `ip_reputation` (+ network neighborhood context), `geolocation` (GeoLite2), `origin_trace`/`origin_verdict`.

All network calls run under per-call timeouts to keep the `/api/parse` p95 bounded.

### 3.5 ML & GenAI Layer (`app/ml/`)

* **`feature_extractor.py`** — constructs the feature vector: bag/weighted text features, header presence flags, URL entropy, attachment heuristics, auth-result features.
* **`threat_classifier.py`** — `Pipeline(LinearSVC → CalibratedClassifierCV)` trained on the synthetic + real corpus (`train_model.py`, `data_generation.py`, `synthetic_detector.py`). Persisted artifacts live in `models/` (`trained_model.py` loader). Classes include: `clean`, `phishing`, `malware`, `credential_harvesting`, `invoice_fraud`, `extortion`, `bec` — resolved into `primary_threat`.
* **`bec_engine.py`** — a reasoner specialized on Business Email Compromise: payment-request phrasing, executive impersonation, beneficiary-account-change narratives.
* **`genai_analyzer.py`** — Gemini (via `google-genai`) semantic audit of tone, intent, and persuasion technique; produces `deep_ai_audit` narrative + confidence.
* **`graph_intel.py`** — converts trace + ML + DNS results into a typed NetworkX graph (`build_forensic_attribution_graph`).
* **`vector_db.py`** — **Chroma** semantic store keyed on campaign id (module guarded; if Chroma is unavailable the calls become safe no-ops so the pipeline never hard-fails).
* **`adversarial_loop.py` / `deep_auditor.py`** — counter-evidence generation and model-audit utilities.

### 3.6 Scoring Engine (`app/scoring/`)

`calculate_fraud_score()` aggregates up to 12 intel buckets into a normalized `0–100` score:

* Auth failures (SPF/DKIM/DMARC misalignment) — strong positive signal.
* Lexical/textual urgency signals (`text_signals.py`).
* Lookalike domain (`domain_check.py`).
* Trace anomalies (unexpected hop chain, missing Received, origin country/ASN dissonance).
* ML classification probability for malicious classes, BEC-engine evidence, GenAI confidence.
* OSINT: poor WHOIS standing, unreputable IP, brand-new subdomain presence, negative history, risky tech fingerprint and dork exposure.

Score → `Risk` mapping: `≥70 High`, `>30 Medium`, else `Low`. A `fraud_score` histogram and per-verdict counters are recorded to Prometheus per parse.

### 3.7 Forensics & Chain of Custody (`app/forensics/`)

* **`custody.py`** — SHA-256 manifest (`evidence_id`, digest, timestamp, retention config); PII masking controls; retention purge job.
* **`blockchain_notary.py`** — PoW notarization over the evidence digest (deterministic work target) producing an unforgeable `blockchain_receipt`.
* **`trace_pipeline.py`** — `run_forensic_trace()` deep IP-to-attacker infrastructure correlation with technique tags and `related_incidents`.
* **`header_analyzer.py`** — header-construction anomaly detection (ordering, forged Received, missing Message-ID, RFC violations).
* **`geo_intel.py`** — background refresh of IP intel feed (launched at startup).
* **`report_generator.py`** — HTML evidentiary report renderer (used by `/api/report/html`).

### 3.8 Persistence & Case Database (`app/parsers/case_db.py`, `app/core/auth.py`)

Three SQLite databases under `data/` (Docker volume `api-data:/app/data`):

* **`cases.db`** — `incident_cases` (full `raw_json` payload), campaign clustering, alerts (`create_alert`), webhook config, retention metadata. Deterministic clustering derives `campaign_id` from shared indicators (domain/IP/embedding).
* **`users.db`** — `users` table (bcrypt hash, scopes CSV, `auth_provider`, avatar, `last_login`). Managed by `app/core/auth.py`.
* **`alerts.db`** — recent alerts + stats (`get_recent_alerts`, `get_alert_stats`).

Schema details in [Appendix B](#appendix-b--sqlite-schema).

### 3.9 Event Bus & Messaging (`app/core/events.py`)

`event_bus` is a thin async bus with an optional **Kafka** producer (`confluent-kafka`). On successful parse, `publish_email_ingested(campaign_id, envelope)` is attempted; failures are captured via `record_kafka_message(...)` metrics rather than failing the request. `/health/ready` reports `kafka: ok|unavailable` based on producer presence.

### 3.10 Observability (`app/core/`)

* **Structured logging** (`logging.py`) — `structlog` JSON pipeline, request/error loggers, `X-Request-ID` correlation.
* **Prometheus metrics** (`metrics.py`) — `/metrics` endpoint; counters/histograms for HTTP requests, email analyses (verdict × threat type), fraud-score distribution, Kafka publish, and Chroma operations.
* **Health probes** — `/health` (liveness) and `/health/ready` (db/vector-db/kafka readiness), used by the Docker healthcheck.

---

## 4. Authentication & Authorization

### 4.1 Local credential flow

* `POST /api/auth/login` (OAuth2 password form) → `authenticate_user` (bcrypt verify via `passlib`) → issues **HS256** JWT pair: `access_token` (30 min, type `access`), `refresh_token` (7 days, type `refresh`).
* `POST /api/auth/refresh` — validates refresh-token type + user existence, issues a rotated token pair.
* `GET /api/auth/me` — protected by `get_current_active_user` (`OAuth2PasswordBearer(tokenUrl="/api/auth/login")`); supports scoped claims (`read`, `write`, `admin`).
* `init_default_user()` — seeds the bootstrap admin on startup.

### 4.2 Google OIDC (server-side verified)

`POST /api/auth/google` receives the **Google identity-token credential** from the frontend one-tap/sign-in button:

1. **Server-side signature verification** — `verify_google_id_token()`:
   * Fetches Google **JWKS** from `https://www.googleapis.com/oauth2/v3/certs` (cached ~1 h).
   * Reconstructs the RSA public key via `cryptography` (`RSAPublicNumbers` → PEM) from each JWK's `n`/`e`.
   * Validates the **RS256 signature** with `python-jose`, then checks `iss` ∈ Google issuers, `aud == settings.google_client_id`, `exp`, and **`email_verified == true`**.
   * *This fixed a prior 500-class failure caused by `jwt.get_unverified_key()` (nonexistent API); JSWS-based key-building replaced it.*
2. Only after verification are the profile claims accepted (`email`, `name`, `picture`); otherwise `401 {"detail":"Invalid Google credential: ..."}`.
3. `upsert_google_user(...)` — inserts-or-updates a `users.db` row with `auth_provider='google'`.
4. Platform HS256 token pair returned, symmetric with the local flow.

### 4.3 Token model

* HS256 signed with `SECRET_KEY` (via Docker secret `secret_key`). `exp` + `type` claims are mandatory; `decode_token()` rejects non-access types to prevent refresh-token reuse as access tokens.

---

## 5. Frontend Architecture (`frontend/`)

* **Build:** React 19 + Vite 8 (rolldown), Tailwind CSS v4 via `@tailwindcss/vite`.
* **Visualization:** `react-force-graph-2d` (attribution graphs), `react-globe.gl` + `three` (geo/campaign globe), `react-leaflet` (maps), `recharts` (charts).
* **State/UX:** `react-router-dom`, `framer-motion`, `clsx` + `tailwind-merge`.
* **Auth:** Login screen with password + **Google one-tap** (`VITE_GOOGLE_CLIENT_ID`), token stored for Bearer auth on `/api/*`.
* **Surfaces:** parse/scan playground, case list, campaign graph, IOC lookup, alerts, retention/admin, chat analyst, extension-install modal (auto-download of `erakshak-extension.zip` + install steps).
* **API base:** compiled at build time from `VITE_API_BASE_URL` → `https://erakshak.duckdns.org` in production; served standalone on Vercel and also co-served by the backend (`/assets`, `/`, `/login`) on DuckDNS.
* **Routing on Vercel:** `frontend/vercel.json` SPA rewrites + env injection.

---

## 6. Browser Extension Architecture (`extension/`)

Manifest V3, source in `.ts`, shipped compiled `.js`:

| Component | File | Role |
|-----------|------|------|
| Manifest | `manifest.json` | MV3, permissions (`activeTab`, `downloads`, `notifications`, `storage`, `scripting`), host permissions (`erakshak.duckdns.org`, `e-rakshak.vercel.app`, localhost dev, `mail.google.com`), content script scoped to `mail.google.com`. |
| Service worker | `background.js` | `API_BASE = https://erakshak.duckdns.org`; request throttling, Gmail open-event handling, notification/badge triage, `openDashboard`. |
| Content script | `gmail_content.js` | Injects UI into `mail.google.com`, extracts message context, fallback fetch to `/api/parse` (allowed by backend CORS regex). |
| Popup | `popup.js` | Scan control, `.eml` upload, result summary, link to dashboard. |
| Settings | `types.js` | `DEFAULT_SETTINGS.apiBaseUrl = https://erakshak.duckdns.org`, sync/local storage, host allowlists. |
| Inject CSS / helper | `gmail_inject.css`, `extract_ik.js` | Gmail DOM styling and Gmail-specific magic-selector extraction (web-accessible resource). |

The shipped pack is `frontend/public/erakshak-extension.zip` — loaded unpacked at `chrome://extensions` → Developer mode → Load unpacked → select `extension/`.

---

## 7. Production Deployment

### 7.1 Topology

```text
Internet
   │  :443 (HTTPS, Let's Encrypt)
   ▼
Caddy 2 (AWS Lightsail 65.2.189.200, Ubuntu)
   ├── handle /api/*       → api:8000
   ├── handle /health/*    → api:8000
   ├── handle /metrics     → api:8000
   └── default             → frontend:5173 (nginx SPA)
        ▼ docker-compose.prod.yml (bridge app-net)
   ┌────────────┬──────────────┬─────────────┐
   │ frontend   │ api          │ caddy:2     │
   │ nginx SPA  │ uvicorn 1w   │ TLS ingress │
   │ cap 0.5CPU │ cap 2CPU     │ cap 0.25CPU │
   │    512M    │ 3G           │ 128M        │
   └────────────┴──────────────┴─────────────┘
   volumes: api-data → /app/data (cases.db, users.db, alerts.db, GeoLite2, chroma_db)
            models (ro) → persisted artifacts
DuckDNS cron → erakshak.duckdns.org pinned to 65.2.189.200 (every 5 min)
```

### 7.2 Host & resources

* AWS Lightsail instance **1 GB / 1 vCPU**, Ubuntu, with an additional **4 GB Linux swap** (recommended for the sklearn/Gemini memory headroom). Resource caps: api `2 CPU / 3 G`, frontend `0.5 CPU / 512 M`, caddy `0.25 CPU / 128 M`. Do not downgrade below this plan for production.

### 7.3 Reverse proxy & TLS

* **Caddy v2** auto-provisions Let's Encrypt certs for the domain and injects security headers (`X-Content-Type-Options nosniff`, `X-Frame-Options DENY`, `Referrer-Policy strict-origin-when-cross-origin`, `-Server`), gzip encoding. Full manifest in [Appendix A](#appendix-a--full-deployment-manifests).
* Docker network resolved service names: `frontend:5173`, `api:8000`.

### 7.4 DNS

* **DuckDNS** dynamic DNS — `erakshak.duckdns.org`. A cron job updates the record with the instance public IP every 5 minutes (the IP is static on Lightsail, but the cron guards against IP drift).

### 7.5 Backend upgrade path (server)

```bash
cd ~/email_threat_platform
git fetch && git stash                # preserve local Caddyfile edits
git pull origin main
git stash pop
docker compose -f docker-compose.prod.yml up -d --build
curl -fsS https://erakshak.duckdns.org/health/ready
```
The `Caddyfile` on the host is intentionally a **local-only modification** (domain mode) and must be preserved across pulls — hence stash/pop.

### 7.6 Frontend deployment (Vercel)

Vercel project `e-rakshak`, linked to GitHub `main`:
* Root directory: `frontend` · Build: `npm run build` · Output dir: `dist`.
* Env: `VITE_API_BASE_URL=https://erakshak.duckdns.org`, `VITE_GOOGLE_CLIENT_ID=...`.
* Every `git push origin main` auto-deploys (verified deployment states in §8).
* Manual alternative: `vercel deploy --prod` from the repository root (root-directory settings must be used; deploying from the `frontend/` folder double-prefixes the path and fails).

---

## 8. CI/CD & GitOps

* **Trigger:** `git push origin main` → Vercel GitHub integration.
* **Provenance:** the deployment metadata records `githubCommitRef=main` and the commit SHA; deployments transition `BUILDING → READY` (alias `e-rakshak-*.vercel.app`).
* **Production alias:** `e-rakshak.vercel.app` always points at the newest READY build.
* **API parity:** the backend bundle served both by DuckDNS (`docker compose` build) and by Vercel is verified post-deploy for `API_BASE`, Google Client ID, and modal presence.
* **Deploy verification snippets:**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://e-rakshak.vercel.app            # 200
curl -s -o /dev/null -w '%{http_code}\n' https://erakshak.duckdns.org/health/ready # 200
curl -s -o /dev/null -w '%{http_code}\n' https://e-rakshak.vercel.app/erakshak-extension.zip  # 200
curl -s -H "Authorization: Bearer $VCT" "https://api.vercel.com/v6/deployments?limit=3&projectId=e-rakshak"
```

---

## 9. Security Hardening

| Area | Control |
|------|---------|
| Google tokens | Server-side JWKS verification (signature + issuer + **audience = client ID** + `email_verified`); no client-supplied claims trusted pre-verification. |
| Local auth | bcrypt 4.0.1 via `passlib`; scoped JWT claims (`read`/`write`/`admin`); refresh tokens are type-tagged & rotating. |
| Secrets | Never committed; supplied via Docker secrets (`/run/secrets/*`) or gitignored `.env*`. `.env.example` documents names only. `.gitignore` excludes `.env`/`.env.*`/`secrets/`/`*.pem`. |
| Rate limiting | slowapi — 100 req/60 s global; on sensitive/auth endpoints. |
| Transport | TLS-only via Caddy/Let's Encrypt; HTTP port 80 only redirects. Security headers applied globally. |
| Server identity | Caddy `-Server` header suppression; backend behind proxy (only Caddy ports 80/443 exposed). |
| CORS | Explicit origins list for the dashboard + regex `https?://.*` for the extension/Gmail fallback. |
| User container | Backend runs as non-root `appuser` inside the container. |
| Input bounds | `.eml` extension enforcements; parser timeouts; thread-pool caps (8) to bound OSINT fan-out. |
| Evidence integrity | SHA-256 custody manifest + PoW notarization for any exported artifact. |

---

## 10. API Reference

Base: `https://erakshak.duckdns.org` — interactive docs at `/docs`, ReDoc at `/redoc`.

### Analysis
| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/parse` | `multipart/form-data` field `file` (`.eml`). Full pipeline envelope (§3.3). |
| `POST` | `/api/report/html` | JSON body (parse envelope) → printable HTML evidentiary report. |
| `GET` | `/api/info` | Service metadata/version. |

### SOC
| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/cases` | Recent investigated cases. |
| `GET` | `/api/campaigns` | Campaign clusters. |
| `GET` | `/api/alerts?limit=N` | Recent high-risk alerts (default 50). |
| `GET` | `/api/alerts/stats` | Alert aggregate stats. |
| `POST`/`GET` | `/api/alerts/webhook` | Configure / read webhook (`webhook_url`, `min_score`, `enabled`). |
| `POST`/`GET` | `/api/retention/config` | Retention policy read/update. |
| `POST` | `/api/retention/purge` | Manual retention purge (age / PII masking). |
| `GET` | `/api/indicators/{value}` | IOC lookup (auto-detects IP / email / SHA-256 / domain / keyword); returns dossier + linked campaigns + verdict. |

### Advanced SOC & AI (`app/api/advanced_soc.py`)
| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/sandbox/screenshot` | Sandbox screenshot capture. |
| `POST` | `/api/takedown/generate` | Takedown-request generator. |
| `POST` | `/api/chat` | Conversational GenAI analyst. |

### Auth
| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/auth/login` | OAuth2 password form → HS256 token pair. |
| `POST` | `/api/auth/google` | Server-side verified Google OIDC (see §4.2). |
| `POST` | `/api/auth/refresh` | Refresh token rotation. |
| `GET` | `/api/auth/me` | Current user (Bearer). |

### Observability
| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/health` | Liveness. |
| `GET` | `/health/ready` | Readiness: db / vector-db / kafka. |
| `GET` | `/metrics` | Prometheus text exposition. |

---

## 11. Configuration Reference

### `.env` / secrets that drive `app/core/config.py`

| Secret/env | Setting | Default | Purpose |
|-----------|---------|---------|---------|
| `secret_key` (secret) | `secret_key` | `CHANGE_ME_...` | HS256 JWT signing. |
| `gemini_api_key` (secret) | `gemini_api_key` | None | Gemini deep audit. |
| `maxmind_license_key` | `maxmind_license_key` | None | GeoLite2 feed updates. |
| `google_client_id` | `google_client_id` | None | Google OIDC audience. |
| `google_client_secret` | `google_client_secret` | None | Google OIDC (reserved). |
| `database_url` | `database_url` | `sqlite+aiosqlite:///./data/cases.db` | Case DB. |
| `chroma_persist_dir` | `chroma_persist_dir` | `./data/chroma_db` | Semantic store. |
| `kafka_bootstrap_servers` | same | `localhost:9092` | Event bus. |
| `neo4j_uri/user/password` | same | localhost:7687 | Optional graph DB. |
| `redis_url` | same | `redis://localhost:6379/0` | Optional cache. |
| `cors_origins` | `CORS_ORIGINS` JSON | localhost list | Allowed origins. |
| `environment` | `ENVIRONMENT` | `development` | Tenant/env tag. |
| `protected_brands` / `trusted_relays` | JSON arrays | defaults | Forensic config. |
| `rate_limit_requests/window` | same | 100 / 60 | global limit. |
| `sentrey_dsn` | `SENTRY_DSN` | None | Optional error tracking. |

> Docker-secret file names map `-` → `_` and uppercase: e.g. `secret_key.txt` → `SECRET_KEY`.

---

## 12. Operations Runbook

### Health
```bash
curl -fsS https://erakshak.duckdns.org/health           # {"status":"ok",...}
curl -fsS https://erakshak.duckdns.org/health/ready     # db/vector_db/kafka
docker exec <api_container> curl -s localhost:8000/health/ready   # in-container probe
```

### Logs & metrics
```bash
ssh -i ~/Downloads/LightsailDefaultKey-ap-south-1.pem ubuntu@65.2.189.200
docker logs --tail 200 <api> ; docker logs --tail 100 <caddy>
curl -s localhost:8000/metrics | grep -E 'http_requests|fraud_score|email_analysis'
```

### Update backend
```bash
cd ~/email_threat_platform && git fetch && git stash && git pull && git stash pop
docker compose -f docker-compose.prod.yml up -d --build
```

### Troubleshooting reference
| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `/api/parse` 500 ⟶ JSON 401 on Google login | Broken token verification | Use JWKS `RSAPublicNumbers` key build (already fixed in `834c3ad`). |
| Vercel deploy ENOENT `frontend/package.json` | CLI deploy from `frontend/` dir | Deploy from repo root; rely on GitHub integration (root dir setting). |
| Backend not serving SPA | `frontend/dist` missing in image | Rebuild frontend stage (`docker compose ... up -d --build`). |
| Login `Failed to fetch` | CORS / origin mismatch | Verify origin matches `cors_origins` or `https?://.*` regex. |
| Server pull conflicts | Modified `data/chroma_db/*` or `Caddyfile` | Stash before pull; keep Caddyfile as local copy. |

---

## 13. Known Limitations & Roadmap

**Limitations**
* Single-worker uvicorn (SQLite + in-process model artifacts) — horizontal scale requires moving to Postgres + externalized model serving.
* Chroma/vector store is optional-guarded; persisted semantic search is best-effort.
* Google one-tap requires the OAuth client be authorized in Google Console for the audience used.
* Browsers cannot auto-install self-hosted extensions; install path is Load-unpacked (Chrome Web Store route planned).

**Roadmap**
* Postgres + Alembic migrations; Neo4j campaign-graph persistence.
* Kafka real-time triage workers (Celery) for long-running deep-OSINT.
* Model monitoring (MLflow + Evidently) and online calibration.
* Chrome Web Store publication for one-click install.
* Clustered vector search (Chroma over S3/EBS) with sentence-transformers embeddings.

---

## Appendix A — Full Deployment Manifests

### `docker-compose.prod.yml` (abridged)

```yaml
services:
  frontend:
    build: { context: ., dockerfile: Dockerfile.frontend }
    restart: unless-stopped
    networks: [app-net]
    deploy: { resources: { limits: { cpus: '0.5', memory: 512M } } }
  api:
    build: { context: ., dockerfile: Dockerfile.backend }
    restart: unless-stopped
    env_file: .env
    volumes: [ api-data:/app/data, ./models:/app/models:ro ]
    networks: [app-net]
    deploy: { resources: { limits: { cpus: '2.0', memory: 3G } } }
    healthcheck:
      test: ["CMD","curl","-f","http://localhost:8000/health/ready"]
      interval: 30s  # timeout 10s, retries 3, start_period 60s
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports: [ "80:80", "443:443" ]
    volumes: [ ./Caddyfile:/etc/caddy/Caddyfile:ro, caddy-data:/data, caddy-config:/config ]
    networks: [app-net]
    deploy: { resources: { limits: { cpus: '0.25', memory: 128M } } }
```

### `Dockerfile.backend`

`python:3.11-slim` → installs system deps (`tesseract-ocr`, `libzbar0`, `poppler-utils`, `libgl1`, `libglib2.0-0`, `curl`) → `pip install -r requirements.txt` (with PyTorch CPU extra-index) → copies `app/` and `data/` → non-root `appuser` → healthcheck on `/health/ready` (30 s interval, 40 s start period) → `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1`.

### `Dockerfile.frontend`

Stage 1 `node:20-alpine`: `npm ci`, build with `VITE_API_BASE_URL` build-arg. Stage 2 `nginx:alpine`: SPA `try_files ... /index.html`, immutable-cache static assets (1 y), gzip; listens on `5173`.

### `Caddyfile` (host, domain-mode excerpt)

```
erakshak.duckdns.org {
    reverse_proxy frontend:5173
    handle /api/*   { reverse_proxy api:8000 }
    handle /health/*{ reverse_proxy api:8000 }
    handle /metrics { reverse_proxy api:8000 }
    header { X-Content-Type-Options nosniff; X-Frame-Options DENY; Referrer-Policy strict-origin-when-cross-origin; -Server }
    encode gzip
}
```

*(The committed `Caddyfile` carries both IP-only and domain modes; the host copy is edited to use domain mode and is preserved across pulls.)*

---

## Appendix B — SQLite Schema

### `users` (`data/users.db`)
```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE,
  full_name     TEXT,
  hashed_password TEXT,
  disabled      INTEGER DEFAULT 0,
  scopes        TEXT DEFAULT 'read,write',
  auth_provider TEXT DEFAULT 'local',
  avatar_url    TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login    TIMESTAMP
);
```

### `incident_cases` (`data/cases.db` — logical columns)
```sql
case_id TEXT PRIMARY KEY,      -- e.g. INC-...
evidence_id TEXT,              -- custody SHA-256 reference
timestamp_utc TIMESTAMP,       -- parse time
from_address TEXT, subject TEXT, body_preview TEXT,
primary_threat TEXT, fraud_score INTEGER, risk_level TEXT,
campaign_id TEXT,              -- deterministic cluster key
auth_analysis/urls/trace... JSON (raw_json TEXT),  -- full envelope
attachments TEXT, raw_json TEXT
```

### Other stores
* `alerts.db` — `alerts` (id, evidence_id, score, threat, message, created_at) and `webhook_config` (url, min_score, enabled) + stats view.
* `data/chroma_db/` — Chroma persistence directory (gitignored; regenerable).
* GeoLite2 databases under `data/` (gitignored `*.mmdb`).

---

## Version History

| Commit | Change |
|--------|--------|
| `b9f8d49` | `.gitignore` hardening for secrets/env data |
| `9a3f7b3` | `config.py` Google OAuth fields + `extra=ignore` |
| `3802aeb` | Frontend `handleLogout` → `onLogout` fix |
| `834c3ad` | Google JWKS server-side verification fix |
| `83b9bf0` | Extension repointed to live backend + install-modal UX + rebuilt zip |
| `47bf17f` | Comprehensive technical README |
| `58b2a6c` | Ignore production attribution runtime artifact |