# Email Threat Intelligence Platform — Rebuilt Backend

This replaces the AI/ML/scoring layers flagged as broken in the August 2026
audit. The frontend, FastAPI shell, and MIME parsing from your original
project were already solid per that audit — this package is the backend
pieces you plug back in underneath them.

## What's fixed vs. the audit

| Audit finding | Fix in this rebuild |
|---|---|
| Trained on ~50-100 synthetic snippets | `legitimate`/`spam` trained on the **real** 33,716-email Enron-Spam corpus. The 5 fraud archetypes use ~1,200 combinatorially-varied template samples — clearly labeled as such in `models/model_card.json`, not oversold as "real data." |
| Heuristics override ML with hardcoded `+4.5`/`-3.0` logit bonuses | Deleted entirely. `ml/threat_classifier.py` returns the model's real calibrated probabilities, untouched. `scoring/fraud_score.py` combines signals with **fixed, documented weights** you can see and edit in one place. |
| Two disconnected/conflicting models (email classifier + SMS-trained spam model) | One unified 7-class model. The SMS-trained `spam_model.py` is retired. |
| Missing vector DB / semantic clustering deps | Out of scope for this pass — flagged as a "nice to have," not core to threat detection. Wire in `chromadb` + `sentence-transformers` later if you want campaign clustering. |
| Gemini LLM fallback rigidity | Not rebuilt here — your existing `genai_analyzer.py` fallback logic can sit on top of this pipeline unchanged; nothing here depends on it. |
| **Hardcoded Bangalore geolocation spoof** | Removed. `parsers/origin_trace.py` returns real parsed hop IPs and leaves `geolocation: null` — wire in a real MaxMind GeoLite2 DB, don't fake a city. |
| No link/URL threat analysis | New: `parsers/url_analyzer.py` — typosquat, punycode/homograph, shorteners, suspicious TLDs, IP-literal URLs, credential-keyword paths. |
| No tamper-evident forensic trail | New: `forensics/ledger.py` — SHA-256 hash-chained, append-only audit log. Demonstrated to actually detect tampering (see below). |

## Honest scope limits (say these out loud in your demo — it builds credibility)

- **No live internet lookups.** URL analysis is 100% offline heuristics — it
  does not call VirusTotal, Google Safe Browsing, or resolve shortened-URL
  redirect chains, because this environment (and likely your dev machine
  without a paid API key) can't reach those services. `url_analyzer.py` has
  a `LiveThreatIntelClient` stub that raises `NotImplementedError` rather
  than faking a "clean" result — wire in a real key when you have one.
- **"Blockchain" = a hash chain, precisely.** `forensics/ledger.py` gives you
  real tamper-evidence (cryptographically provable — see the test below),
  but it is a single-writer SHA-256 hash chain, not a distributed consensus
  network. That is the *correct* tool for chain-of-custody in a single-org
  SOC platform. Claiming more than that invites a hard question you can't
  answer well; claiming exactly this invites a good conversation about why
  it's the right primitive.
- **5 of 7 classes are template-trained.** Real Enron data anchors
  `legitimate`/`spam` (98% F1, genuinely trustworthy). The fraud archetypes
  hit ~100% F1 on their own held-out set because template data is easier to
  separate than real-world variation — say so if asked, and mention you'd
  swap in real incident data as you collect it.
- **No live WHOIS/domain-age check.** `domain_check.py` is pure typosquat
  detection (edit distance + leetspeak normalization + brand-as-hyphen-token
  patterns). Domain age needs a live WHOIS call, which needs real network
  access.

## Quick start

```bash
pip install -r requirements.txt
python -m app.ml.train_model          # retrains and writes models/*.joblib
python -m app.api.analyze path/to/email.eml   # run the full pipeline on one email
```

Two test emails are included in `test_samples/`:
- `phishing_test.eml` — SPF/DKIM/DMARC fail, typosquat sender, Reply-To
  mismatch, suspicious `.tk` link → scores **82.5/100, critical**.
- `legit_test.eml` — clean auth, no suspicious links → scores **0.46/100,
  minimal**.

To prove the forensic ledger's tamper-evidence to a judge live:
```python
from app.forensics.ledger import verify_chain
print(verify_chain())   # {"valid": True, ...}
# now edit any row in data/forensic_ledger.db directly
print(verify_chain())   # {"valid": False, "reason": "record_hash mismatch (tampered)"}
```

## Wiring this into your existing FastAPI app

Replace the body of your `app/api/analyze.py` endpoint with a call to
`app.api.analyze.analyze_email(raw_bytes)` from this package, and delete
`ml/spam_model.py`, the heuristic-override block in the old
`threat_classifier.py`, and the geolocation spoof block — they have no
replacement because they should not exist.
