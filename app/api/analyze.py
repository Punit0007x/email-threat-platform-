from fastapi import APIRouter, UploadFile, File, HTTPException
import tempfile
import os
from app.parsers.email_parser import parse_eml_file
from app.parsers.auth_analysis import analyze_auth
from app.parsers.origin_trace import trace_origin
from app.parsers.geolocation import geolocate_ip
from app.parsers.dns_intel import query_domain_dns
from app.parsers.whois_intel import query_whois_intel
from app.parsers.ip_reputation import query_ip_reputation, expand_ip_network_context
from app.parsers.domain_recon import enumerate_subdomains
from app.parsers.history_intel import crawl_wayback_history
from app.parsers.tech_fingerprint import fingerprint_technology
from app.parsers.dork_intel import run_dork_scan
from app.parsers.infra_intel import analyze_infrastructure
from app.parsers.origin_verdict import classify_origin_verdict
from app.parsers.case_db import save_incident_case, get_all_cases, get_campaign_clusters, _check_historical_correlations, create_alert
from app.forensics.custody import generate_evidence_custody
from app.forensics.report_generator import generate_html_forensic_report
from app.scoring.text_signals import analyze_text_signals
from app.scoring.domain_check import check_domain_lookalike
from app.scoring.fraud_score import calculate_fraud_score
from app.ml.pipeline import analyze_email_ai_ml
from app.ml.graph_intel import build_forensic_attribution_graph
from app.forensics.blockchain_notary import BlockchainNotary
from app.ml.vector_db import SemanticThreatDB
from app.core.events import event_bus
from fastapi.responses import HTMLResponse

# Initialize singletons for the API
blockchain_notary = BlockchainNotary()
vector_db = SemanticThreatDB()

router = APIRouter()

@router.post("/api/parse")
async def parse_email(file: UploadFile = File(...)):
    """
    Accepts an uploaded .eml file, parses its contents, analyzes authentication headers,
    traces the origin IP, geolocates it, queries live DNS/MX records, classifies infrastructure,
    executes AI/ML neural threat classification, establishes cryptographic chain-of-custody,
    constructs relational attribution graphs, and records the case in threat campaign intelligence.
    """
    if not file.filename.endswith('.eml'):
        raise HTTPException(status_code=400, detail="File must be a .eml file")
        
    try:
        contents = await file.read()
        
        # Step 1: Cryptographic Chain-of-Custody Manifest
        custody_manifest = generate_evidence_custody(contents, file.filename)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".eml") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
            
        try:
            # Step 2: Parse the email structure
            parsed_email = parse_eml_file(tmp_path)
            
            # Step 2.5: God Level - Blockchain Notarization
            blockchain_receipt = blockchain_notary.notarize_evidence(tmp_path, parsed_email.model_dump())
            
            # Step 3: Analyze auth headers and alignment
            auth_results = analyze_auth(
                auth_header=parsed_email.authentication_results,
                from_header=parsed_email.from_address,
                return_path_header=parsed_email.return_path
            )
            
            # Step 4: Trace origin IP
            from app.parsers.advanced_network import analyze_hop_latency
            trace_results = trace_origin(parsed_email.received_chain)
            
            # God Level - Latency Triangulation
            latency_analysis = analyze_hop_latency(parsed_email.received_chain)
            trace_results["latency_triangulation"] = latency_analysis
            
            # Step 5: Geolocate each hop
            for hop in trace_results["hops"]:
                if hop["ip"]:
                    hop["geolocation"] = geolocate_ip(hop["ip"])
                else:
                    hop["geolocation"] = None
                    
            # Geolocate the best guess origin
            best_guess_ip = trace_results.get("best_guess_ip")
            if best_guess_ip:
                origin_geo = geolocate_ip(best_guess_ip)
                trace_results["best_guess_geolocation"] = origin_geo
            else:
                origin_geo = None
                trace_results["best_guess_geolocation"] = None
                
# Step 6: Live DNS & MX Intelligence
            from_domain = parsed_email.from_address.split('@')[-1].strip('>') if '@' in parsed_email.from_address else ""
            dns_intel = query_domain_dns(from_domain)
            
            # Step 6b: WHOIS / Registrar Intelligence
            whois_intel = query_whois_intel(from_domain)

            # Step 7: Origin Infrastructure Classification (Cloud / VPN / ISP)
            origin_isp = origin_geo.get("isp_org") if origin_geo else None
            infra_intel = analyze_infrastructure(best_guess_ip, origin_isp)
            
            # Step 7b: IP Reputation & DNSBL Intelligence
            ip_reputation = query_ip_reputation(best_guess_ip) if best_guess_ip else None
            
            # Step 7c: IP Network Context Expansion (ASN, CIDR, neighbors)
            ip_network_context = expand_ip_network_context(best_guess_ip) if best_guess_ip else None
            
            # Step 7d: Domain Reconnaissance (Subdomain enumeration)
            domain_recon = enumerate_subdomains(from_domain) if from_domain else None
            
            # Step 7e: Wayback Machine Historical Analysis
            history_intel = crawl_wayback_history(from_domain) if from_domain else None
            
            # Step 7f: Technology Fingerprinting (CMS, frameworks, hosting)
            tech_fingerprint = fingerprint_technology(from_domain) if from_domain else None
            
            # Step 7g: Passive Dork Scanning (OSINT)
            dork_intel = run_dork_scan(from_domain) if from_domain else None
            
            # Step 8: Heuristic & Lexical Signals
            text_signals = analyze_text_signals(
                subject=parsed_email.subject,
                body_plain=parsed_email.body_plain,
                body_html=parsed_email.body_html,
                extracted_urls=parsed_email.urls
            )
            
            domain_check = check_domain_lookalike(from_domain)
            
            # Step 8b: Origin Verdict Classification
            origin_verdict = classify_origin_verdict(
                auth_analysis=auth_results,
                infra_intel=infra_intel,
                ip_reputation=ip_reputation,
                trace_results=trace_results,
                domain_check=domain_check,
                whois_intel=whois_intel
            )
            
            # Step 9: AI/ML Threat Classification, BEC Engine & Forensic Reasoner
            ai_ml_results = analyze_email_ai_ml(
                from_address=parsed_email.from_address,
                reply_to=parsed_email.reply_to,
                subject=parsed_email.subject,
                body_plain=parsed_email.body_plain,
                body_html=parsed_email.body_html,
                attachments=parsed_email.attachments,
                urls=parsed_email.urls,
                domain_check=domain_check,
                auth_analysis=auth_results
            )
            
            # Step 9.5: God Level - Semantic Vector Matching
            full_text = f"{parsed_email.subject} {parsed_email.body_plain} {parsed_email.ocr_text}"
            semantic_matches = vector_db.find_similar_threats(full_text)
            
            # Step 10a: Threat Intelligence Correlation (Cross-case indicator matching)
            from_domain = parsed_email.from_address.split('@')[-1].strip('>') if '@' in parsed_email.from_address else ""
            best_guess_ip = trace_results.get("best_guess_ip")
            threat_correlations = _check_historical_correlations(from_domain, best_guess_ip, parsed_email.from_address)
            
            # Step 10: Fraud Scoring
            fraud_assessment = calculate_fraud_score(
                auth_analysis=auth_results,
                text_signals=text_signals,
                domain_check=domain_check,
                trace_results=trace_results,
                ai_ml_analysis=ai_ml_results,
                whois_intel=whois_intel,
                ip_reputation=ip_reputation,
                threat_correlations=threat_correlations,
                domain_recon=domain_recon,
                history_intel=history_intel,
                tech_fingerprint=tech_fingerprint,
                dork_intel=dork_intel,
                ip_network_context=ip_network_context
            )
            
            # Step 11: Graph-Based Infrastructure Attribution
            attribution_graph = build_forensic_attribution_graph(
                email_data=parsed_email.model_dump(),
                trace_results=trace_results,
                ai_ml_results=ai_ml_results,
                dns_intel=dns_intel
            )
            
            # Step 12: Unified JSON Response
            response_data = parsed_email.model_dump()
            response_data["custody"] = custody_manifest
            response_data["blockchain_receipt"] = blockchain_receipt
            response_data["semantic_matches"] = semantic_matches
            response_data["dns_intel"] = dns_intel
            response_data["whois_intel"] = whois_intel
            response_data["ip_reputation"] = ip_reputation
            response_data["ip_network_context"] = ip_network_context
            response_data["domain_recon"] = domain_recon
            response_data["history_intel"] = history_intel
            response_data["tech_fingerprint"] = tech_fingerprint
            response_data["dork_intel"] = dork_intel
            response_data["threat_correlations"] = threat_correlations
            response_data["origin_verdict"] = origin_verdict
            response_data["infra_intel"] = infra_intel
            response_data["auth_analysis"] = auth_results
            response_data["trace"] = trace_results
            response_data["text_signals"] = text_signals
            response_data["domain_check"] = domain_check
            response_data["ai_ml_analysis"] = ai_ml_results
            response_data["attribution_graph"] = attribution_graph
            response_data["fraud_assessment"] = fraud_assessment
            
            # Step 13: Persist Case & Assign Threat Campaign Cluster
            try:
                campaign_id = save_incident_case(response_data)
                response_data["campaign_id"] = campaign_id
                
                # God Level - Store in Vector DB
                vector_db.store_email(campaign_id, full_text, {"subject": parsed_email.subject, "from": parsed_email.from_address})
                
                # God Level - Publish to Kafka for asynchronous microservices
                event_bus.publish_email_ingested(campaign_id, response_data)
                
                # Step 13b: Generate Alert for High-Risk Cases
                alert_id = create_alert(response_data, fraud_assessment)
                if alert_id:
                    response_data["alert_id"] = alert_id
            except Exception:
                response_data["campaign_id"] = "CAMP-AUTONOMOUS"
            
            return response_data
            
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(f"Error in parse_email: {error_msg}")
        raise HTTPException(status_code=422, detail=f"Failed to parse email: {str(e)} - {error_msg}")

@router.post("/api/report/html", response_class=HTMLResponse)
async def export_html_report(data: dict):
    """
    Renders a printable, evidentiary HTML forensic investigation report.
    """
    return generate_html_forensic_report(data)

@router.get("/api/cases")
async def list_cases():
    """
    Retrieves recent investigated cases from SQLite forensic database.
    """
    return get_all_cases()

@router.get("/api/campaigns")
async def list_campaigns():
    """
    Retrieves aggregated threat campaigns across all investigated cases.
    """
    return get_campaign_clusters()

@router.get("/api/alerts")
async def list_alerts(limit: int = 50):
    """
    Retrieves recent high-risk alerts.
    """
    from app.parsers.case_db import get_recent_alerts
    return get_recent_alerts(limit)

@router.get("/api/alerts/stats")
async def get_alert_stats():
    """
    Retrieves alert statistics.
    """
    from app.parsers.case_db import get_alert_stats
    return get_alert_stats()

@router.post("/api/alerts/webhook")
async def configure_webhook(webhook_url: str, min_score: int = 70, enabled: bool = True):
    """
    Configure webhook for high-risk email alerts.
    """
    from app.parsers.case_db import set_webhook_config
    set_webhook_config(webhook_url, min_score, enabled)
    return {"status": "configured", "webhook_url": webhook_url, "min_score": min_score, "enabled": enabled}

@router.get("/api/alerts/webhook")
async def get_webhook_config():
    """
    Get current webhook configuration.
    """
    from app.parsers.case_db import get_webhook_config
    return get_webhook_config()

@router.get("/api/retention/config")
async def get_retention_config():
    """
    Get current retention policy configuration.
    """
    from app.forensics.custody import get_retention_config
    return get_retention_config()

@router.post("/api/retention/config")
async def set_retention_config(
    enabled: bool = None, 
    max_case_age_days: int = None,
    mask_pii_in_storage: bool = None,
    mask_pii_in_reports: bool = None
):
    """
    Update retention policy configuration.
    """
    from app.forensics.custody import set_retention_config
    return set_retention_config(enabled, max_case_age_days, mask_pii_in_storage, mask_pii_in_reports)

@router.post("/api/retention/purge")
async def run_retention_purge(max_age_days: int = None, mask_pii: bool = None):
    """
    Manually trigger retention purge of old cases.
    """
    from app.forensics.custody import apply_retention_policy
    return apply_retention_policy(max_age_days=max_age_days, mask_pii=mask_pii)

