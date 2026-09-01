# eRakshak — Email Threat Defense & Forensic Intelligence Platform

<div align="center">

**An enterprise-grade, full-stack email phishing/ BEC / malware forensic analysis platform — with real‑time browser extension integration, production ML inference, and a zero‑cost cloud deployment footprint.**

[![Live Backend](https://img.shields.io/badge/LIVE-Backend-00c853?style=flat-square&logo=fastapi&logoColor=white)](https://erakshak.duckdns.org)
[![Live Frontend](https://img.shields.io/badge/LIVE-Frontend-00c853?style=flat-square&logo=vercel&logoColor=white)](https://e-rakshak.vercel.app)
[![Swagger UI](https://img.shields.io/badge/API-Docs-007ec6?style=flat-square&logo=swagger&logoColor=white)](https://erakshak.duckdns.org/docs)
[![Health](https://img.shields.io/badge/Status-Harmonized-009688?style=flat-square&logo=shield&logoColor=white)](https://erakshak.duckdns.org/health/ready)
[![Docker](https://img.shields.io/badge/Docker-Prod%20Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://hub.docker.com/_/caddy)
[![Framework](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
</div>

---

## 🔗 Live Deployment Links

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend (Vercel)** | [`https://e-rakshak.vercel.app`](https://e-rakshak.vercel.app) | SOC Analyst Dashboard — React 19 / Vite / Tailwind, auto‑deployed from `main` |
| **Backend API** | [`https://erakshak.duckdns.org`](https://erakshak.duckdns.org) | FastAPI production API on AWS Lightsail, proxied through Caddy |
| **Swagger / OpenAPI** | [`https://erakshak.duckdns.org/docs`](https://erakshak.duckdns.org/docs) | Interactive API documentation |
| **Healthcheck** | [`https://erakshak.duckdns.org/health`](https://erakshak.duckdns.org/health) | Liveness probe (`{status:"ok"}`) |
| **Readiness** | [`https://erakshak.duckdns.org/health/ready`](https://erakshak.duckdns.org/health/ready) | Dependency readiness (db / vector‑db / kafka) |
| **Extension Pack** | [`https://e-rakshak.vercel.app/erakshak-extension.zip`](https://e-rakshak.vercel.app/erakshak-extension.zip) | Chrome MV3 extension, pre‑wired to the live backend |
| **GitHub Repository** | [`github.com/Punit0007x/email-threat-platform-`](https://github.com/Punit0007x/email-threat-platform-) | Source, CI/CD, and deployment manifests |

---

## 📖 Overview

**eRakshak** is a production‑hardened **email threat intelligence and forensics** platform that ingests raw `.eml` messages (or live webmail streams), and produces a **multi‑vector fraud assessment**, a **deep header/protocol forensic dissection**, an **origin‑traceable geolocation graph**, and a **machine‑learning threat classification** in a single automated pipeline.

The stack is composed of three primary surfaces:

1. **FastAPI Backend** — stateless REST API hosting the full forensic + ML pipeline, authentication (local + Google OIDC with server‑side JWT verification), rate limiting, Prometheus metrics, OpenTelemetry tracing, and STIX/HTML reporting.
2. **React SOC Dashboard** — an interactive, animated threat analyst console (Vercel‑hosted) for scanning, case management, IOC lookup, graph attribution, and deep OSINT drill‑downs.
3. **Chrome MV3 Extension** — Gmail + `.eml` real‑time detection (content script + service worker + side panel), hard‑wired to the live backend.

Deployment is **100% cloud‑hosted**: the backend runs as a Dockerized three‑container stack on a **1 GB AWS Lightsail** instance (`65.2.189.200`) fronted by **Caddy** for automatic **Let's Encrypt** TLS and routed via a **DuckDNS** dynamic‑DNS subdomain. The frontend is continuously delivered from GitHub to **Vercel** on every push to `main`.

---

## 🧠 Key Capabilities

| Category | Capability |
|----------|-----------|
| **Parsing** | RFC 822/5322 MIME parsing; multipart / MIME‑variant handling; nested base64 / QP decoding; inline attachment & embedded‑URL discovery |
| **Auth Forensics** | SPF, DKIM, DMARC, ARC validation; Return‑Path integrity; domain‑alignment checks; spoofing & relay‑tamper detection |
| **Origin Trace** | RFC 822 `Received` chain traversal; latency triangulation; best‑guess origin IP; ASN/ISP/GeoLite2 geolocation |
| **URL Security** | Typosquatting, homoglyph/Unicode evasion, IP‑literal, tunneling‑host, and credential‑harvesting URL patterns |
| **ML Classification** | Multi‑class threat classifier (LinearSVC + `CalibratedClassifierCV`) for BEC, extortion, credential harvesting, invoice fraud, malware delivery |
| **GenAI Audit** | Gemini‑backed semantic analysis, stylometry, and adversarial deep‑audit of email body tone & intent |
| **Network Intel** | WHOIS, passive DNS, domain recon, IP reputation, historical intel, advanced port/tech fingerprinting |
| **Deep OSINT** | Google dorking integration, dark‑web credential‑leak correlation, infrastructure mapping |
| **Attribution Graph** | NetworkX graph of origin IPs, MX records, and MITRE ATT&CK techniques; interactive 3D visualization |
| **Chain of Custody** | SHA‑256 tamper‑evident custody receipts, blockchain notarization, full incident reporting |
| **SOC Surfaces** | Case management, alerts + webhooks, campaigns, IOC lookup, retention policies, sandbox screenshot, takedown request generator |
| **Extension** | Gmail auto‑scan on email open, `.eml` drag‑drop scan, popup + side panel, badge/notification triage |

---

## 🏗️ Architecture

```
                          ┌──────────────────────────────────────────────────────────────┐
                          │                        CLIENT SURFACES                        │
                          └──────────────────────────────────────────────────────────────┘
   ┌──────────────────────────────┐   ┌──────────────────────────────┐   ┌─────────────────────────┐
   │   SOC Dashboard (React)      │   │   Chrome Extension (MV3)     │   │   REST API Consumer     │
   │   https://e-rakshak.vercel.app│  │   Gmail + .eml auto-scan     │   │   Swagger / curl / SDK  │
   └──────────────┬───────────────┘   └──────────────────────────────┘   └─────────────────────────┘
                  │  JSON / HTTPS (CORS + Bearer)        │  HTTPS
                  ▼                                       ▼
   ┌─────────────────────────────────────────────────────────────────────────────────────┐
   │                        Caddy Reverse Proxy (AWS Lightsail)                          │
   │                        erakshak.duckdns.org → TLS (Let's Encrypt)                   │
   │                 /health /*,  /api/*,  /metrics → api:8000   else → frontend:5173   │
   └────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
   ┌──────────────────────────────────────────────────────────────┐
   │               docker-compose.prod.yml (bridge net)           │
   │  ┌─────────────────┐    ┌──────────────────┐                  │
   │  │ frontend (nginx) │    │   api (uvicorn)  │                  │
   │  │ React built SPA  │◄──►│   FastAPI app    │                  │
   │  │ port 5173        │    │   port 8000      │                  │
   │  └─────────────────┘    └──────┬───────────┘                  │
   │                                │                              │
   │                               ▼                              │
   │                     ┌────────────────────┐                    │
   │                     │   app/core + app/  │                    │
   │                     │  parsers + app/ml  │                    │
   │                     │  app/forensics     │                    │
   │                     └────────────────────┘                    │
   └──────────────────────────────────────────────────────────────┘

   Data/Volumes:  api-data (cases.db, users.db, alerts.db, chroma_db, GeoLite2 MMDB)
                  models/  (pre-trained classifiers, vectorizers, scalers)
```

### Request Lifecycle

1. Client (dashboard / extension) sends `.eml` via `multipart/form-data` to `POST /api/parse`.
2. `app/parsers/email_parser.py` decodes the MIME tree into a normalized `ParsedEmail`.
3. The **multi‑vector scoring engine** (`app/scoring/fraud_score.py`) fuses signals from header forensics, origin trace, URL analysis, stylometry, and ML.
4. The **ML pipeline** (`app/ml/pipeline.py`) runs feature extraction → classifier inference (`LinearSVC`) → calibration, then optional **Gemini audit** (`app/ml/genai_analyzer.py`).
5. `app/forensics/trace_pipeline.py` + `attribution_graph.py` resolve geo/ASN and build the attribution graph (NetworkX).
6. A `ScanResult` envelope (fraud score, classification, trace, auth analysis, headers) is returned and persisted via `app/parsers/case_db.py`.

---

## 🛠️ Technology Stack

### Backend — `app/`
| Layer | Technologies |
|-------|-------------|
| **API Framework** | FastAPI 0.110, Uvicorn 0.29, Pydantic v2, pydantic‑settings, python‑multipart |
| **Parsing / Forensics** | email/MIME stdlib, BeautifulSoup4, geoip2/MaxMind, dnspython, python‑jose |
| **ML / AI** | scikit‑learn 1.5 (LinearSVC + CalibratedClassifierCV), numpy/scipy, google‑genai (Gemini), networkx 3.3 |
| **Security & Observability** | passlib[bcrypt] 4.0.1, slowapi (rate limiting), structlog, prometheus‑client, OpenTelemetry |
| **Data** | SQLAlchemy 2 (async), SQLite (cases/users/alerts), Redis, Celery, confluent‑kafka (optional integrations) |
| **DevOps** | Docker multi‑stage, docker‑compose (dev + prod), pytest/pytest‑asyncio/httpx, alembic |

### Frontend — `frontend/`
| Layer | Technologies |
|-------|-------------|
| **Framework** | React 19, Vite 8 (rolldown), react‑dom |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`), tailwind‑merge, clsx |
| **Visualization** | react‑force‑graph-2d, react‑globe.gl, leaflet / react‑leaflet, recharts, three.js |
| **Animation** | framer‑motion |
| **Routing** | react‑router‑dom |
| **Platform** | Vercel (GitHub auto‑deploy, `rootDirectory: frontend`, SPA rewrites) |

### Browser Extension — `extension/`
* Chrome **Manifest V3**: service worker (`background.js`), content script (`gmail_content.js`), web‑accessible `extract_ik.js`, popup + side panel, gmail_scoped inject CSS, `chrome.storage.sync/local` settings, host permissions for `erakshak.duckdns.org` + `mail.google.com` + localhost dev.

### Infrastructure
| Component | Detail |
|-----------|--------|
| **Host** | AWS Lightsail, 1 GB RAM (with a 4 GB swap file), Ubuntu, Docker + Compose v2 |
| **Proxy / TLS** | Caddy 2 (auto HTTPS, Let's Encrypt), Caddyfile with `/health`, `/api/*`, `/metrics` routing |
| **DNS** | DuckDNS dynamic DNS (`erakshak.duckdns.org`), auto‑update cron every 5 min |
| **CDN / Hosting** | Vercel for the SPA (production branch `main`) |
| **CI/CD** | GitHub → Vercel webhook auto‑deploy; git‑based server sync on AWS |

---

## 🔌 API Reference

Base URL: `https://erakshak.duckdns.org` — interactive docs at `/docs`.

### Analysis & Reporting
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/parse` | Core scan endpoint. Accepts `multipart/form-data` `file` (`.eml`, `message/rfc822`). Returns full `ScanResult`. |
| `POST` | `/api/report/html` | Generate tamper‑evident HTML incident report |
| `GET` | `/api/info` | Platform / tenant metadata |

### SOC & Cases
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cases` | Case management list |
| `GET` | `/api/campaigns` | Campaign correlation graph |
| `GET` | `/api/alerts` · `/api/alerts/stats` | Alerts + statistics |
| `POST`/`GET` | `/api/alerts/webhook` | Webhook registration / dispatch |
| `POST`/`GET` | `/api/retention/config` · `POST /api/retention/purge` | Data retention policy |
| `GET` | `/api/indicators/{value}` | IOC (IP/domain/email/SHA‑256) lookup |

### Advanced SOC & AI
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/sandbox/screenshot` | Sandbox screenshot capture |
| `POST` | `/api/takedown/generate` | Takedown request generator |
| `POST` | `/api/chat` | Conversational AI analyst (Gemini) |

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | OAuth2 password‑flow login (admin/analyst) |
| `POST` | `/api/auth/google` | Google OIDC — **server‑side ID‑token verification** (JWKS RS‑256 signature, issuer + audience + `email_verified`) |
| `POST` | `/api/auth/refresh` | Refresh‑token rotation |
| `GET` | `/api/auth/me` | Current authenticated user |

### Observability
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness (`{"status":"ok"}`) |
| `GET` | `/health/ready` | Readiness (database, vector‑db, kafka) |
| `GET` | `/metrics` | Prometheus metrics endpoint |

---

## 🔒 Security & Hardening

* **Google OAuth verification is server‑side** — `/api/auth/google` fetches Google's **JWKS** (`https://www.googleapis.com/oauth2/v3/certs`, hourly cache), reconstructs the RSA public key via `cryptography`, and validates RS‑256 signature, `iss` (accounts.google.com), `aud` (client ID), and `email_verified` — before issuing signed platform JWTs (HS‑256, secret from `secrets/`).
* **Local auth** uses `passlib[bcrypt]` with bcrypt 4.0.1 (Compatibility‑Fix pin) and scoped access tokens (`read`, `write`, `admin`).
* **Rate limiting** via `slowapi` on sensitive endpoints.
* **CORS** allows the Vercel origin, DuckDNS origin, and regex `https?://.*` (required so the Gmail content‑script fallback path passes preflight).
* **Caddy security headers**: `nosniff`, `X-Frame-Options DENY`, `Referrer-Policy strict-origin-when-cross-origin`, `-Server`.
* Secrets are stored **outside the container image** (`secrets/` volume + `env_file`), gitignored, and `.env.*` are excluded from the repo.

---

## 🚀 Production Deployment

### Topology
```
AWS Lightsail 65.2.189.200 (Ubuntu, 1GB + 4GB swap)
├── Docker Engine
│   └── docker-compose.prod.yml
│       ├── frontend  (nginx, built React SPA)
│       ├── api       (uvicorn FastAPI, healthchecked)
│       └── caddy     (TLS ingress :80/:443)  ← 0.0.0.0
└── DuckDNS cron (update.sh every 5 min → 65.2.189.200)
```

### Backend (AWS Lightsail)
```bash
# On server: ~/email_threat_platform
sudo docker compose -f docker-compose.prod.yml up -d --build
```

* **Caddy** terminates TLS and routes `/health`, `/health/*`, `/api/*`, `/metrics` → `api:8000`; everything else → `frontend:5173`.
* Readiness gate: `api` container healthcheck hits `/health/ready`.
* Resource caps: api `3G/2 CPU`, frontend `512M/0.5 CPU`, caddy `128M/0.25 CPU`.
* **DuckDNS** auto-update cron keeps the subdomain pinned to the instance IP.

### Frontend (Vercel)
```bash
# Vercel project: e-rakshak  (linked to GitHub Punit0007x/email-threat-platform-, branch main)
#   Root Directory : frontend
#   Build Command  : npm run build
#   Output Dir     : dist
#   Env Vars       : VITE_API_BASE_URL=https://erakshak.duckdns.org
#                    VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
vercel deploy --prod                      # manual
# every `git push origin main` auto-deploys via webhook
```

`frontend/vercel.json` also injects the API base + Google Client ID and provides SPA rewrites.

### Browser Extension
1. Click **Download Extension** on the site (or fetch `erakshak-extension.zip`).
2. Open `chrome://extensions` → enable **Developer mode** → **Load unpacked**.
3. Select the extracted `extension/` folder. The extension is **pre‑configured** to talk to `https://erakshak.duckdns.org` — no setup required.

---

## ⚙️ Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `SECRET_KEY` | HS‑256 signing key for JWTs (or `secrets/secret_key.txt`) | *(gitignored)* |
| `GEMINI_API_KEY` | Google Gemini key for GenAI audit (or `secrets/gemini_api_key.txt`) | `AIza...` |
| `GOOGLE_CLIENT_ID` | Google OIDC client ID (server‑side verification audience) | `....apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OIDC client secret (server‑side use) | *(gitignored)* |
| `CORS_ORIGINS` | Allowed origins JSON array | `["https://e-rakshak.vercel.app", ...]` |
| `DATABASE_URL` | SQLAlchemy async URL (default SQLite) | `sqlite+aiosqlite:///./data/cases.db` |
| `CHROMA_PERSIST_DIR` | Vector DB persistence | `./data/chroma_db` |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka (optional) | `localhost:9092` |
| `NEO4J_URI / USER / PASSWORD` | Graph DB (optional) | — |
| `REDIS_URL` | Cache/queue (optional) | `redis://localhost:6379/0` |
| `MAXMIND_LICENSE_KEY` | GeoLite2 license | — |
| `SENTRY_DSN` | Error tracking | — |
| `LOG_LEVEL` / `LOG_FORMAT` | Structured logging | `INFO` / `json` |
| `RATE_LIMIT_*` | Rate limit tuning | `100` / `60` |

> A documented `.env.example` is committed; real secrets live only in local/server `secrets/` and gitignored `.env*` files.

---

## 💻 Local Development

### Backend
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 run_server.py          # -> http://localhost:8000  (/docs for Swagger)
```

### Frontend
```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev   # -> http://localhost:5173
```

### Full local stack (dev compose — includes Kafka/Redis/Neo4j)
```bash
docker compose up --build -d
```

### Extension (local dev)
Load `extension/` via `chrome://extensions` → Developer mode → Load unpacked. It defaults to `localhost:8000` in dev branches and to the deployed backend in the shipped pack.

---

## 🧪 Testing

```bash
source venv/bin/activate && export PYTHONPATH=.
pytest -q                                # full suite
python3 tests/test_url_legitimacy.py     # URL signal validation
python3 tests/test_fraud.py              # multi-vector scoring
python3 tests/test_full_platform.py      # end-to-end pipeline
python3 tests/test_auth.py               # auth + token flows
python3 tests/test_forensics.py          # origin trace + auth analysis
python3 tests/test_ml_layer.py           # classifier + BEC engine
```

---

## 📁 Repository Structure

```text
.
├── app/                    # FastAPI backend
│   ├── api/                #   advanced_soc.py, analyze.py, stix_export.py
│   ├── core/               #   config, auth, logging, metrics, rate_limit, events
│   ├── parsers/            #   email_parser, origin_trace, url_analyzer, whois/dns/domain intel…
│   ├── ml/                 #   threat_classifier, bec_engine, genai_analyzer, deep_auditor…
│   ├── forensics/          #   trace_pipeline, header_analyzer, attribution_graph, custody…
│   ├── scoring/            #   fraud_score, text_signals, domain_check
│   ├── models/             #   Pydantic schemas
│   └── microservices/      #   scambaiter.py
├── frontend/               # React 19 + Vite SOC Dashboard (Vercel)
├── extension/              # Chrome MV3 extension (pre-wired to live backend)
├── models/                 # Pre-trained classifiers / vectorizers / scalers
├── test_emails/            # Benchmark .eml corpus
├── tests/                  # Unit, integration, auth, ML, forensics suites
├── docs/                   # Architecture, playbooks, technical breakdowns
├── data/                   # GeoLite2 MMDB, SQLite DBs, chroma_db, attribution graphs
├── docker-compose.yml      # Full dev stack (incl. Kafka, Redis, Neo4j)
├── docker-compose.prod.yml # Production: frontend + api + caddy
├── Dockerfile.backend      # Multi-stage FastAPI container
├── Dockerfile.frontend     # Multi-stage Vite → nginx container
├── Caddyfile               # TLS reverse-proxy config for erakshak.duckdns.org
├── deploy.sh / deploy-aws.sh # Setup & AWS Lightsail deployment scripts
└── .env.example            # Documented env template (no secrets)
```

---

## 📚 Documentation

* [Technical Breakdown](docs/TECHNICAL_BREAKDOWN.md)
* [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)
* [Platform Playbook](docs/Platform_Playbook.md)
* [Executive Summary](docs/Executive_Summary.md)
* [Permission‑Level Architecture](docs/god_level_architecture.md)
* [Current Project Status](docs/CURRENT_PROJECT_STATUS.md)
* [Project Plan](docs/plan.md)

---

## 🧭 Roadmap Notes

* Vector DB search augmentation (Chroma) wiring for semantic similarity across historical cases.
* Neo4j campaign‑graph persistence and Kafka event‑streaming for real‑time triage.
* Celery workers for long‑running deep‑OSINT and sandbox jobs.
* Chrome Web Store publication for one‑click install.
* MLflow + Evidently for production model monitoring.

---

## ⚖️ License

MIT — built for cyber‑defense, digital forensics, incident‑response (DFIR) teams, and security researchers.

> **Note:** Live credentials and secrets are intentionally **not** committed. All keys referenced on the production hosts are rotated/redacted per operational policy.