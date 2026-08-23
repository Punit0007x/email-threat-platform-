import cv2
import numpy as np
import pytesseract
from pyzbar.pyzbar import decode
from pdf2image import convert_from_bytes
import logging

logger = logging.getLogger(__name__)

def extract_text_from_image(image_bytes: bytes) -> str:
    """Extracts text from an image using Tesseract OCR."""
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return ""
        # Convert to grayscale for better OCR
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        text = pytesseract.image_to_string(gray)
        return text.strip()
    except Exception as e:
        logger.warning(f"OCR Failed: {e}")
        return ""

def extract_qr_codes(image_bytes: bytes) -> list[str]:
    """Detects and extracts QR code data from an image."""
    urls = []
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return urls
        
        decoded_objects = decode(img)
        for obj in decoded_objects:
            qr_data = obj.data.decode("utf-8")
            urls.append(qr_data)
    except Exception as e:
        logger.warning(f"QR Extraction Failed: {e}")
    return urls

def process_pdf_for_vision(pdf_bytes: bytes) -> dict:
    """Converts a PDF to images and extracts OCR text and QR codes."""
    ocr_texts = []
    qr_urls = []
    try:
        images = convert_from_bytes(pdf_bytes, dpi=200)
        for image in images:
            # convert PIL Image to OpenCV format bytes
            is_success, im_buf_arr = cv2.imencode(".png", np.array(image))
            if is_success:
                image_bytes = im_buf_arr.tobytes()
                ocr_texts.append(extract_text_from_image(image_bytes))
                qr_urls.extend(extract_qr_codes(image_bytes))
    except Exception as e:
        logger.warning(f"PDF Vision Processing Failed: {e}")
        
    return {
        "ocr_text": "\n".join(ocr_texts).strip(),
        "qr_urls": list(set(qr_urls))
    }
