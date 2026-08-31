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
    "invoice overdue",
    "logged out unexpectedly",
    "login via",
    "please login",
    "re-verify",
    "confirm your identity",
    "unusual activity",
    "suspicious activity",
    "security alert"
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
    "google",
    "instagram",
    "facebook",
    "meta",
    "whatsapp",
    "netflix",
    "apple"
]

URL_SHORTENERS = [
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "rb.gy",
    "shorturl.at",
    "cutt.ly"
]

# Free hosting/tunneling domains commonly abused for phishing (excluding verified cloud/document services)
SUSPICIOUS_HOSTING_DOMAINS = [
    "trycloudflare.com",
    "cloudflare-dns.com",
    "workers.dev",
    "pages.dev",
    "ngrok.io",
    "ngrok-free.app",
    "ngrok.app",
    "serveo.net",
    "localtunnel.me",
    "loca.lt",
    "000webhostapp.com",
    "glitch.me",
    "repl.co",
    "replit.dev",
    "onrender.com",
    "surge.sh",
    "infinityfreeapp.com",
    "rf.gd",
    "epizy.com",
    "freenom.com",
    "duckdns.org",
    "freedynamicdns.net",
    "hopto.org",
    "zapto.org",
    "sytes.net",
    "ddns.net"
]

# Suspicious URL path keywords commonly seen in credential phishing pages
SUSPICIOUS_URL_PATHS = [
    "login", "signin", "sign-in", "log-in",
    "verify", "verification", "validate",
    "account", "secure", "security",
    "update", "confirm", "authenticate",
    "password", "credential", "billing",
    "payment", "wallet", "bank",
    "reset", "recover", "unlock",
    "webmail", "office365",
    "wp-admin", "webscr"
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
    "axisbank.com",
    "instagram.com",
    "facebook.com",
    "netflix.com",
    "whatsapp.com",
    "chase.com",
    "wellsfargo.com",
    "dropbox.com",
    "docusign.com"
]

# Verified legitimate platforms and providers
TRUSTED_DOMAINS = [
    "google.com", "docs.google.com", "drive.google.com", "forms.gle", "sites.google.com",
    "mail.google.com", "calendar.google.com", "accounts.google.com", "storage.googleapis.com",
    "microsoft.com", "office.com", "office365.com", "live.com", "outlook.com",
    "onedrive.com", "sharepoint.com", "azurewebsites.net", "login.microsoftonline.com",
    "apple.com", "icloud.com", "amazon.com", "aws.amazon.com", "s3.amazonaws.com",
    "github.com", "github.io", "gitlab.com", "bitbucket.org", "stackoverflow.com",
    "slack.com", "zoom.us", "dropbox.com", "salesforce.com", "zendesk.com",
    "adobe.com", "atlassian.net", "notion.so", "figma.com", "trello.com",
    "linkedin.com", "twitter.com", "x.com", "facebook.com", "instagram.com", "youtube.com",
    "paypal.com", "stripe.com", "razorpay.com", "sbi.co.in", "onlinesbi.sbi", "hdfcbank.com", "icicibank.com",
    "wordpress.com", "weebly.com", "wixsite.com", "blogspot.com"
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
    "suspicious_hosting_domain": 25,
    "suspicious_url_path": 15,
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
