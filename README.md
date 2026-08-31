# Email Threat Intelligence & Forensics Platform

An enterprise-grade email forensic analysis platform and threat scoring engine designed for the deep investigation of raw `.eml` files and live webmail streams. It features a scalable backend architecture, an interactive Security Operations Center (SOC) dashboard, and a companion browser extension for real-time analysis.

## Key Capabilities

* **MIME & Header Parsing**: Extracts rich metadata, unpacks complex multipart structures, decodes nested encodings, and identifies inline attachments and embedded URLs.
* **Cryptographic Authentication**: Validates SPF, DKIM, and DMARC alignment, ensuring Return-Path integrity and detecting domain spoofing attempts.
* **Origin Tracing & Geolocation**: Traverses RFC 822 `Received` header chains to identify true origin IPs, leveraging latency triangulation and ASN/ISP intelligence.
* **URL Security Engine**: Evaluates domain legitimacy, detecting typosquatting, homoglyphs, IP literals, tunneling hosts, and credential-harvesting patterns.
* **Machine Learning Threat Classification**: Utilizes multi-class ML classification (LinearSVC with CalibratedClassifierCV) to detect Business Email Compromise (BEC), extortion, credential harvesting, invoice fraud, and malware delivery.
* **Forensic Attribution & MITRE ATT&CK Mapping**: Generates interactive threat infrastructure graphs (connecting origin IPs, MX records, and adversary techniques) mapped to the MITRE ATT&CK framework.
* **Tamper-Evident Chain of Custody**: Produces cryptographically sealed SHA-256 evidence custody receipts, providing blockchain notarization for legal and compliance requirements.
* **Webmail Extension Integration**: Provides a seamless in-browser sidepanel for real-time inbox scanning across major providers such as Gmail and Outlook.
* **SOC Dashboard**: A high-performance analyst interface built with React, Vite, and Tailwind CSS for live forensic reporting and case management.

## Repository Structure

```text
.
├── app/                  # FastAPI Backend Subsystem
│   ├── api/              # API endpoints (/api/parse, /api/cases, /api/campaigns)
│   ├── core/             # Configuration, logging, rate limiting, and event bus
│   ├── forensics/        # Chain-of-custody, blockchain notary, and reporting
│   ├── ml/               # Threat classifiers and vector DB integrations
│   ├── models/           # Pydantic schemas and database data structures
│   ├── parsers/          # EML parser, authentication, origin trace, and DNS intel
│   └── scoring/          # Multi-vector fraud scoring engine
├── frontend/             # React + Vite SOC Dashboard
├── extension/            # Chrome Browser Extension (Manifest V3)
├── models/               # Pre-trained ML classifiers, vectorizers, and scalers
├── test_emails/          # Sample .eml benchmark suite
├── tests/                # Automated unit, integration, and scoring test suites
├── docs/                 # Architecture blueprints, playbooks, and technical specs
├── data/                 # MaxMind GeoLite2 databases and incident records
├── archive/              # Legacy prototypes and research logs
├── docker-compose.yml    # Full-stack container orchestration
├── Dockerfile.backend    # Container definition for the FastAPI backend
└── Dockerfile.frontend   # Container definition for the Vite frontend
```

## Getting Started

### Prerequisites
* Python 3.9+
* Node.js 18+ and npm
* Docker & Docker Compose (Optional, for containerized deployment)

### Local Environment Setup

#### 1. Backend Service
```bash
# Initialize and activate the virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python3 run_server.py
```
*The backend API will be available at `http://localhost:8000`. Swagger API documentation can be accessed at `http://localhost:8000/docs`.*

#### 2. Frontend SOC Dashboard
```bash
cd frontend
npm install
npm run dev
```
*The dashboard will be available at `http://localhost:5173`.*

#### 3. Browser Extension Installation
1. Open Google Chrome or Brave and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `extension/` directory.

### Docker Deployment

To launch the complete ecosystem (API, Frontend, Kafka, Redis, and Neo4j) in isolated containers:

```bash
docker compose up --build -d
```

## Testing

The repository includes a comprehensive test suite covering URL analysis, fraud detection, and platform integration.

```bash
# Ensure the virtual environment is active and the PYTHONPATH is set
source venv/bin/activate
export PYTHONPATH=.

# Run individual test suites
python3 tests/test_url_legitimacy.py
python3 tests/test_fraud.py
python3 tests/test_full_platform.py
```

## Documentation

For a deeper dive into the technical specifications, architecture, and operational guidelines, refer to the documents in the `docs/` directory:

* [Technical Breakdown](docs/TECHNICAL_BREAKDOWN.md)
* [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)
* [Platform Playbook](docs/Platform_Playbook.md)
* [Executive Summary](docs/Executive_Summary.md)

## License

This software is designed for cyber defense, digital forensics, incident response (DFIR) teams, and security researchers. Distributed under the MIT License.
