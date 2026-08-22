import re
from typing import Dict, Any, Optional

# High-profile corporate executive roles frequently targeted in BEC
EXECUTIVE_TITLES = [
    r"\bceo\b", r"\bchief executive officer\b",
    r"\bcfo\b", r"\bchief financial officer\b",
    r"\bcoo\b", r"\bchief operating officer\b",
    r"\bpresident\b", r"\bmanaging director\b",
    r"\bvp of finance\b", r"\bcontroller\b",
    r"\bhead of hr\b", r"\bpayroll manager\b",
    r"\bgeneral counsel\b"
]

# Free webmail providers commonly used in display name spoofing
FREE_WEBMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
    "icloud.com", "mail.com", "protonmail.com", "zoho.com", "yandex.com"
}

# Behavioral BEC phrases
BEC_TRIGGER_PHRASES = {
    "payroll_diversion": [
        r"\bchange my (direct deposit|bank account|payroll details)\b",
        r"\bupdate my bank account for (my next|the upcoming) (paycheck|payroll)\b",
        r"\bwire my paycheck\b",
        r"\bnew direct deposit form\b"
    ],
    "gift_card_scam": [
        r"\bbuy (some )?(apple|itunes|google play|amazon|steam) gift cards\b",
        r"\bneed you to get (me )?(some )?gift cards\b",
        r"\bscratch the back and (send|email) (me )?the codes\b",
        r"\breimburse you (right after|later today|tomorrow)\b"
    ],
    "vendor_wire_diversion": [
        r"\bupdated banking (instructions|details|information)\b",
        r"\bour bank account has been changed\b",
        r"\bdo not send funds to the old account\b",
        r"\bprocess this wire (asap|immediately|today)\b",
        r"\bnew account details attached\b"
    ],
    "conversational_lure": [
        r"\bare you (at your desk|in the office|available)\b",
        r"\bneed a quick favor\b",
        r"\bi am in a meeting (right now|and cannot speak)\b",
        r"\bonly reply via (email|text)\b",
        r"\bkeep this strictly confidential\b"
    ]
}

def parse_display_name_and_address(from_header: str) -> tuple[str, str, str]:
    """Extracts (display_name, email_address, domain) from a From header."""
    if not from_header:
        return "", "", ""
    
    # Regex to extract "Display Name" <email@domain.com>
    match = re.match(r'^(?:["\']?([^"\'<]+)["\']?\s*)?(?:<([^>]+)>)?$', from_header.strip())
    if match:
        display_name = (match.group(1) or "").strip()
        address = (match.group(2) or match.group(1) or "").strip().lower()
    else:
        display_name = ""
        address = from_header.strip().lower()
        
    if "@" in address:
        domain = address.split("@")[-1]
    else:
        domain = ""
        
    return display_name, address, domain

def analyze_bec_threat(
    from_header: str,
    reply_to_header: Optional[str],
    subject: str,
    body_text: str
) -> Dict[str, Any]:
    """
    Analyzes email for Business Email Compromise (BEC) patterns, VIP display name spoofing,
    and conversational manipulation vectors.
    """
    display_name, sender_address, sender_domain = parse_display_name_and_address(from_header)
    full_content = f"{subject} {body_text}".lower()
    
    bec_score = 0
    indicators = []
    
    # 1. Executive / VIP Title in Display Name or Body
    is_vip_impersonation = False
    for title_pat in EXECUTIVE_TITLES:
        if re.search(title_pat, display_name, re.IGNORECASE) or re.search(title_pat, subject, re.IGNORECASE):
            is_vip_impersonation = True
            indicators.append(f"Executive title detected in header: {display_name or subject}")
            bec_score += 25
            break
            
    # 2. Display Name Spoofing via Free Webmail (e.g. "CEO Name <ceo123@gmail.com>")
    has_display_name_mismatch = False
    if display_name and (" " in display_name or "." in display_name):
        if sender_domain in FREE_WEBMAIL_DOMAINS:
            has_display_name_mismatch = True
            indicators.append(f"High-risk sender pattern: Corporate name '{display_name}' sent from public free webmail (@{sender_domain})")
            bec_score += 35

    # 3. Reply-To Hijack Check
    reply_to_mismatch = False
    if reply_to_header:
        _, reply_address, reply_domain = parse_display_name_and_address(reply_to_header)
        if reply_domain and sender_domain and reply_domain != sender_domain:
            reply_to_mismatch = True
            indicators.append(f"Reply-To address mismatch: Replies directed to '{reply_address}', differing from sender domain '{sender_domain}'")
            bec_score += 30

    # 4. Behavioral Pattern Matching
    matched_scenarios = []
    for scenario_name, patterns in BEC_TRIGGER_PHRASES.items():
        for pat in patterns:
            if re.search(pat, full_content, re.IGNORECASE):
                scenario_label = scenario_name.replace("_", " ").title()
                matched_scenarios.append(scenario_label)
                indicators.append(f"BEC behavioral trigger detected: {scenario_label}")
                bec_score += 25
                break

    # Cap score
    bec_confidence_score = min(bec_score, 100)
    
    # Determine risk level
    if bec_confidence_score >= 70:
        bec_risk = "High"
    elif bec_confidence_score >= 35:
        bec_risk = "Medium"
    elif bec_confidence_score > 0:
        bec_risk = "Low"
    else:
        bec_risk = "None"

    return {
        "bec_confidence_score": bec_confidence_score,
        "bec_risk_level": bec_risk,
        "is_vip_impersonation": is_vip_impersonation,
        "has_display_name_mismatch": has_display_name_mismatch,
        "reply_to_mismatch": reply_to_mismatch,
        "matched_scenarios": list(set(matched_scenarios)),
        "bec_indicators": indicators
    }
