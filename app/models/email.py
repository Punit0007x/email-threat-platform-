from pydantic import BaseModel
from typing import List, Optional

class AttachmentInfo(BaseModel):
    filename: str
    content_type: str

class ParsedEmail(BaseModel):
    """
    Flat JSON schema for standardizing parsed email data.
    This will be extended for ML scoring and geolocation later.
    """
    # Standard headers
    from_address: Optional[str] = None
    to_address: Optional[str] = None
    subject: Optional[str] = None
    date: Optional[str] = None
    message_id: Optional[str] = None
    reply_to: Optional[str] = None
    return_path: Optional[str] = None
    
    # Full Received chain
    received_chain: List[str] = []
    
    # Raw auth results
    authentication_results: Optional[str] = None
    
    # Body text
    body_plain: str = ""
    body_html: str = ""
    
    # Attachments (metadata only)
    attachments: List[AttachmentInfo] = []
    
    # URLs found in body
    urls: List[str] = []
