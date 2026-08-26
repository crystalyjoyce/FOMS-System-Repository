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
You are a finance document classifier for a Finance Operations Management System. Analyze the uploaded image or PDF and determine whether it is a valid financial document. Only classify it as valid if it clearly appears to be an invoice, official receipt, billing statement, statement of account, or payment receipt. If the image is a selfie, person photo, random picture, scenery, meme, unrelated screenshot, or any non-financial content, return INVALID_OR_UNRELATED_IMAGE. Do not guess. If there are no clear financial document indicators such as invoice number, receipt number, amount, company header, billing table, payment reference, or official receipt details, reject the file.

Return ONLY a valid JSON object (no markdown, no extra text) matching this EXACT schema:
{
  "documentType": "OFFICIAL_RECEIPT | INVOICE | BILLING_STATEMENT | PAYMENT_RECEIPT | STATEMENT_OF_ACCOUNT | INVALID_OR_UNRELATED_IMAGE | UNKNOWN_FINANCE_DOCUMENT",
  "isAllowed": true or false,
  "confidence": 0.0 to 1.0,
  "detectedFields": {
    "invoiceNumber": "string or null",
    "officialReceiptNumber": "string or null",
    "paymentReference": "string or null",
    "companyName": "string or null",
    "clientName": "string or null",
    "amount": "string or null",
    "dateIssued": "YYYY-MM-DD or null"
  },
  "reason": "Explain what was found or why it is rejected",
  "shouldProceedToDuplicateScan": true or false
}

Rules:
- If isAllowed is false, shouldProceedToDuplicateScan must be false.
- If documentType is INVALID_OR_UNRELATED_IMAGE, stop the scan (isAllowed=false).
- If detectedFields are mostly null, stop the scan (isAllowed=false).
- If image contains a person/photo but no finance fields, reject it (isAllowed=false, documentType=INVALID_OR_UNRELATED_IMAGE).
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
                    is_allowed_flag = extracted.get("isAllowed", False)
                    confidence = float(extracted.get("confidence", 0.0))

                    # Final gate: override isAllowed based on doc type and confidence
                    if doc_type in VALID_FINANCE_DOC_TYPES and is_allowed_flag and confidence >= 0.75:
                        extracted["isAllowed"] = True
                    elif doc_type in INVALID_DOC_TYPES or not is_allowed_flag or confidence < 0.75:
                        extracted["isAllowed"] = False
                        extracted["shouldProceedToDuplicateScan"] = False
                        
                        # Normalise invalid doc type to standard value
                        if doc_type not in INVALID_DOC_TYPES:
                            extracted["documentType"] = "INVALID_OR_UNRELATED_IMAGE"
                        
                        if "detectedFields" not in extracted:
                            extracted["detectedFields"] = {}
                        
                        for field in ["invoiceNumber", "officialReceiptNumber", "paymentReference", "companyName", "clientName", "amount", "dateIssued"]:
                            extracted["detectedFields"][field] = None

                    logger.info(
                        f"[OCR] Gemini classification: type={doc_type} allowed={extracted.get('isAllowed')} "
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
        "isAllowed": False,
        "documentType": "NEEDS_GEMINI_REVIEW",
        "confidence": 0.0,
        "detectedFields": {
            "invoiceNumber": None,
            "officialReceiptNumber": None,
            "paymentReference": None,
            "companyName": None,
            "clientName": None,
            "amount": None,
            "dateIssued": datetime.utcnow().strftime("%Y-%m-%d"),
        },
        "reason": (
            "AI document classification is temporarily unavailable. "
            "The duplicate scan has been stopped to prevent false results. "
            "Please try again in a few minutes or contact your system administrator."
        ),
        "shouldProceedToDuplicateScan": False,
        "geminiUnavailable": True,
        "geminiError": reason[:300],
    }
