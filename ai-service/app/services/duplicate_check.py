import re
from typing import List, Dict, Tuple, Optional
from rapidfuzz import fuzz
from sqlalchemy.orm import Session
from app.models.database import AIDuplicateAlert, AIDuplicateMatch, AIOutputLog
from app.schemas.schemas import WaybillDuplicateRequest, InvoiceDuplicateRequest, OfficialReceiptDuplicateRequest, SpeedPayDuplicateRequest
from datetime import datetime
from app.core.normalizer import normalize_reference, normalize_invoice
from app.services.foms_client import FomsClient

def normalize_string(val: str) -> str:
    """
    Centralized canonical normalization wrapper
    """
    return normalize_reference(val)

def check_waybill_duplicate(db: Session, request: WaybillDuplicateRequest, foms_client: FomsClient) -> Optional[AIDuplicateAlert]:
    waybills = foms_client.get_waybills()
    req_norm = normalize_string(request.waybillNumber)
    
    best_similarity = 0.0
    best_match = None
    reason = ""

    for wb in waybills:
        num = wb.get("waybillNumber", "")
        norm = normalize_string(num)
        
        if req_norm == norm and req_norm != "":
            best_similarity = 100.0
            best_match = wb
            reason = f"Exact match found for normalized waybill number: {request.waybillNumber} and {num}."
            break
        else:
            score = fuzz.ratio(request.waybillNumber.upper(), num.upper())
            if score >= 90 and score > best_similarity:
                best_similarity = float(score)
                best_match = wb
                reason = f"Fuzzy match found for waybill numbers: {request.waybillNumber} and {num} with high similarity ({best_similarity}%)."

    if best_similarity >= 90 and best_match:
        alert = AIDuplicateAlert(
            alert_type="WAYBILL",
            source_record_id="REQ-WAYBILL", # Using a generic ID since this is an external request
            matched_record_id=best_match["waybillId"],
            confidence_score=best_similarity,
            severity="High" if best_similarity == 100 else "Medium",
            matched_fields={"waybillNumber": request.waybillNumber},
            match_reason=reason,
            status="Pending Review",
        )
        db.add(alert)
        db.flush()
        
        match_details = AIDuplicateMatch(
            alert_id=alert.id,
            source_details=request.dict(),
            match_details=best_match
        )
        db.add(match_details)
        db.commit()
        db.refresh(alert)
        return alert

    return None

def check_invoice_duplicate(db: Session, request: InvoiceDuplicateRequest, foms_client: FomsClient) -> Optional[AIDuplicateAlert]:
    invoices = foms_client.get_invoices()
    req_norm = normalize_string(request.invoiceNumber)
    
    best_similarity = 0.0
    best_match = None
    reason = ""
    matched_field = {}

    for inv in invoices:
        num = inv.get("invoiceNumber", "")
        norm = normalize_string(num)
        
        if req_norm == norm and req_norm != "":
            best_similarity = 100.0
            best_match = inv
            reason = f"Exact duplicate invoice number detected: {request.invoiceNumber} and {num}."
            matched_field = {"invoiceNumber": request.invoiceNumber}
            break
        
        score = fuzz.ratio(request.invoiceNumber.upper(), num.upper())
        if score >= 90 and score > best_similarity:
            best_similarity = float(score)
            best_match = inv
            reason = f"Highly similar invoice numbers: {request.invoiceNumber} and {num}."
            matched_field = {"invoiceNumber": request.invoiceNumber}
            
        if best_similarity < 90:
            if request.clientId == inv.get("clientId") and request.amount == inv.get("amount"):
                if request.waybillBasis and inv.get("waybillNumber"):
                    w_norm1 = normalize_string(request.waybillBasis)
                    w_norm2 = normalize_string(inv.get("waybillNumber"))
                    if w_norm1 == w_norm2:
                        best_similarity = 95.0
                        best_match = inv
                        reason = f"Invoices have matching client, identical amount (PHP {request.amount:,.2f}), and identical waybill association."
                        matched_field = {"amount": request.amount, "waybillBasis": request.waybillBasis, "clientId": request.clientId}

    if best_similarity >= 90 and best_match:
        alert = AIDuplicateAlert(
            alert_type="INVOICE",
            source_record_id="REQ-INVOICE",
            matched_record_id=best_match["invoiceId"],
            confidence_score=best_similarity,
            severity="High" if best_similarity == 100 else "Medium",
            matched_fields=matched_field,
            match_reason=reason,
            status="Pending Review",
        )
        db.add(alert)
        db.flush()
        
        match_details = AIDuplicateMatch(
            alert_id=alert.id,
            source_details=request.dict(),
            match_details=best_match
        )
        db.add(match_details)
        db.commit()
        db.refresh(alert)
        return alert

    return None

def check_receipt_duplicate(db: Session, request: OfficialReceiptDuplicateRequest, foms_client: FomsClient) -> Optional[AIDuplicateAlert]:
    receipts = foms_client.get_official_receipts()
    req_norm = normalize_string(request.receiptNumber)
    
    for rec in receipts:
        num = rec.get("orNumber", "")
        norm = normalize_string(num)
        
        if req_norm == norm and req_norm != "":
            alert = AIDuplicateAlert(
                alert_type="OFFICIAL_RECEIPT",
                source_record_id="REQ-RECEIPT",
                matched_record_id=rec["orId"],
                confidence_score=100.0,
                severity="High",
                matched_fields={"orNumber": request.receiptNumber},
                match_reason=f"Duplicate Official Receipt number detected: {request.receiptNumber} and {num}.",
                status="Pending Review",
            )
            db.add(alert)
            db.flush()
            
            match_details = AIDuplicateMatch(
                alert_id=alert.id,
                source_details=request.dict(),
                match_details=rec
            )
            db.add(match_details)
            db.commit()
            db.refresh(alert)
            return alert

    return None

def check_speedpay_duplicate(db: Session, request: SpeedPayDuplicateRequest, foms_client: FomsClient) -> Optional[AIDuplicateAlert]:
    speedpay = foms_client.get_speedpay_submissions()
    req_norm = normalize_string(request.referenceNumber)
    
    for sp in speedpay:
        ref = sp.get("referenceNumber", "")
        norm = normalize_string(ref)
        
        if req_norm == norm and req_norm != "":
            alert = AIDuplicateAlert(
                alert_type="SPEEDPAY_REFERENCE",
                source_record_id="REQ-SPEEDPAY",
                matched_record_id=sp["submissionId"],
                confidence_score=100.0,
                severity="High",
                matched_fields={"referenceNumber": request.referenceNumber},
                match_reason=f"Duplicate SpeedPay payment reference number detected: {request.referenceNumber} and {ref}.",
                status="Pending Review",
            )
            db.add(alert)
            db.flush()
            
            match_details = AIDuplicateMatch(
                alert_id=alert.id,
                source_details=request.dict(),
                match_details=sp
            )
            db.add(match_details)
            db.commit()
            db.refresh(alert)
            return alert

    return None

def process_scanned_document(db: Session, file_bytes: bytes, filename: str, mime_type: str = "image/jpeg") -> Dict:
    """
    Process document image using Gemini 2.5 Flash for OCR extraction and RapidFuzz for duplicate checking against PostgreSQL database.
    """
    from app.services.ocr_service import extract_document_fields
    import uuid

    # 1. OCR Field Extraction via Gemini 2.0 Flash
    extracted = extract_document_fields(file_bytes, filename, mime_type)
    
    doc_type = extracted.get("documentType", "OFFICIAL_RECEIPT")
    
    # Only reject if Gemini explicitly classified the document as non-financial.
    # Valid financial document types are always accepted, even if is_valid is missing.
    valid_doc_types = {"OFFICIAL_RECEIPT", "INVOICE", "WAYBILL", "PROOF_OF_PAYMENT"}
    is_financial_doc = doc_type in valid_doc_types
    is_explicitly_invalid = (doc_type == "INVALID_DOCUMENT") or (
        extracted.get("is_valid") is False and not is_financial_doc
    )

    if is_explicitly_invalid:
        return {
            "status": "INVALID_DOCUMENT",
            "is_valid": False,
            "message": "INVALID DOCUMENT: The uploaded file is not a valid financial receipt, invoice, or waybill. Please upload a clear financial document.",
            "extracted": {
                "documentType": "INVALID_DOCUMENT",
                "documentNumber": "N/A - Non-Financial Image",
                "clientName": "Unrecognized Document",
                "amount": "0.00",
                "transactionDate": datetime.utcnow().strftime("%Y-%m-%d"),
                "referenceNumber": "N/A"
            },
            "duplicate": False,
            "confidence": 0
        }

    doc_num = extracted.get("documentNumber", f"DOC-{uuid.uuid4().hex[:6].upper()}")
    client_name = extracted.get("clientName", "Unknown Client")
    amount = extracted.get("amount", "0.00")
    tx_date = extracted.get("transactionDate", datetime.utcnow().strftime("%Y-%m-%d"))


    # 2. RapidFuzz check against existing matches in PostgreSQL
    existing_matches = db.query(AIDuplicateMatch).all()
    
    highest_score = 0.0
    matched_record = None
    reason = "No matching document found."

    req_norm = normalize_string(doc_num)

    for record in existing_matches:
        source = record.source_details or {}
        existing_num = source.get("documentNumber") or source.get("receiptNumber") or source.get("invoiceNumber") or source.get("waybillNumber") or ""
        existing_client = source.get("clientName") or ""
        
        ex_norm = normalize_string(existing_num)

        if req_norm and ex_norm and req_norm == ex_norm:
            highest_score = 100.0
            matched_record = record
            reason = f"Exact match detected for document number: {doc_num}"
            break

        if doc_num and existing_num:
            score_num = fuzz.ratio(doc_num.upper(), existing_num.upper())
            score_client = fuzz.token_sort_ratio(client_name.upper(), existing_client.upper()) if existing_client else 0
            
            combined_score = (score_num * 0.7) + (score_client * 0.3)
            if combined_score > highest_score:
                highest_score = combined_score
                matched_record = record
                reason = f"Fuzzy match detected ({highest_score:.1f}%) with document {existing_num}"

    is_duplicate = highest_score >= 85.0

    if is_duplicate:
        # Create AIDuplicateAlert in PostgreSQL
        alert = AIDuplicateAlert(
            alert_type=doc_type,
            source_record_id=f"SCAN-{uuid.uuid4().hex[:8].upper()}",
            matched_record_id=str(matched_record.id) if matched_record else "EXISTING-RECORD",
            confidence_score=highest_score,
            severity="High" if highest_score >= 95 else "Medium",
            matched_fields={"documentNumber": doc_num, "clientName": client_name, "amount": amount},
            match_reason=reason,
            status="Pending Review"
        )
        db.add(alert)
        db.flush()

        match_details = AIDuplicateMatch(
            alert_id=alert.id,
            source_details=extracted,
            match_details=matched_record.source_details if matched_record else {"status": "FLAGGED_DUPLICATE"}
        )
        db.add(match_details)
        db.commit()

        matched_record_payload = None
        if matched_record and matched_record.source_details:
            source = matched_record.source_details or {}
            matched_amount = source.get("amount") or amount
            matched_record_payload = {
                "record_id": str(matched_record.id),
                "documentNumber": source.get("documentNumber") or source.get("receiptNumber") or source.get("invoiceNumber") or source.get("waybillNumber") or doc_num,
                "clientName": source.get("clientName") or client_name or "Customer Name Not Read",
                "amount": str(matched_amount) if matched_amount is not None else "Missing",
                "transactionDate": source.get("transactionDate") or tx_date,
                "referenceNumber": source.get("referenceNumber") or ref,
                "waybillNumber": source.get("waybillNumber") or ""
            }

        return {
            "status": "FLAGGED_DUPLICATE",
            "alert_id": alert.id,
            "confidence_score": highest_score,
            "extracted": extracted,
            "matched_record": matched_record_payload,
            "reason": reason,
            "message": f"Duplicate detected ({highest_score:.1f}% similarity). Document flagged for review."
        }
    else:
        # Store as Unique Document in PostgreSQL
        match_details = AIDuplicateMatch(
            alert_id=None,
            source_details=extracted,
            match_details={"status": "UNIQUE_DOCUMENT", "cleared_at": datetime.utcnow().isoformat()}
        )
        db.add(match_details)
        db.commit()

        return {
            "status": "UNIQUE_DOCUMENT",
            "match_id": match_details.id,
            "confidence_score": highest_score,
            "extracted": extracted,
            "reason": "No duplicate detected. Cleared for FOMS normal validation.",
            "message": "Document scanned and cataloged as Unique Document."
        }

