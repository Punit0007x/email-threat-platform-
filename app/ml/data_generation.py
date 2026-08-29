"""
data_generation.py
-------------------
Generates rich, realistic, diverse labeled training examples for the multi-class
email threat classifier across all 5 fraud archetypes:
    - credential_harvesting
    - bec_ceo_fraud
    - invoice_fraud
    - extortion
    - malware_delivery
"""
import random

random.seed(42)

COMPANIES = [
    "Microsoft", "PayPal", "Amazon", "Chase Bank", "Wells Fargo", "Bank of America",
    "Netflix", "Google", "DocuSign", "Dropbox", "Zoom", "Apple", "Salesforce",
    "Workday", "ADP", "QuickBooks", "Stripe", "ServiceNow", "Okta", "Slack"
]

BRANDS_FOR_SPOOF = [
    "Microsoft 365", "Google Workspace", "PayPal", "Apple ID", "DocuSign",
    "Zoom Video", "Netflix Support", "Chase Online", "Adobe Cloud", "Dropbox Business",
    "Okta Identity", "Salesforce CRM", "Intuit QuickBooks", "Stripe Payments"
]

EXEC_TITLES = [
    "Chief Executive Officer", "CEO", "Chief Financial Officer", "CFO",
    "Managing Director", "VP of Finance", "President", "Executive Director",
    "Head of Operations", "Director of Human Resources", "Chief Operating Officer", "COO"
]

NAMES = [
    "Johnathan Smith", "Sarah Jenkins", "David Miller", "Priya Sharma", "Rahul Verma",
    "Emma Watson", "Michael Chang", "Anita Desai", "Robert Davis", "Jennifer Taylor",
    "Marcus Vance", "Elena Rostova", "Carlos Mendez", "Alexander Hayes"
]

VENDORS = [
    "Apex Global Logistics", "CloudScale Infrastructure Ltd", "Vertex Consulting Group",
    "Prime Media Partners", "Nexus Digital Solutions", "Strategic Tech Supplies",
    "Synergy Office Equipment", "Titan Industrial Services", "Horizon Legal Advisors"
]

AMOUNTS = [
    "$3,450.00", "$9,820.00", "$14,500.00", "$28,750.00", "$45,000.00", "$8,200.00",
    "$12,900.00", "$67,500.00", "$95,000.00", "€18,400.00", "£12,350.00", "₹1,85,000.00"
]

URGENCY_PHRASES = [
    "immediately", "within the next 2 hours", "before end of day today",
    "urgently", "without delay", "as soon as possible", "before 5:00 PM EST",
    "by EOD strictly", "as a top priority"
]

LINK_DOMAINS = [
    "secure-login-portal-v3.com", "microsoft-verify-session.net", "account-auth-center.org",
    "docusign-document-review.co", "identity-verification-portal.io", "webmail-quota-upgrade.info",
    "adp-payroll-verify.com", "chase-security-alert-center.net", "corporate-sso-login.co"
]

MALWARE_ATTACHMENTS = [
    "Invoice_AUG_2026_Scanned.pdf.exe", "Overdue_Remittance_Copy.zip", "Payment_Receipt_9921.xlsm",
    "Direct_Deposit_Form_Signed.docm", "Shipping_Manifest_DHL.iso", "Customer_Statement_Q3.vbs",
    "Legal_Subpoena_Notice.hta", "Employee_Bonus_List_Confidential.xlsm", "Signed_Agreement_Scan.scr"
]

CRYPTO_AMOUNTS = [
    "$1,200 in Bitcoin (0.018 BTC)", "$2,500 in BTC", "$3,800 in Bitcoin (BTC)",
    "$5,000 in cryptocurrency", "0.045 Bitcoin (BTC)", "$1,500 in USDT / Bitcoin"
]

CRYPTO_WALLETS = [
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "1BoatSLRHtKNngkdXEeobR76b53LETtpyT", "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo"
]


def _gen_url():
    dom = random.choice(LINK_DOMAINS)
    path = random.choice(["auth/login", "verify/identity", "session/update", "sign/document", "webmail/sync"])
    return f"https://{dom}/{path}?ref={random.randint(10000, 99999)}&user=session_token"


def gen_credential_harvesting(n=1200):
    templates = [
        # Microsoft / O365 / Workspace Password Expiration
        lambda b, u, url: (
            f"URGENT: Your {b} password will expire in 2 hours",
            f"Dear User,\n\nYour {b} corporate password is scheduled to expire today. "
            f"To prevent interruption to your mailbox synchronization and active sessions, please verify your credentials {u}.\n\n"
            f"Keep your current password by confirming identity at:\n{url}\n\n"
            f"Failure to authenticate will cause your account to be locked out.\n\nIT Support Team"
        ),
        # Account Suspension / Unauthorized Sign-in
        lambda b, u, url: (
            f"Security Alert: Unusual sign-in activity detected on your {b} account",
            f"We detected a suspicious login attempt to your {b} account from an unrecognized IP address (Moscow, Russia).\n\n"
            f"Device: Firefox / Windows 11\nLocation: Foreign Relay\n\n"
            f"If this was not you, please secure your account {u} and update your login credentials:\n{url}\n\n"
            f"If you do not confirm within 24 hours, security policy requires account termination.\n\n{b} Security Operations"
        ),
        # DocuSign / Document Signature Request
        lambda b, u, url: (
            f"Please DocuSign: Confidential Employment & Compensation Agreement",
            f"Hello,\n\nPlease review and complete the attached DocuSign envelope requested by Human Resources. "
            f"This document is time-sensitive and must be signed {u}.\n\n"
            f"Review Document & Sign securely:\n{url}\n\n"
            f"Powered by DocuSign Digital Trust Services.\nDo not forward this email."
        ),
        # Mailbox Quota Exceeded
        lambda b, u, url: (
            f"Notice: Mailbox storage quota exceeded (99.4% full)",
            f"Your corporate email storage is almost exhausted. 14 incoming messages are currently queued and cannot be delivered.\n\n"
            f"To increase your mailbox allocation and release pending messages, validate your account {u}:\n{url}\n\n"
            f"Mail Administrator System"
        ),
        # MFA / SSO Token Refresh
        lambda b, u, url: (
            f"Action Required: Re-authenticate your Single Sign-On (SSO) session",
            f"Your corporate Multi-Factor Authentication (MFA) session has expired. To maintain uninterrupted access to company applications, "
            f"re-verify your enterprise identity credentials {u}.\n\n"
            f"Access Authentication Portal:\n{url}\n\n"
            f"Global Enterprise Identity Service"
        )
    ]
    out = []
    for _ in range(n):
        brand = random.choice(BRANDS_FOR_SPOOF)
        urg = random.choice(URGENCY_PHRASES)
        url = _gen_url()
        tmpl = random.choice(templates)
        subj, body = tmpl(brand, urg, url)
        out.append((f"{subj}\n{body}", "credential_harvesting"))
    return out


def gen_bec_ceo_fraud(n=1200):
    templates = [
        # Payroll / Direct Deposit Update
        lambda exec_, name, amt, u: (
            "URGENT: Update my direct deposit information for upcoming payroll",
            f"Hi Payroll Team,\n\nI am currently in an urgent offsite board meeting and cannot take calls. "
            f"Please update my bank account details for my upcoming direct deposit paycheck {u}. "
            f"Attached are the new routing numbers. Do not process via the old account.\n\n"
            f"Please keep this matter confidential between us and confirm once the direct deposit switch is complete.\n\n"
            f"Thanks,\n{name}\n{exec_}"
        ),
        # Confidential Wire / Vendor Payment Request
        lambda exec_, name, amt, u: (
            f"Quick task - Confidential Acquisition / Payment",
            f"Hi,\n\nAre you at your desk right now? I need you to execute a confidential time-sensitive wire payment of {amt} "
            f"to our external advisor for the strategic acquisition {u}. "
            f"I cannot take phone calls as I'm in private negotiations with the board. "
            f"Let me know when you are ready so I can forward the beneficiary wire coordinates.\n\n"
            f"Regards,\n{name}\n{exec_}"
        ),
        # Gift Card Purchase Request
        lambda exec_, name, amt, u: (
            "Urgent request - Are you available?",
            f"Hello,\n\nI need a quick favor from you. I need to get several Apple / Amazon gift cards for employee recognition awards {u}. "
            f"Could you please purchase 5 gift cards totaling {amt} and scratch the backs to send me clear photos of the redemption codes? "
            f"I will sign off on your expense reimbursement immediately upon my return.\n\n"
            f"Thanks,\n{name}\n{exec_}"
        ),
        # Urgent Routing Change
        lambda exec_, name, amt, u: (
            f"Urgent wire instructions for pending settlement",
            f"Team,\n\nPlease hold the pending payment to our contractor. We received an amended invoice and the wire must be routed "
            f"to their new holding account {u}. Total amount is {amt}. "
            f"Reply to this email once you have the transfer pending.\n\n"
            f"Best,\n{name}\n{exec_}"
        )
    ]
    out = []
    for _ in range(n):
        exec_ = random.choice(EXEC_TITLES)
        name = random.choice(NAMES)
        amt = random.choice(AMOUNTS)
        urg = random.choice(URGENCY_PHRASES)
        tmpl = random.choice(templates)
        subj, body = tmpl(exec_, name, amt, urg)
        out.append((f"{subj}\n{body}", "bec_ceo_fraud"))
    return out


def gen_invoice_fraud(n=1200):
    templates = [
        # Banking Detail Update for Vendor
        lambda vendor, amt, u: (
            f"Notice of Updated Banking Details & Outstanding Remittance - {vendor}",
            f"Dear Accounts Payable,\n\nPlease be advised that {vendor} has recently transitioned our corporate banking facilities. "
            f"Effective immediately, all pending and future remittances must be sent to our new account.\n\n"
            f"Our outstanding invoice #{random.randint(10000, 99999)} for {amt} is overdue. "
            f"Please update your ERP payment records and remit funds {u} to prevent service disruption.\n\n"
            f"New Bank: First Global Commercial Bank\nAccount: 4892019482\nRouting: 021000089\n\n"
            f"Sincerely,\nFinance Department, {vendor}"
        ),
        # Overdue Invoice Demand
        lambda vendor, amt, u: (
            f"FINAL NOTICE: Overdue Invoice #{random.randint(10000, 99999)} - {vendor}",
            f"Attention: Finance & Billing,\n\nWe have not received payment for invoice #{random.randint(10000, 99999)} in the amount of {amt}. "
            f"This account is now 45 days past due. To avoid legal escalation and suspension of active service contracts, "
            f"please process the electronic wire transfer {u}.\n\n"
            f"Attached is the itemized invoice statement with remittance instructions.\n\n"
            f"Accounts Receivable Team\n{vendor}"
        ),
        # Revised Invoice with Discount
        lambda vendor, amt, u: (
            f"Revised Invoice & Early Settlement Discount - {vendor}",
            f"Hi,\n\nPlease find attached the revised invoice reflecting the agreed 5% prompt payment discount, bringing the balance to {amt}. "
            f"Kindly ensure payment is directed to our treasury account {u} to take advantage of this concession.\n\n"
            f"Thank you for your prompt partnership.\nBilling Team, {vendor}"
        )
    ]
    out = []
    for _ in range(n):
        vendor = random.choice(VENDORS)
        amt = random.choice(AMOUNTS)
        urg = random.choice(URGENCY_PHRASES)
        tmpl = random.choice(templates)
        subj, body = tmpl(vendor, amt, urg)
        out.append((f"{subj}\n{body}", "invoice_fraud"))
    return out


def gen_extortion(n=1200):
    templates = [
        # Webcam & Password Blackmail
        lambda crypto_amt, wallet, u: (
            "Security vulnerability in your operating system - Read carefully",
            f"Hello, I have recorded you through your webcam while you visited adult websites. "
            f"I have installed a Remote Access Trojan (RAT) on your system that captured your contact list and browsing history.\n\n"
            f"If you do not transfer {crypto_amt} to my Bitcoin address {u}, I will send the video recording to all your family, "
            f"colleagues, and social media contacts.\n\n"
            f"Bitcoin Address: {wallet}\n\n"
            f"You have exactly 48 hours to complete the transaction. Do not attempt to contact law enforcement or I will publish everything immediately."
        ),
        # Direct Blackmail & Leak Threat
        lambda crypto_amt, wallet, u: (
            "I have your recorded video and passwords - 48 hours notice",
            f"I recorded you through your webcam and recorded your screen activity. "
            f"Pay {crypto_amt} to wallet {wallet} or I leak everything to your contacts and social media.\n\n"
            f"Send the payment {u}. Once the transaction confirms, I will delete the files."
        ),
        # Database Ransom / Data Leak
        lambda crypto_amt, wallet, u: (
            "Your company database has been exfiltrated - Ransom Notice",
            f"We have dumped your customer records, employee PII, and financial ledgers from your unsecured cloud server. "
            f"We will publish the 250GB database on the dark web and notify regulatory authorities unless a settlement fee of {crypto_amt} is paid {u}.\n\n"
            f"Send payment to:\nBTC: {wallet}\n\n"
            f"Once payment is confirmed on the blockchain, we will delete the data and provide proof of destruction."
        ),
        # Ransomware Decryption Key Demand
        lambda crypto_amt, wallet, u: (
            "All your files have been encrypted - Decryption Instructions",
            f"Your network servers and databases have been encrypted with military-grade AES-256 ciphers. "
            f"To obtain the private decryption key, send {crypto_amt} to our Bitcoin address:\n{wallet}\n\n"
            f"You must pay {u} or the private key will be permanently destroyed."
        )
    ]
    out = []
    for _ in range(n):
        crypto_amt = random.choice(CRYPTO_AMOUNTS)
        wallet = random.choice(CRYPTO_WALLETS)
        urg = random.choice(URGENCY_PHRASES)
        tmpl = random.choice(templates)
        subj, body = tmpl(crypto_amt, wallet, urg)
        out.append((f"{subj}\n{body}", "extortion"))
    return out


def gen_malware_delivery(n=1000):
    templates = [
        # Macro-Enabled Document Lure
        lambda attach, comp, u: (
            f"Urgent: Scanned Invoice & Delivery Receipt - {comp}",
            f"Dear Sir/Madam,\n\nPlease find attached the required shipping confirmation and payment voucher '{attach}' from {comp}. "
            f"To view the protected legal document, please download the attachment and click 'Enable Content' / 'Enable Macros' in Microsoft Office {u}.\n\n"
            f"Delivery Department\n{comp}"
        ),
        # Shipping Carrier Delivery Failed
        lambda attach, comp, u: (
            f"DHL / FedEx Express: Delivery Failure Notification #{random.randint(100000, 999999)}",
            f"Your package could not be delivered due to an incorrect destination address. "
            f"Please download and open the attached shipping label archive '{attach}' to print your package return form {u}.\n\n"
            f"Package will be returned to sender in 48 hours if uncollected.\n\nGlobal Dispatch Services"
        ),
        # Resume / CV Weaponized Attachment
        lambda attach, comp, u: (
            f"Job Application: Senior Software Engineer Resume - {random.choice(NAMES)}",
            f"Dear Hiring Manager,\n\nI am applying for the open engineering position at your organization. "
            f"Please review my attached portfolio and resume '{attach}'. "
            f"I look forward to discussing how my experience aligns with your team's objectives.\n\n"
            f"Best regards,\nCandidate Portfolio"
        )
    ]
    out = []
    for _ in range(n):
        attach = random.choice(MALWARE_ATTACHMENTS)
        comp = random.choice(COMPANIES)
        urg = random.choice(URGENCY_PHRASES)
        tmpl = random.choice(templates)
        subj, body = tmpl(attach, comp, urg)
        out.append((f"{subj}\n{body}", "malware_delivery"))
    return out


def generate_all(per_class=None):
    per_class = per_class or {}
    rows = []
    rows += gen_credential_harvesting(per_class.get("credential_harvesting", 1200))
    rows += gen_bec_ceo_fraud(per_class.get("bec_ceo_fraud", 1200))
    rows += gen_invoice_fraud(per_class.get("invoice_fraud", 1200))
    rows += gen_extortion(per_class.get("extortion", 1000))
    rows += gen_malware_delivery(per_class.get("malware_delivery", 1000))
    random.shuffle(rows)
    return rows


if __name__ == "__main__":
    data = generate_all()
    print(f"Generated {len(data)} high-diversity template-augmented samples.")
    from collections import Counter
    print(Counter(label for _, label in data))
