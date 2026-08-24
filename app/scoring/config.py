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
    "auth_fail_or_missing": 15,
    "domain_alignment_fail": 10,
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
    "repeat_offender": 0.5,
    "domain_many_subdomains": 10,
    "domain_suspicious_subdomains": 15,
    "history_recent_first_seen": 12,
    "history_high_volatility": 8,
    "tech_phishing_kit": 25,
    "tech_no_waf": 5,
    "dork_phishing_pages": 20,
    "dork_leaked_creds": 25,
    "dork_sensitive_files": 15,
    "dork_threat_intel": 10,
    "ip_cloud_hosting_cidr": 8,
    "ip_network_malicious_neighbors": 12
}
