import logging

logger = logging.getLogger(__name__)

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import numpy as np
except ImportError:
    np = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    from pdf2image import convert_from_bytes
except ImportError:
    convert_from_bytes = None

def extract_text_from_image(image_bytes: bytes) -> str:
    """Extracts text from an image using Tesseract OCR."""
    if not cv2 or not np or not pytesseract:
        return ""
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
    if not cv2 or not np:
        return urls
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return urls
        
        # Primary: OpenCV QR code detector (built-in, cross-platform)
        try:
            detector = cv2.QRCodeDetector()
            val, points, qrcode = detector.detectAndDecode(img)
            if val and val.strip():
                urls.append(val.strip())
        except Exception as e:
            logger.debug(f"OpenCV QR decode: {e}")
        
        # Secondary: pyzbar if available
        try:
            from pyzbar.pyzbar import decode
            decoded_objects = decode(img)
            for obj in decoded_objects:
                qr_data = obj.data.decode("utf-8")
                if qr_data and qr_data not in urls:
                    urls.append(qr_data)
        except Exception:
            pass
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
