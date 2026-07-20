import re
from typing import List, Dict, Tuple
from rapidfuzz import fuzz
from sqlalchemy.orm import Session
from app.models.database import AIDuplicateAlert, AIDuplicateMatch, AIOutputLog
from datetime import datetime
from app.core.normalizer import normalize_reference, normalize_invoice

def normalize_string(val: str) -> str:
    """
    Centralized canonical normalization wrapper
    """
    return normalize_reference(val)

def check_duplicates(
    db: Session,
    waybills: List[dict],
    invoices: List[dict],
    payments: List[dict],
    receipts: List[dict],
    speedpay: List[dict]
) -> Tuple[int, int]:
    """
    Compares records to find duplicates.
    Saves new AIDuplicateAlerts and AIDuplicateMatches to DB.
    Returns (scanned_count, generated_alerts_count).
    """
    scanned_count = len(waybills) + len(invoices) + len(payments) + len(receipts) + len(speedpay)
    new_alerts = 0

    # Retrieve existing alert identifiers to avoid creating duplicates of alerts
    existing_alerts = db.query(AIDuplicateAlert.source_record_id, AIDuplicateAlert.matched_record_id).all()
    existing_pairs = set(existing_alerts)

    # Helper to check if alert already exists (either order)
    def alert_exists(src_id: str, match_id: str) -> bool:
        return (src_id, match_id) in existing_pairs or (match_id, src_id) in existing_pairs

    # 1. Waybills Duplicate Checking
    for i in range(len(waybills)):
        for j in range(i + 1, len(waybills)):
            wb1 = waybills[i]
            wb2 = waybills[j]
            
            if alert_exists(wb1["waybillId"], wb2["waybillId"]):
                continue

            num1 = wb1["waybillNumber"]
            num2 = wb2["waybillNumber"]
            norm1 = normalize_string(num1)
            norm2 = normalize_string(num2)

            similarity = 0.0
            reason = ""
            matched_field = ""

            if norm1 == norm2 and norm1 != "":
                similarity = 100.0
                reason = f"Exact match found for normalized waybill number: {num1} and {num2}."
                matched_field = "waybillNumber"
            else:
                # Use RapidFuzz ratio on original strings
                score = fuzz.ratio(num1.upper(), num2.upper())
                if score >= 90:
                    similarity = float(score)
                    reason = f"Fuzzy match found for waybill numbers: {num1} and {num2} with high similarity ({similarity}%)."
                    matched_field = "waybillNumber"

            if similarity >= 90:
                alert = AIDuplicateAlert(
                    alert_type="WAYBILL",
                    matched_field=matched_field,
                    source_record_id=wb1["waybillId"],
                    matched_record_id=wb2["waybillId"],
                    similarity_score=similarity,
                    reason=reason,
                    review_status="Pending Review",
                    source_reference_value=num1,
                    normalized_reference_value=normalize_reference(num1)
                )
                db.add(alert)
                db.flush() # populate ID

                match_details = AIDuplicateMatch(
                    alert_id=alert.id,
                    source_details=wb1,
                    match_details=wb2
                )
                db.add(match_details)
                new_alerts += 1
                existing_pairs.add((wb1["waybillId"], wb2["waybillId"]))

    # 2. Invoices Duplicate Checking
    for i in range(len(invoices)):
        for j in range(i + 1, len(invoices)):
            inv1 = invoices[i]
            inv2 = invoices[j]

            if alert_exists(inv1["invoiceId"], inv2["invoiceId"]):
                continue

            num1 = inv1["invoiceNumber"]
            num2 = inv2["invoiceNumber"]
            norm1 = normalize_string(num1)
            norm2 = normalize_string(num2)

            similarity = 0.0
            reason = ""
            matched_field = ""

            # Check invoice number
            if norm1 == norm2 and norm1 != "":
                similarity = 100.0
                reason = f"Exact duplicate invoice number detected: {num1} and {num2}."
                matched_field = "invoiceNumber"
            else:
                score = fuzz.ratio(num1.upper(), num2.upper())
                if score >= 90:
                    similarity = float(score)
                    reason = f"Highly similar invoice numbers: {num1} and {num2}."
                    matched_field = "invoiceNumber"

            # Check matching details (Same Client + Same Amount + Same Waybill)
            if similarity < 90:
                if inv1["clientId"] == inv2["clientId"] and inv1["amount"] == inv2["amount"]:
                    if inv1["waybillNumber"] and inv2["waybillNumber"]:
                        w_norm1 = normalize_string(inv1["waybillNumber"])
                        w_norm2 = normalize_string(inv2["waybillNumber"])
                        if w_norm1 == w_norm2:
                            similarity = 95.0
                            reason = f"Invoices have matching client ({inv1['clientName']}), identical amount (PHP {inv1['amount']:,.2f}), and identical waybill association ({inv1['waybillNumber']})."
                            matched_field = "amount_and_waybill"

            if similarity >= 90:
                alert = AIDuplicateAlert(
                    alert_type="INVOICE",
                    matched_field=matched_field,
                    source_record_id=inv1["invoiceId"],
                    matched_record_id=inv2["invoiceId"],
                    similarity_score=similarity,
                    reason=reason,
                    review_status="Pending Review",
                    source_reference_value=num1,
                    normalized_reference_value=normalize_invoice(num1)
                )
                db.add(alert)
                db.flush()

                match_details = AIDuplicateMatch(
                    alert_id=alert.id,
                    source_details=inv1,
                    match_details=inv2
                )
                db.add(match_details)
                new_alerts += 1
                existing_pairs.add((inv1["invoiceId"], inv2["invoiceId"]))

    # 3. Official Receipts Duplicate Checking
    for i in range(len(receipts)):
        for j in range(i + 1, len(receipts)):
            rec1 = receipts[i]
            rec2 = receipts[j]

            if alert_exists(rec1["orId"], rec2["orId"]):
                continue

            num1 = rec1["orNumber"]
            num2 = rec2["orNumber"]
            norm1 = normalize_string(num1)
            norm2 = normalize_string(num2)

            if norm1 == norm2 and norm1 != "":
                alert = AIDuplicateAlert(
                    alert_type="OFFICIAL_RECEIPT",
                    matched_field="orNumber",
                    source_record_id=rec1["orId"],
                    matched_record_id=rec2["orId"],
                    similarity_score=100.0,
                    reason=f"Duplicate Official Receipt number detected: {num1} and {num2}.",
                    review_status="Pending Review",
                    source_reference_value=num1,
                    normalized_reference_value=normalize_reference(num1)
                )
                db.add(alert)
                db.flush()

                match_details = AIDuplicateMatch(
                    alert_id=alert.id,
                    source_details=rec1,
                    match_details=rec2
                )
                db.add(match_details)
                new_alerts += 1
                existing_pairs.add((rec1["orId"], rec2["orId"]))

    # 4. SpeedPay Reference Duplicate Checking
    for i in range(len(speedpay)):
        for j in range(i + 1, len(speedpay)):
            sp1 = speedpay[i]
            sp2 = speedpay[j]

            if alert_exists(sp1["submissionId"], sp2["submissionId"]):
                continue

            ref1 = sp1["referenceNumber"]
            ref2 = sp2["referenceNumber"]
            norm1 = normalize_string(ref1)
            norm2 = normalize_string(ref2)

            if norm1 == norm2 and norm1 != "":
                alert = AIDuplicateAlert(
                    alert_type="SPEEDPAY_REFERENCE",
                    matched_field="referenceNumber",
                    source_record_id=sp1["submissionId"],
                    matched_record_id=sp2["submissionId"],
                    similarity_score=100.0,
                    reason=f"Duplicate SpeedPay payment reference number detected: {ref1} and {ref2}.",
                    review_status="Pending Review",
                    source_reference_value=ref1,
                    normalized_reference_value=normalize_reference(ref1)
                )
                db.add(alert)
                db.flush()

                match_details = AIDuplicateMatch(
                    alert_id=alert.id,
                    source_details=sp1,
                    match_details=sp2
                )
                db.add(match_details)
                new_alerts += 1
                existing_pairs.add((sp1["submissionId"], sp2["submissionId"]))

    db.commit()
    return scanned_count, new_alerts
