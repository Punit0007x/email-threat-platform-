import json

DATA = []

# --- 1. CLEAN / LEGITIMATE ---
clean_emails = [
    "Project status update for Q3 roadmap. Hi team, please find attached the slide deck for tomorrow's all-hands review.",
    "Meeting notes from today's sprint planning session. We agreed on the priority tasks for sprint 14.",
    "Can we reschedule our 1:1 call to Thursday afternoon? Let me know if that time works for you.",
    "Weekly engineering sync agenda: 1. Architecture migration 2. Performance benchmark 3. Open PR reviews.",
    "Thank you for reaching out regarding the partnership proposal. Our team will review and follow up next week.",
    "Quarterly financial report is now available on the internal intranet portal for all department heads.",
    "Invitation to company tech seminar: Modernizing cloud infrastructure and microservices with Kubernetes.",
    "Lunch and learn session on generative AI ethics this Friday at 12 PM in the main conference hall.",
    "Draft review: Please review the updated contract terms before we send them to the legal department.",
    "Welcome to the team! Here is your onboarding checklist and links to setting up your developer environment.",
    "Office closure announcement: The office will be closed on Monday for the national holiday.",
    "Customer feedback summary for July: Satisfaction scores increased by 8% following our latest release.",
    "Here are the logs from yesterday's server deployment. Everything completed with zero downtime.",
    "Attached is the approved budget forecast for FY 2027. Please let me know if you have questions.",
    "Reminder: Annual performance review self-evaluations are due by the end of this month.",
    "Thank you for attending the quarterly town hall. You can view the recording on our internal portal.",
    "I hope you are doing well. I wanted to inform you that, due to my father's medical condition, I won't be able to continue working from the office.",
    "Please find attached the latest UX mockups for the dashboard redesign. Looking forward to your feedback.",
    "Just a quick heads up that I will be taking PTO next week from Tuesday to Friday. I've updated my calendar.",
    "The client has approved the final statement of work. I have attached the signed copy for our records.",
    "Don't forget to submit your expense reports by EOD Friday for the current billing cycle.",
    "Can you please review the attached pull request? It addresses the memory leak issue in the background worker.",
    "Let's grab a coffee and discuss the Q4 marketing strategy later today.",
    "Congratulations to Sarah for winning the employee of the month award! Well deserved.",
    "The staging environment will be down for maintenance tonight between 2 AM and 4 AM.",
    "Please be advised that the fire alarm testing will occur tomorrow at 10:00 AM.",
    "Our new remote work policy has been uploaded to the HR portal. Please read it at your earliest convenience.",
    "Are we still on for the sync with the external auditors this afternoon?",
    "Attached is the raw dataset from the recent customer survey. Let me know if you need help analyzing it.",
    "I'm running about 5 minutes late for the standup, please start without me.",
    "Happy Friday! Just a reminder that the company picnic is happening next weekend. RSVP by Wednesday."
] * 4 # Duplicate to balance dataset

# --- 2. PHISHING / CREDENTIAL HARVESTING ---
phishing_emails = [
    "URGENT: Your Office 365 password will expire in 2 hours. Click here to verify your credentials and retain access.",
    "Security Alert: Unauthorized sign-in attempt detected on your account. Log in immediately to confirm your identity.",
    "Your mailbox storage is 98% full. Incoming messages will be blocked. Click below to upgrade your quota and verify password.",
    "HR Portal Notice: Mandatory benefit enrollment review. Please log in to your employee account to confirm details.",
    "Your Google Workspace account has been flagged for suspicious activity. Re-authenticate your password within 24 hours.",
    "IT Helpdesk: Critical security patch required for your email client. Enter your network login to continue synchronization.",
    "Suspicious login from Russia (IP: 185.220.101.5). If this was not you, reset your password immediately at our portal.",
    "Action Required: Your multi-factor authentication (MFA) token expired. Re-verify your passcode on the security page.",
    "Internal IT: Server maintenance scheduled. Confirm your active account credentials to prevent automated deletion.",
    "Account Suspension: Your access has been locked due to repeated invalid login attempts. Click here to unlock.",
    "Microsoft Identity: Re-verify your security credentials immediately to prevent email termination.",
    "Docusign: You have received an urgent document for signature. Click here to log in and sign.",
    "Service notification: Your domain email will be deactivated unless you update your login credentials now.",
    "Please verify your identity to access the secure encrypted message from HR. Click the link and enter your email password.",
    "Your Webmail account requires verification. Failure to verify within 24 hours will result in permanent account suspension.",
    "Zoom: You missed a scheduled meeting. Click here to listen to the recorded audio file by logging into your account.",
    "Action Required: Update your billing information to maintain your active subscription. Log in to your portal now.",
    "Your password was successfully reset. If you did not make this change, click here to secure your account immediately.",
    "Important message from the IT Administrator: Click the link below to migrate your mailbox to the new secure server.",
    "Due to a recent security update, we need you to confirm your email details. Follow the link to avoid account restriction.",
    "You have (1) new voicemail message from an unknown caller. Click here to authenticate and listen.",
    "Verify your account: We noticed unusual activity. Please confirm your details to continue using our services securely.",
    "Update your employee profile immediately to ensure your payroll is processed correctly this month. Click here to log in."
] * 2

# --- 3. BEC / EXECUTIVE IMPERSONATION ---
bec_emails = [
    "Are you at your desk right now? I need you to handle an urgent confidential task for me. Only reply via email.",
    "URGENT: Update my direct deposit information for the upcoming payroll cycle. Attached are my new bank routing details.",
    "I am currently in an offsite executive board meeting. I need you to purchase 5 Apple gift cards for a client presentation immediately.",
    "Quick favor: Please process an urgent wire transfer for the acquisition deposit today. Keep this strictly confidential.",
    "Please change my bank account on file for my upcoming salary paycheck. Do not process via the old account.",
    "From the desk of the CEO: Need an urgent payment sent to our partner vendor before 3 PM today. Awaiting your confirmation.",
    "Confidential acquisition: We are closing a private deal. Wire funds to the escrow account details attached.",
    "Are you available? I need you to assist with an emergency executive payment immediately while I am in meetings.",
    "From Executive Office: Urgent wire needed for foreign vendor settlement. Let me know when you are ready to execute.",
    "Direct Deposit change request: Please route my upcoming compensation to this newly opened checking account.",
    "CEO Request: Need Google Play cards purchased for the team awards today. Send photos of the back codes ASAP.",
    "I'm tied up in a conference all day. I need you to discreetly handle a wire transfer to a new vendor. Reply when ready.",
    "Please process this wire immediately. We cannot afford any delays on this partnership agreement. Confidentiality is paramount.",
    "I need you to update my payroll direct deposit to this new routing number before the cutoff time today.",
    "Can you run a quick errand for me? I need you to buy 10 Amazon gift cards for client gifts. I'll reimburse you tomorrow.",
    "This is highly confidential. I'm finalizing an acquisition and need you to initiate a SWIFT transfer to the attached offshore account.",
    "Are you in the office? I need you to bypass standard procedure for an urgent vendor payment. The board approved it.",
    "Please do not call me, I am in a board meeting. I just need you to wire the funds to the account detailed below immediately.",
    "Urgent request: Please amend my banking details for all future payroll deposits starting this week.",
    "I need a quick favor. Please purchase 5 iTunes gift cards and email me the codes right away. I am presenting them to clients."
] * 2

# --- 4. INVOICE / PAYMENT FRAUD ---
invoice_emails = [
    "INVOICE OVERDUE: Final notice regarding unpaid invoice #INV-9082. Remit payment to our updated banking account.",
    "Notice of updated remittance bank account: Our previous banking partner has changed. Process all pending wire transfers here.",
    "Outstanding billing statement: Payment of $14,500.00 is due immediately. Find updated wire transfer details in attached PDF.",
    "Supplier payment notification: Please route the upcoming invoice settlement to our new International IBAN account.",
    "Urgent payment request: Attached is the revised commercial invoice with our new corporate bank details.",
    "Billing department: Past due invoice penalty will be applied unless payment confirmation is submitted within 24 hours.",
    "Accounts Payable: Please find attached our revised statement of account with new beneficiary bank details.",
    "Wire remittance advice: Complete the overdue transfer for invoice 88219 before close of business today.",
    "Vendor invoice: Our banking details have been updated due to an annual audit. Remit all future invoices here.",
    "Attached is the proforma invoice for your recent order. Please ensure payment is routed to the new account details provided.",
    "Your payment for invoice #4459 is declined. Please wire the funds to our alternate account to avoid late fees.",
    "Please be advised that we have changed our banking institution. Update your records and send the pending payment to the attached account.",
    "Urgent: We have not received payment for the attached invoice. Please process the wire transfer immediately to avoid service disruption.",
    "Remittance update: Our accounts receivable department has issued new payment instructions. See the attached document.",
    "Final demand for payment: Invoice #99102 is 30 days past due. Please remit payment to our new holding account immediately.",
    "Please process the attached invoice for the consulting services rendered last month. Note the new routing number.",
    "Our banking details have been permanently updated. Do not send funds to the previous account. Use the attached instructions.",
    "Urgent: The wire transfer for the latest invoice bounced. Please resend the payment to our alternate corporate account."
] * 2

# --- 5. EXTORTION / BLACKMAIL ---
extortion_emails = [
    "I have recorded you through your webcam and installed malware on your device. Send $2,000 in Bitcoin to prevent public release.",
    "Security breach notice: We have compromised your private data and contacts. Pay 0.15 BTC to wallet bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh.",
    "Final warning: Your personal files will be leaked online unless payment is transferred to our Monero address immediately.",
    "Your device has been infected with Pegasus spyware. You have 48 hours to remit Bitcoin payment to this address.",
    "I know your secret password. If you do not pay $1,500 in crypto to my BTC address, I will send video to all your contacts.",
    "Blackmail alert: Your confidential records and browsing history will be published unless ransom is paid in Bitcoin.",
    "Compromised system alert: Pay 0.25 BTC to our wallet or all encrypted company files will be permanently deleted.",
    "I have full control over your device and network. I have downloaded all your sensitive files. Pay 1 BTC to the following address to prevent a data leak.",
    "Your website has been hacked. We have stolen your entire database. Send $5,000 in Ethereum or we will sell it on the dark web.",
    "We have compromised your servers and encrypted all your databases. Pay the ransom in Bitcoin within 72 hours to get the decryption key.",
    "I have embarrassing videos of you. I will send them to your family and coworkers unless you transfer $1,000 in Bitcoin to my wallet.",
    "Your company's proprietary source code has been stolen. We will release it publicly if our demand of 5 BTC is not met by Friday.",
    "I am a hacker who has breached your network. I have sensitive financial documents. Pay the ransom or I will notify the authorities.",
    "We are launching a massive DDoS attack against your infrastructure. Pay the protection fee in crypto to stop the attack immediately.",
    "Your systems are locked by our ransomware. Do not try to recover the files yourself. Pay 0.5 BTC to the provided address for the decryptor."
] * 2

# --- 6. MALWARE DELIVERY ---
malware_emails = [
    "Please find the attached macro-enabled document. Enable content and macros to view the encrypted financial statement.",
    "Shipping delivery tracking: Your package could not be delivered. Download and open the attached ZIP archive to print label.",
    "Urgent subpoena notice: Open the attached ISO disk image file to review the legal summons and complaint.",
    "Attached is the software update installer (update_security.exe). Run the executable as administrator to apply the patch.",
    "Purchase order confirmation: Download the attached RAR file and extract invoice.vbs to inspect order specifications.",
    "Court summons notification: Download the attached encrypted zip file and execute the script inside to review your court date.",
    "Bank Statement encrypted payload: Open the attached HTML file and enable script execution to decrypt your statement.",
    "E-sign document: Download attached file payload.wsf to view the legally binding contract.",
    "Your flight booking confirmation is attached. Open the PDF.exe file to print your boarding pass.",
    "Important tax document attached. Please open the spreadsheet and enable macros to view your W-2 form.",
    "We have received your resume. Please complete the attached application form (app_form.docm) and return it to us.",
    "You have a new secure fax message. Download the attached .scr file to view the document.",
    "Your account statement is ready. The attached document is password protected. Enable content to view the details.",
    "Critical security patch released for your OS. Run the attached executable to secure your system against the latest threats.",
    "Attached is the remittance advice for the recent wire transfer. Extract the archive and open the .js file to view the details.",
    "Please review the attached project proposal. Open the .doc file and enable editing to add your comments."
] * 2

# --- 7. BRAND IMPERSONATION & TYPOSQUATTING ---
brand_emails = [
    "PayPal Security: Your account has been temporarily restricted due to unauthorized activity. Verify at paypa1.com.",
    "Apple Support: Your iCloud subscription has been suspended. Update your credit card billing details to restore storage.",
    "Amazon Order Confirmation: You have purchased iPhone 16 Pro for $1,299. If you did not make this purchase, dispute here.",
    "Netflix Account Suspended: We were unable to authorize your monthly membership fee. Update payment method now.",
    "Microsoft 365: Your license has been revoked. Re-activate your enterprise subscription at rnicrosoft.com.",
    "FedEx Delivery Alert: Package #9872134 is pending customs tax clearance. Pay clearance fee at fedex-tracking-portal.net.",
    "Chase Bank Alert: Unusual debit card activity detected. Confirm your banking credentials at chase-verification-online.com.",
    "DHL Express: Your shipment delivery failed due to incorrect address. Pay rescheduling fee on dhl-portal-update.com.",
    "Bank of America: Security notice on your online banking access. Re-verify your account details now.",
    "Wells Fargo: Your online banking access has been locked for security reasons. Click here to verify your identity.",
    "LinkedIn: You have 5 new pending connection requests. Log in at link3din.com to view their profiles.",
    "Facebook Security: Someone tried to log into your account from an unrecognized device. Secure your account at faceb00k-security.com.",
    "Instagram Support: Your account will be deleted in 24 hours due to a copyright violation. Appeal here at instagram-appeals-help.com.",
    "UPS Notification: We were unable to deliver your package. Track your shipment at ups-tracking-updates.com.",
    "Spotify Premium: Your payment method failed. Update your billing details at spotify-billing-portal.com to keep your music playing.",
    "Google Security: A suspicious sign-in attempt was blocked. Review the activity at g00gle-security-alert.com."
] * 2

for text in clean_emails: DATA.append((text, "clean"))
for text in phishing_emails: DATA.append((text, "phishing_credential_harvesting"))
for text in bec_emails: DATA.append((text, "bec_executive_impersonation"))
for text in invoice_emails: DATA.append((text, "invoice_payment_fraud"))
for text in extortion_emails: DATA.append((text, "extortion_blackmail"))
for text in malware_emails: DATA.append((text, "malware_delivery"))
for text in brand_emails: DATA.append((text, "brand_impersonation"))

with open('app/ml/synthetic_dataset.json', 'w') as f:
    json.dump(DATA, f, indent=4)

print(f"Generated {len(DATA)} high-quality corporate training samples.")
