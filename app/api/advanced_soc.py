from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import requests
from typing import Dict, Any, Optional

router = APIRouter()

class ChatRequest(BaseModel):
    case_data: Dict[str, Any]
    question: str

class TakedownRequest(BaseModel):
    case_data: Dict[str, Any]

class ScreenshotRequest(BaseModel):
    url: str

@router.post("/api/sandbox/screenshot")
async def get_sandbox_screenshot(req: ScreenshotRequest):
    """
    Fetches a live screenshot of a malicious URL using an external headless browser API.
    For hackathon purposes, uses api.microlink.io for safe remote detonation.
    """
    url = req.url
    try:
        # We use a free snapshot API to avoid spinning up heavy headless Chrome locally
        # Microlink takes a screenshot safely remotely.
        api_url = f"https://api.microlink.io/?url={url}&screenshot=true&meta=false"
        response = requests.get(api_url, timeout=10)
        data = response.json()
        if data.get("status") == "success" and data.get("data", {}).get("screenshot"):
            return {"status": "success", "image_url": data["data"]["screenshot"]["url"]}
        
        # Fallback image service
        return {"status": "success", "image_url": f"https://image.thum.io/get/width/1000/crop/1000/{url}"}
    except Exception as e:
        # Fallback to a placeholder if APIs fail
        return {"status": "error", "message": str(e), "image_url": "https://via.placeholder.com/800x600?text=Screenshot+Failed+or+Blocked"}

@router.post("/api/takedown/generate")
async def generate_takedown_notice(req: TakedownRequest):
    """
    Generates a legal DMCA / Abuse Takedown email dynamically based on case indicators.
    """
    data = req.case_data
    domain = data.get("dns_intel", {}).get("domain", "[DOMAIN]")
    ip = data.get("trace", {}).get("best_guess_ip", "[IP]")
    evidence_id = data.get("custody", {}).get("evidence_id", "EV-UNKNOWN")
    
    # Try to extract registrar or hosting provider from WHOIS or tech fingerprint
    hosting = "Unknown Hosting Provider"
    whois_data = data.get("whois_intel", {}).get("raw_data", "")
    if "Registrar:" in str(whois_data):
        for line in str(whois_data).split('\n'):
            if "Registrar:" in line:
                hosting = line.split(":", 1)[1].strip()
                break

    template = f"""SUBJECT: URGENT: Abuse / Takedown Request for Malicious Activity on {domain}

To the Abuse / Legal Team at {hosting},

We are writing to officially report active malicious activity originating from infrastructure under your control.

INDICATORS OF COMPROMISE (IoCs):
- Malicious Domain: {domain}
- Originating IP Address: {ip}
- Internal Evidence ID: {evidence_id}

NATURE OF ABUSE:
This infrastructure is actively being utilized for a fraudulent email campaign (Phishing / Business Email Compromise). We have forensic proof including cryptographic DKIM/SPF misalignment, header forgery, and malicious payload distribution.

REQUIRED ACTION:
We request the immediate suspension of the domain '{domain}' and the associated hosting account to prevent further harm to end users. 

Please preserve all logs associated with this tenant for potential law enforcement subpoena.

Regards,
Security Operations Center (SOC)
"""
    return {"status": "success", "takedown_text": template}

@router.post("/api/chat")
async def chat_with_case(req: ChatRequest):
    """
    Uses Gemini to allow the analyst to interrogate the forensic data interactively.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        return {"answer": "Error: GEMINI_API_KEY environment variable is not set. Cannot run GenAI Assistant."}
        
    try:
        from google import genai
        client = genai.Client(api_key=gemini_key)
        
        # We truncate the JSON to prevent token overflow
        context_json = json.dumps(req.case_data)[:8000]
        
        prompt = f"""
You are an elite SOC Assistant (Cybersecurity AI). 
You are given the forensic JSON report for a specific malicious email case.
Answer the analyst's question accurately, concisely, and professionally based ONLY on this data.

CASE DATA:
{context_json}

ANALYST QUESTION: {req.question}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return {"answer": response.text}
    except Exception as e:
        return {"answer": f"GenAI reasoning failed: {str(e)}"}
