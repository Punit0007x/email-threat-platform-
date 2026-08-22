from fastapi import APIRouter, UploadFile, File, HTTPException
import tempfile
import os
from app.parsers.email_parser import parse_eml_file
from app.parsers.auth_analysis import analyze_auth
from app.parsers.origin_trace import trace_origin
from app.parsers.geolocation import geolocate_ip
from app.parsers.dns_intel import query_domain_dns
from app.parsers.infra_intel import analyze_infrastructure
from app.parsers.case_db import save_incident_case, get_all_cases, get_campaign_clusters
from app.forensics.custody import generate_evidence_custody
from app.forensics.report_generator import generate_html_forensic_report
from app.scoring.text_signals import analyze_text_signals
from app.scoring.domain_check import check_domain_lookalike
from app.scoring.fraud_score import calculate_fraud_score
from app.ml.pipeline import analyze_email_ai_ml
from app.ml.graph_intel import build_forensic_attribution_graph
from fastapi.responses import HTMLResponse

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
            
            # Step 3: Analyze auth headers and alignment
            auth_results = analyze_auth(
                auth_header=parsed_email.authentication_results,
                from_header=parsed_email.from_address,
                return_path_header=parsed_email.return_path
            )
            
            # Step 4: Trace origin IP
            trace_results = trace_origin(parsed_email.received_chain)
            
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
            
            # Step 7: Origin Infrastructure Classification (Cloud / VPN / ISP)
            origin_isp = origin_geo.get("isp_org") if origin_geo else None
            infra_intel = analyze_infrastructure(best_guess_ip, origin_isp)
            
            # Step 8: Heuristic & Lexical Signals
            text_signals = analyze_text_signals(
                subject=parsed_email.subject,
                body_plain=parsed_email.body_plain,
                body_html=parsed_email.body_html,
                extracted_urls=parsed_email.urls
            )
            
            domain_check = check_domain_lookalike(from_domain)
            
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
            
            # Step 10: Fraud Scoring
            fraud_assessment = calculate_fraud_score(
                auth_analysis=auth_results,
                text_signals=text_signals,
                domain_check=domain_check,
                trace_results=trace_results,
                ai_ml_analysis=ai_ml_results
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
            response_data["dns_intel"] = dns_intel
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
            except Exception:
                response_data["campaign_id"] = "CAMP-AUTONOMOUS"
            
            return response_data
            
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse email: {str(e)}")

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

