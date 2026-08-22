# Email Threat Intelligence Platform

An end-to-end forensic analysis tool and threat scoring engine for raw `.eml` email files.

## Features

- **EML Parsing**: Decodes MIME structures, extracts headers, body contents (plain/HTML), attachments, and links.
- **Authentication Analysis**: Evaluates SPF, DKIM, and DMARC verification headers and flags `Return-Path` vs `From` domain mismatches.
- **Origin Tracing & Geolocation**: Traverses `Received` header chains backwards to identify the true origin IP and geolocates coordinates, city, country, and ASN organization via offline MaxMind GeoLite2 databases.
- **Text & Phishing Threat Signals**: Analyzes text for urgency phrases, authority impersonation, URL shorteners, and deceptive hyperlink mismatches.
- **Domain Lookalike Detection**: Zero-dependency Levenshtein distance matching for typosquatting and subdomain brand spoofing.
- **Fraud Scoring Engine**: Combines all forensic signals into a 0–100 risk score with plain-English threat rationale.
- **Interactive UI**: Modern dashboard built with React 19, Tailwind CSS v4, and Lucide icons.

## Project Structure

```
.
├── app/                  # FastAPI Backend
│   ├── api/              # API router endpoints (/api/parse)
│   ├── models/           # Pydantic data models
│   ├── parsers/          # EML, auth, origin trace & geolocation parsers
│   └── scoring/          # Fraud scoring, domain check & text signals
├── frontend/             # React + Vite frontend application
├── data/                 # MaxMind GeoLite2 database directory
├── test_emails/          # Sample .eml files for testing
└── requirements.txt      # Python dependencies
```

## Quick Start

### 1. Backend Setup

```bash
# Create virtual environment and activate
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Running Tests

```bash
python3 test_all.py
```
