import os
import json
import re
import logging
import base64
import requests
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Document types that are valid financial documents
VALID_FINANCE_DOC_TYPES = {
    "OFFICIAL_RECEIPT",
    "INVOICE",
    "BILLING_STATEMENT",
    "WAYBILL",
    "PROOF_OF_PAYMENT",
    "PAYMENT_RECEIPT",
    "STATEMENT_OF_ACCOUNT",
}

# Document types that explicitly signal an invalid upload
INVALID_DOC_TYPES = {
    "INVALID_DOCUMENT",
    "INVALID_OR_UNRELATED_IMAGE",
    "PERSON_PHOTO",
    "SELFIE",
    "NON_FINANCIAL_DOCUMENT",
    "RANDOM_SCREENSHOT",
    "UNKNOWN_IMAGE",
}

# Gemini classification prompt — strict finance-document gate
_CLASSIFICATION_PROMPT = """
You are a strict financial document classifier for a Finance Operations Management System (FOMS).

Your ONLY job is to determine whether the uploaded image is a valid financial document.

VALID FINANCIAL DOCUMENTS (classify as valid if the image clearly shows one of these):
- Official Receipt (OR) — any receipt issued by a business for payment received, including handwritten ones
- Sales Invoice or Billing Invoice — document billing a client for goods/services
- Delivery Receipt, Waybill, or Airwaybill — logistics/delivery document with consignment number
- Proof of Payment — bank slip, GCash screenshot, PayMaya confirmation, SpeedPay receipt, online banking confirmation
- Billing Statement or Statement of Account — a summary of charges from a company to a client
- Purchase Order or Payment Voucher — internal finance control documents

REQUIRED financial document indicators (at least 2 must be present):
- Invoice number / OR number / Receipt number / Waybill number / Reference number
- Company name / Business name / Merchant header
- Client name or customer name
- Amount, Total, or Grand Total (numeric currency value)
- Date of issue or transaction date
- Payment method (cash, check, bank transfer, GCash, etc.)
- Billing table or itemized charges
- Official stamp, watermark, or signature field

INVALID — reject and return INVALID_OR_UNRELATED_IMAGE if the image is:
- A selfie, portrait, or any photo of a human face or person (even partially visible)
- A photo of an animal, food, scenery, place, or object
- A blank or nearly blank white/dark image
- A meme, wallpaper, or decorative image
- A screenshot of a social media app, gaming app, or entertainment platform
- A school photo, ID photo, event photo
- A diagram, flowchart, organizational chart, or technical schematic
- A photo of a product (grocery item, appliance, clothing, etc.)
- Any image where NO financial document indicators are visible

STRICT RULE: Do NOT guess. Do NOT be lenient. If you cannot clearly identify at least 2 required financial document indicators listed above, return INVALID_OR_UNRELATED_IMAGE.

Return ONLY a valid JSON object (no markdown, no extra text):
{
    "is_valid": true or false,
    "documentType": "OFFICIAL_RECEIPT | INVOICE | BILLING_STATEMENT | WAYBILL | PROOF_OF_PAYMENT | STATEMENT_OF_ACCOUNT | INVALID_OR_UNRELATED_IMAGE",
    "confidence": 0.0 to 1.0,
    "documentNumber": "Extracted invoice/receipt/waybill/OR number, or null if not found",
    "clientName": "Extracted client or company name, or null if not found",
    "amount": "FINAL GRAND TOTAL / TOTAL AMOUNT only — never subtotal, VAT, or line-item. Return a numeric float string if clearly labeled, otherwise null",
    "transactionDate": "YYYY-MM-DD format, or null if not found",
    "referenceNumber": "Extracted reference/transaction ID, or null if not found",
    "detectedFinancialIndicators": ["list", "of", "indicators", "found"],
    "validationMessage": "Brief explanation of what was detected or why the document was rejected"
}
"""


def extract_document_fields(file_bytes: bytes, filename: str, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    """
    Extracts structured financial document fields using Gemini 2.5 Flash Multimodal Vision API.

    IMPORTANT: If Gemini is unavailable (quota, key error, network), this returns a
    NEEDS_GEMINI_REVIEW response that BLOCKS the duplicate scan. We never auto-approve
    a document when we cannot visually inspect its content.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    if gemini_api_key and gemini_api_key not in ("your_gemini_api_key_here", ""):
        try:
            # Handle mime type fallback
            if not mime_type or mime_type == "application/octet-stream":
                if filename.lower().endswith(".pdf"):
                    mime_type = "application/pdf"
                elif filename.lower().endswith(".png"):
                    mime_type = "image/png"
                else:
                    mime_type = "image/jpeg"

            encoded_image = base64.b64encode(file_bytes).decode("utf-8")
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": _CLASSIFICATION_PROMPT},
                            {"inlineData": {"mime_type": mime_type, "data": encoded_image}}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.1  # Low temperature = more deterministic classification
                }
            }

            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_api_key}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=60
            )

            if response.status_code == 200:
                result = response.json()
                candidate_text = (
                    result.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text")
                )
                if candidate_text:
                    extracted = json.loads(candidate_text)

                    doc_type = extracted.get("documentType", "INVALID_OR_UNRELATED_IMAGE")
                    is_valid_flag = extracted.get("is_valid", False)
                    confidence = float(extracted.get("confidence", 0.0))

                    # Final gate: override is_valid based on doc type and confidence
                    if doc_type in VALID_FINANCE_DOC_TYPES and is_valid_flag and confidence >= 0.70:
                        extracted["is_valid"] = True
                    elif doc_type in INVALID_DOC_TYPES or not is_valid_flag or confidence < 0.70:
                        extracted["is_valid"] = False
                        # Normalise invalid doc type to standard value
                        if doc_type not in INVALID_DOC_TYPES:
                            extracted["documentType"] = "INVALID_OR_UNRELATED_IMAGE"
                        extracted["documentNumber"] = None
                        extracted["clientName"] = None
                        extracted["amount"] = None
                        extracted["referenceNumber"] = None

                    logger.info(
                        f"[OCR] Gemini classification: type={doc_type} valid={extracted['is_valid']} "
                        f"confidence={confidence:.2f} file={filename}"
                    )
                    return extracted

            elif response.status_code == 401:
                raise RuntimeError(
                    "Gemini authentication failed: the configured API key is invalid or expired. "
                    "Update GEMINI_API_KEY with a valid Google AI Studio key."
                )
            else:
                raise RuntimeError(
                    f"Gemini REST call failed with HTTP {response.status_code}: {response.text[:400]}"
                )

        except Exception as e:
            err_str = str(e)
            if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                logger.warning(
                    "[OCR] Gemini API quota exhausted (429). "
                    "Blocking scan — cannot classify document without AI inspection."
                )
            else:
                logger.warning(
                    f"[OCR] Gemini extraction call failed: ({err_str}). "
                    "Blocking scan — cannot auto-approve without Gemini."
                )
            # CRITICAL: Do NOT fall back to auto-approval.
            # Return a blocked state so the scan pipeline stops.
            return _gemini_unavailable_response(filename, err_str)

    # No API key configured at all
    logger.warning("[OCR] No GEMINI_API_KEY configured. Blocking scan — AI classification required.")
    return _gemini_unavailable_response(filename, "No Gemini API key configured.")


def _gemini_unavailable_response(filename: str, reason: str) -> Dict[str, Any]:
    """
    Returned when Gemini is unavailable (quota exhausted, bad key, network error, not configured).

    This response BLOCKS the duplicate scan pipeline. We never auto-approve a document
    when we cannot visually inspect its content with AI.
    """
    return {
        "is_valid": False,
        "documentType": "NEEDS_GEMINI_REVIEW",
        "confidence": 0.0,
        "documentNumber": None,
        "clientName": None,
        "amount": None,
        "transactionDate": datetime.utcnow().strftime("%Y-%m-%d"),
        "referenceNumber": None,
        "detectedFinancialIndicators": [],
        "validationMessage": (
            "AI document classification is temporarily unavailable. "
            "The duplicate scan has been stopped to prevent false results. "
            "Please try again in a few minutes or contact your system administrator."
        ),
        "geminiUnavailable": True,
        "geminiError": reason[:300],
    }
