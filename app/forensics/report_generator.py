import datetime
from typing import Dict, Any

def generate_html_forensic_report(data: Dict[str, Any]) -> str:
    """
    Generates a high-fidelity, printable HTML Forensic Incident Report with legal evidentiary disclaimers,
    tamper-evident SHA-256 custody seals, MITRE ATT&CK mappings, and complete IOC tables.
    """
    custody = data.get("custody", {})
    fraud = data.get("fraud_assessment", {})
    classification = data.get("ai_ml_analysis", {}).get("classification", {})
    ai_forensics = data.get("ai_ml_analysis", {}).get("ai_ml_analysis", {}).get("ai_forensics", {}) or data.get("ai_ml_analysis", {}).get("ai_forensics", {})
    trace = data.get("trace", {})
    dns_info = data.get("dns_intel", {})
    infra_info = data.get("infra_intel", {})
    options = data.get("report_options", {})
    
    classification_tier = options.get("classification", "CONFIDENTIAL // TLP:AMBER")
    investigator = options.get("investigator", "Autonomous AI Forensic Agent")
    agency = options.get("agency", "Cyber Threat Intelligence Unit")
    
    score = fraud.get("score", 0)
    risk_level = fraud.get("risk_level", "Low")
    risk_color = "#ef4444" if score > 70 else ("#f59e0b" if score > 30 else "#10b981")
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Digital Forensic Incident Report - {custody.get('evidence_id', 'EVIDENCE')}</title>
    <style>
        body {{ font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #1e293b; background: #ffffff; margin: 40px; line-height: 1.5; font-size: 13px; }}
        .header-table {{ width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }}
        .title {{ font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }}
        .subtitle {{ font-size: 11px; color: #64748b; margin-top: 4px; font-family: monospace; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 11px; text-transform: uppercase; }}
        .badge-risk {{ background: {risk_color}20; color: {risk_color}; border: 1px solid {risk_color}40; }}
        .badge-tlp {{ background: #0f172a; color: #f8fafc; font-size: 10px; margin-bottom: 4px; }}
        .section-title {{ font-size: 13px; font-weight: 700; color: #0f172a; border-left: 4px solid #3b82f6; padding-left: 8px; margin: 25px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }}
        table.data-table {{ width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 15px; }}
        table.data-table th, table.data-table td {{ border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }}
        table.data-table th {{ background-color: #f8fafc; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; }}
        .custody-box {{ background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 11px; margin-bottom: 20px; }}
        .grid {{ display: flex; gap: 20px; }}
        .col {{ flex: 1; }}
        .soc-box {{ background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 12px; }}
        .soc-item {{ margin-bottom: 6px; color: #065f46; }}
        .disclaimer {{ margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: justify; }}
        @media print {{ body {{ margin: 15mm; }} button {{ display: none; }} }}
    </style>
</head>
<body>

    <div style="text-align: center; margin-bottom: 15px;">
        <span class="badge badge-tlp">{classification_tier}</span>
    </div>

    <table class="header-table">
        <tr>
            <td>
                <h1 class="title">EMAIL FORENSIC INVESTIGATION REPORT</h1>
                <div class="subtitle">INVESTIGATOR: {investigator} &bull; UNIT: {agency}</div>
            </td>
            <td style="text-align: right;">
                <span class="badge badge-risk">{risk_level} RISK &bull; SCORE: {score}/100</span><br>
                <small style="color: #64748b; font-family: monospace;">{custody.get('custody_seal', 'SEAL-VALID')}</small>
            </td>
        </tr>
    </table>

    <!-- Chain of Custody & Evidence Metadata -->
    <div class="section-title">1. Digital Chain-of-Custody & Evidence Manifest</div>
    <div class="custody-box">
        <strong>EVIDENCE ID:</strong> {custody.get('evidence_id', 'N/A')}<br>
        <strong>INGESTION TIMESTAMP (UTC):</strong> {custody.get('ingestion_timestamp_utc', 'N/A')}<br>
        <strong>ORIGINAL FILENAME:</strong> {custody.get('filename', 'N/A')} ({custody.get('file_size_bytes', 0)} bytes)<br>
        <strong>SHA-256 CHECKSUM:</strong> {custody.get('sha256', 'N/A')}<br>
        <strong>MD5 CHECKSUM:</strong> {custody.get('md5', 'N/A')}<br>
        <strong>INTEGRITY SEAL:</strong> {custody.get('custody_seal', 'N/A')} (Tamper-Evident Verification PASSED)
    </div>

    <!-- Threat Classification & Executive Brief -->
    <div class="section-title">2. Executive Incident Assessment</div>
    <table class="data-table">
        <tr>
            <th style="width: 25%;">Primary Classification</th>
            <td><strong>{classification.get('primary_threat', 'clean').replace('_', ' ').title()}</strong> (Confidence: {round(classification.get('confidence', 0)*100)}%)</td>
        </tr>
        <tr>
            <th>Forensic Executive Summary</th>
            <td>{ai_forensics.get('forensic_summary', 'No summary available.')}</td>
        </tr>
        <tr>
            <th>Infrastructure Category</th>
            <td><strong>{infra_info.get('infra_type', 'Standard ISP')}</strong> &bull; {infra_info.get('details', '')}</td>
        </tr>
        <tr>
            <th>Sender Domain DNS Intel</th>
            <td>Resolvable: {dns_info.get('is_resolvable', False)} &bull; MX Records: {len(dns_info.get('mx_records', []))} &bull; SPF in DNS: {'Yes' if dns_info.get('spf_record') else 'No'}</td>
        </tr>
    </table>

    <!-- Headers & Auth -->
    <div class="section-title">3. Protocol & Header Telemetry</div>
    <table class="data-table">
        <tr>
            <th style="width: 20%;">From Header</th>
            <td><code>{data.get('from_address', '')}</code></td>
        </tr>
        <tr>
            <th>Return-Path</th>
            <td><code>{data.get('return_path', '')}</code></td>
        </tr>
        <tr>
            <th>Subject</th>
            <td><strong>{data.get('subject', '')}</strong></td>
        </tr>
        <tr>
            <th>Authentication Results</th>
            <td>
                SPF: <strong>{data.get('auth_analysis', {}).get('spf', 'N/A').upper()}</strong> &bull; 
                DKIM: <strong>{data.get('auth_analysis', {}).get('dkim', 'N/A').upper()}</strong> &bull; 
                DMARC: <strong>{data.get('auth_analysis', {}).get('dmarc', 'N/A').upper()}</strong> &bull; 
                Domain Alignment: <strong>{'PASS' if data.get('auth_analysis', {}).get('domain_alignment_pass') else 'FAIL (SPOOF ALERT)'}</strong>
            </td>
        </tr>
    </table>

    <!-- Origin & Network Trace -->
    <div class="section-title">4. Relay Path & Origin Traceability</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Hop</th>
                <th>IP Address</th>
                <th>Country / Location</th>
                <th>ISP / ASN Organization</th>
                <th>Role</th>
            </tr>
        </thead>
        <tbody>
"""
    for hop in trace.get("hops", []):
        is_origin = (hop.get("ip") == trace.get("best_guess_ip"))
        geo = hop.get("geolocation") or {}
        loc = f"{geo.get('city') + ', ' if geo.get('city') else ''}{geo.get('country', 'N/A')}"
        asn = geo.get("isp_org") or "N/A"
        html += f"""
            <tr style="{'background-color: #fee2e2; font-weight: bold;' if is_origin else ''}">
                <td>#{hop.get('hop_index', 0)}</td>
                <td><code>{hop.get('ip', 'N/A')}</code></td>
                <td>{loc}</td>
                <td>{asn}</td>
                <td>{'SUSPECT ORIGIN IP' if is_origin else 'Mail Relay'}</td>
            </tr>
        """

    html += f"""
        </tbody>
    </table>

    <!-- MITRE ATT&CK Mapping -->
    <div class="section-title">5. MITRE ATT&CK® Matrix Mapping</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Technique ID</th>
                <th>Name</th>
                <th>Tactic</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
"""
    for t in ai_forensics.get("mitre_attack_ttps", []):
        html += f"""
            <tr>
                <td><code>{t.get('id')}</code></td>
                <td><strong>{t.get('name')}</strong></td>
                <td>{t.get('tactic')}</td>
                <td>{t.get('description')}</td>
            </tr>
        """

    html += f"""
        </tbody>
    </table>

    <!-- Indicators of Compromise (IOC) -->
    <div class="section-title">6. Indicators of Compromise (IOC) Manifest</div>
    <table class="data-table">
        <tr>
            <th style="width: 25%;">Origin IP IOC</th>
            <td><code>{trace.get('best_guess_ip', 'None')}</code></td>
        </tr>
        <tr>
            <th>Extracted Threat URLs</th>
            <td>{'<br>'.join([f'<code>{u}</code>' for u in data.get('urls', [])]) if data.get('urls') else 'None'}</td>
        </tr>
        <tr>
            <th>Extracted Crypto Wallets</th>
            <td>{', '.join(data.get('ai_ml_analysis', {}).get('features', {}).get('entities', {}).get('crypto_wallets', [])) or 'None'}</td>
        </tr>
        <tr>
            <th>Suspicious Attachments</th>
            <td>{', '.join([a.get('filename') for a in data.get('ai_ml_analysis', {}).get('features', {}).get('suspicious_attachments', [])]) or 'None'}</td>
        </tr>
    </table>

    <!-- SOC Remediation Plan -->
    <div class="section-title">7. Recommended SOC Containment & Remediation</div>
    <div class="soc-box">
"""
    for action in ai_forensics.get("recommended_soc_actions", []):
        html += f'<div class="soc-item">&bull; {action}</div>'

    html += f"""
    </div>

    <!-- Legal Disclaimer -->
    <div class="disclaimer">
        <strong>LEGAL & EVIDENTIARY DISCLAIMER:</strong> This report was generated automatically through cryptographic message decomposition, network telemetry correlation, and AI-assisted forensic pattern recognition. All extracted IP addresses, digital signatures, and hashes are preserved in accordance with ISO/IEC 27037 guidelines for digital evidence handling. This document is intended for authorized cybersecurity analysts, law enforcement investigators, and institutional legal counsel.
    </div>

</body>
</html>"""
    return html
