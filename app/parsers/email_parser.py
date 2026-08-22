import email
from email import policy
import re
from typing import List
from app.models.email import ParsedEmail, AttachmentInfo

# Simple regex to extract URLs from text
URL_REGEX = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')

def parse_eml_file(file_path: str) -> ParsedEmail:
    """
    Parses a raw .eml file and returns a structured ParsedEmail Pydantic model.
    """
    with open(file_path, 'rb') as f:
        # We use policy.default to automatically decode headers and handle complex structures
        msg = email.message_from_binary_file(f, policy=policy.default)
    
    # We use .get_all() for 'Received' because it appears multiple times.
    # NOTE: Keeping the FULL chain in order is critical for our geolocation
    # tracing later, because we must walk backwards from the final hop to find
    # the true origin IP of the sender.
    received_chain = msg.get_all('Received', [])
    
    parsed = ParsedEmail(
        from_address=str(msg.get('From', '')),
        to_address=str(msg.get('To', '')),
        subject=str(msg.get('Subject', '')),
        date=str(msg.get('Date', '')),
        message_id=str(msg.get('Message-ID', '')),
        reply_to=str(msg.get('Reply-To', '')),
        return_path=str(msg.get('Return-Path', '')),
        received_chain=[str(r).strip() for r in received_chain],
        authentication_results=str(msg.get('Authentication-Results', '')) if msg.get('Authentication-Results') else None
    )
    
    body_plain = ""
    body_html = ""
    attachments = []
    
    # Walk the email parts to separate body text and attachments
    for part in msg.walk():
        content_type = part.get_content_type()
        content_disposition = str(part.get('Content-Disposition', ''))
        
        # Identify attachments by Content-Disposition or presence of a filename
        filename = part.get_filename()
        if 'attachment' in content_disposition or filename:
            if filename:
                attachments.append(AttachmentInfo(
                    filename=filename,
                    content_type=content_type
                ))
            continue
            
        # Extract body text (only if not a multipart container)
        if not part.is_multipart():
            try:
                payload = part.get_payload(decode=True)
                if payload:
                    decoded_text = payload.decode(part.get_content_charset() or 'utf-8', errors='replace')
                else:
                    decoded_text = ""
            except Exception:
                decoded_text = str(part.get_payload())
                
            if content_type == 'text/plain':
                body_plain += decoded_text
            elif content_type == 'text/html':
                body_html += decoded_text
                
    parsed.body_plain = body_plain.strip()
    parsed.body_html = body_html.strip()
    parsed.attachments = attachments
    
    # Extract URLs from body (plain and html)
    all_text = f"{parsed.body_plain} {parsed.body_html}"
    # Use set to remove duplicates, then convert back to list
    parsed.urls = list(set(URL_REGEX.findall(all_text)))
    
    return parsed
