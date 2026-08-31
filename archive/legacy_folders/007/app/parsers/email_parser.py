"""
email_parser.py
-----------------
Parses a raw .eml file into headers, plaintext body, HTML body, and
attachment metadata using Python's standard library email package
(robust, well-tested MIME handling — no need to reinvent this part,
the audit correctly flagged this component as already solid).
"""
from email import message_from_bytes, policy
from email.parser import BytesParser


def parse_eml(raw_bytes: bytes) -> dict:
    msg = BytesParser(policy=policy.default).parsebytes(raw_bytes)

    headers = {k: str(v) for k, v in msg.items()}
    received_headers = [str(v) for k, v in msg.items() if k.lower() == "received"]

    text_body, html_body = "", ""
    attachments = []

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition") or "")
            if "attachment" in disposition:
                attachments.append({
                    "filename": part.get_filename(),
                    "content_type": content_type,
                    "size_bytes": len(part.get_payload(decode=True) or b""),
                })
                continue
            if content_type == "text/plain" and not text_body:
                text_body = part.get_content()
            elif content_type == "text/html" and not html_body:
                html_body = part.get_content()
    else:
        if msg.get_content_type() == "text/html":
            html_body = msg.get_content()
        else:
            text_body = msg.get_content()

    return {
        "headers": headers,
        "received_headers": received_headers,
        "subject": headers.get("Subject", ""),
        "from": headers.get("From", ""),
        "to": headers.get("To", ""),
        "text_body": text_body,
        "html_body": html_body,
        "attachments": attachments,
    }


def sender_domain(headers: dict) -> str:
    from_addr = headers.get("From", "") or ""
    if "@" in from_addr:
        return from_addr.split("@")[-1].strip(">").strip().lower()
    return ""
