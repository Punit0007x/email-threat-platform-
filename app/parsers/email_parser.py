import email
from email import policy
import re
from typing import List
from app.models.email import ParsedEmail, AttachmentInfo
from app.parsers.advanced_vision import extract_text_from_image, extract_qr_codes, process_pdf_for_vision

# Simple regex to extract URLs from text
URL_REGEX = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')

def parse_eml_file(file_path: str) -> ParsedEmail:
    """
    Parses a raw .eml file and returns a structured ParsedEmail Pydantic model.
    """
    with open(file_path, 'rb') as f:
        # We use policy.default to automatically decode headers and handle complex structures
        msg = email.message_from_binary_file(f, policy=policy.default)
    
    # Extract all Received and X-Received headers
    received_chain = msg.get_all('Received', [])
    x_received = msg.get_all('X-Received', [])
    all_received = [str(r).strip() for r in (received_chain + x_received) if str(r).strip()]
    
    # Check for direct originating IP headers
    x_originating_ip = None
    for h in ['X-Originating-IP', 'X-OriginatingIP', 'X-Sender-IP', 'X-Real-IP', 'X-Client-IP', 'X-Forwarded-For']:
        val = msg.get(h)
        if val:
            x_originating_ip = str(val).strip('[]<> ')
            break
            
    # Capture all raw headers
    raw_headers = {}
    for k, v in msg.items():
        if k not in raw_headers:
            raw_headers[k] = str(v)
    
    parsed = ParsedEmail(
        from_address=str(msg.get('From', '')),
        to_address=str(msg.get('To', '')),
        subject=str(msg.get('Subject', '')),
        date=str(msg.get('Date', '')),
        message_id=str(msg.get('Message-ID', '')),
        reply_to=str(msg.get('Reply-To', '')),
        return_path=str(msg.get('Return-Path', '')),
        received_chain=all_received,
        authentication_results=str(msg.get('Authentication-Results', '')) if msg.get('Authentication-Results') else None,
        x_originating_ip=x_originating_ip,
        raw_headers=raw_headers
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
                
                # Advanced Vision: Run OCR/QR on attachments
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        if content_type.startswith('image/'):
                            parsed.ocr_text += " " + extract_text_from_image(payload)
                            parsed.qr_urls.extend(extract_qr_codes(payload))
                        elif content_type == 'application/pdf':
                            pdf_data = process_pdf_for_vision(payload)
                            parsed.ocr_text += " " + pdf_data.get("ocr_text", "")
                            parsed.qr_urls.extend(pdf_data.get("qr_urls", []))
                except Exception as e:
                    pass
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
