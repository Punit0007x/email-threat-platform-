from fastapi import APIRouter, UploadFile, File, HTTPException
import tempfile
import os
from app.parsers.email_parser import parse_eml_file
from app.parsers.auth_analysis import analyze_auth
from app.parsers.origin_trace import trace_origin
from app.parsers.geolocation import geolocate_ip
from app.scoring.text_signals import analyze_text_signals
from app.scoring.domain_check import check_domain_lookalike
from app.scoring.fraud_score import calculate_fraud_score

router = APIRouter()

@router.post("/api/parse")
async def parse_email(file: UploadFile = File(...)):
    """
    Accepts an uploaded .eml file, parses its contents, analyzes authentication headers,
    traces the origin IP, geolocates it, and returns a combined structured JSON response.
    """
    if not file.filename.endswith('.eml'):
        raise HTTPException(status_code=400, detail="File must be a .eml file")
        
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".eml") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
            
        try:
            # Step 1: Parse the email structure
            parsed_email = parse_eml_file(tmp_path)
            
            # Step 2: Analyze auth headers and alignment
            auth_results = analyze_auth(
                auth_header=parsed_email.authentication_results,
                from_header=parsed_email.from_address,
                return_path_header=parsed_email.return_path
            )
            
            # Step 3: Trace origin IP
            trace_results = trace_origin(parsed_email.received_chain)
            
            # Step 4: Geolocate each hop
            for hop in trace_results["hops"]:
                if hop["ip"]:
                    hop["geolocation"] = geolocate_ip(hop["ip"])
                else:
                    hop["geolocation"] = None
                    
            # Geolocate the best guess origin
            if trace_results["best_guess_ip"]:
                trace_results["best_guess_geolocation"] = geolocate_ip(trace_results["best_guess_ip"])
            else:
                trace_results["best_guess_geolocation"] = None
                
            # Step 5: Scoring
            text_signals = analyze_text_signals(
                subject=parsed_email.subject,
                body_plain=parsed_email.body_plain,
                body_html=parsed_email.body_html,
                extracted_urls=parsed_email.urls
            )
            
            domain_check = check_domain_lookalike(parsed_email.from_address.split('@')[-1].strip('>') if '@' in parsed_email.from_address else "")
            
            fraud_assessment = calculate_fraud_score(
                auth_analysis=auth_results,
                text_signals=text_signals,
                domain_check=domain_check,
                trace_results=trace_results
            )
            
            # Step 6: Combine them into one response (additive, keeps Day 1 & Day 2 structure)
            response_data = parsed_email.model_dump()
            response_data["auth_analysis"] = auth_results
            response_data["trace"] = trace_results
            response_data["text_signals"] = text_signals
            response_data["domain_check"] = domain_check
            response_data["fraud_assessment"] = fraud_assessment
            
            return response_data
            
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse email: {str(e)}")
