URGENCY_PHRASES = [
    "act now",
    "verify immediately",
    "account suspended", 
    "urgent action required",
    "your account will be closed",
    "click here immediately",
    "action required",
    "final warning",
    "update your account",
    "unauthorized login attempt",
    "payment declined",
    "invoice overdue"
]

AUTHORITY_KEYWORDS = [
    "helpdesk",
    "it support",
    "admin",
    "administrator",
    "security team",
    "compliance department",
    "sbi",
    "hdfc",
    "icici",
    "axis bank",
    "reserve bank of india",
    "income tax department",
    "police",
    "government",
    "ceo",
    "cfo",
    "human resources",
    "hr department",
    "paypal",
    "microsoft",
    "amazon",
    "google"
]

URL_SHORTENERS = [
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly"
]

SPOOFED_BRANDS = [
    "paypal.com",
    "amazon.com",
    "microsoft.com",
    "google.com",
    "apple.com",
    "sbi.co.in",
    "hdfcbank.com",
    "icicibank.com",
    "axisbank.com"
]

# Fraud Scoring Weights (Maximum theoretical score is capped at 100)
WEIGHTS = {
    "auth_fail_or_missing": 25,
    "domain_alignment_fail": 25,
    "domain_lookalike": 35,
    "urgency_phrase": 10,
    "authority_phrase": 10,
    "link_mismatch": 15,
    "url_shortener": 10,
    "suspicious_ip": 5,
    "whois_new_domain": 15,
    "whois_privacy_protected": 8,
    "whois_risky_registrar": 10,
    "ip_blocklisted": 20,
    "ip_tor_exit": 30,
    "repeat_offender": 0.5
}
