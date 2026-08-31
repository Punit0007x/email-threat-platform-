# 🛡️ Advanced Email Threat Intelligence & Forensics Platform

An enterprise-grade, end-to-end email forensic analysis platform, threat scoring engine, and interactive SOC dashboard for deep investigation of raw `.eml` files and live webmail streams.

---

## 🚀 Key Platform Capabilities

* **Deep MIME & Header Parsing**: Unpacks complex multipart structures, decodes nested encodings, extracts rich headers, inline attachments, and embedded URLs.
* **Cryptographic Authentication Analysis**: Verifies SPF, DKIM, and DMARC alignment, Return-Path validation, and detects domain spoofing.
* **Origin Tracing & Geolocation Intelligence**: Traverses RFC 822 `Received` header chains backwards to identify true origin IPs with latency triangulation and ASN/ISP intelligence.
* **Smart URL Security & Legitimacy Engine**: Evaluates domain trust, typosquatting/homoglyph detection (`xn--`), raw IP literals, tunneling hosts, and credential-harvesting paths with zero false positives on verified services.
* **AI/ML Neural Threat Classification**: Multi-class ML threat classification (LinearSVC + CalibratedClassifierCV) for BEC, extortion, credential harvesting, invoice fraud, and malware delivery.
* **Forensic Attribution & MITRE ATT&CK Mapping**: Generates interactive D3/SVG threat infrastructure graphs connecting origin IPs, MX records, campaigns, and adversary techniques.
* **Tamper-Evident Chain of Custody & Blockchain Notarization**: Produces cryptographically sealed SHA-256 evidence custody receipts for legal and SOC compliance.
* **Chrome / Webmail Extension**: Seamless in-browser sidepanel integration for real-time inbox scanning in Gmail and Outlook.
* **Modern SOC Dashboard**: High-performance UI built with React, Vite, Tailwind CSS, Lucide icons, and live forensic reporting.

---

## 📁 Clean Repository Structure

```text
.
├── app/                  # FastAPI Enterprise Backend Subsystem
│   ├── api/              # API endpoints (/api/parse, /api/cases, /api/campaigns, etc.)
│   ├── core/             # Configuration, logging, rate limiting & event bus
│   ├── forensics/        # Chain-of-custody, blockchain notary & PDF/HTML reports
│   ├── ml/               # AI/ML threat classifiers, BEC engine & vector DB
│   ├── models/           # Pydantic schemas & database data structures
│   ├── parsers/          # EML parser, auth, origin trace, DNS/WHOIS & URL analyzer
│   └── scoring/          # Multi-vector fraud scoring engine & heuristics
├── frontend/             # Modern React + Vite Analyst Dashboard
├── extension/            # Chrome & Browser Extension (Manifest V3)
├── models/               # Pre-trained ML classifiers, TF-IDF vectorizers & scalers
├── test_emails/          # Sample .eml benchmark suite (Clean, BEC, Phishing, Multi-hop)
├── tests/                # Automated unit, integration & scoring test suites
├── docs/                 # Architecture blueprints, playbooks & technical specs
├── data/                 # MaxMind GeoLite2 databases & incident records
├── archive/              # Preserved legacy prototypes, patches & research logs
├── docker-compose.yml    # Full-stack container orchestration
├── Dockerfile.backend    # Container definition for FastAPI backend
├── Dockerfile.frontend   # Container definition for Vite frontend
└── requirements.txt      # Python dependencies
```

---

## ⚡ Quick Start

### 1. Backend Service

```bash
# Set up virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start the FastAPI server
python3 run_server.py
# Server runs at http://localhost:8000 (Swagger docs at /docs)
```

### 2. Frontend SOC Dashboard

```bash
cd frontend
npm install
npm run dev
# Dashboard available at http://localhost:5173
```

### 3. Chrome Extension Installation

1. Navigate to `chrome://extensions/` in Chrome or Brave.
2. Enable **Developer mode** (toggle in top-right corner).
3. Click **Load unpacked** and select the `extension/` folder.

### 4. Running Test Suites

```bash
python3 tests/test_url_legitimacy.py
python3 tests/test_fraud.py
python3 tests/test_full_platform.py
```

---

## 🐳 Docker Deployment

To launch the full ecosystem (backend, frontend, cache, and vector store) in isolated containers:

```bash
docker compose up --build
```

---

## 📜 Documentation

Deep dive into the forensic specifications and architecture:
* [Technical Breakdown](docs/TECHNICAL_BREAKDOWN.md)
* [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)
* [Platform Playbook](docs/Platform_Playbook.md)
* [Executive Summary](docs/Executive_Summary.md)

---

## 🔒 Security & License

Designed for cyber defense, digital forensics, incident response teams, and security researchers. Distributed under the MIT License.
