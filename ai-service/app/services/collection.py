from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from app.models.database import AICollectionPriority, AICollectionRecommendation
from datetime import datetime, date
import json
from app.core.normalizer import normalize_invoice

def calculate_collection_priorities(
    db: Session,
    accounts_receivable: List[dict],
    collection_history: List[dict]
) -> Tuple[int, int]:
    """
    Ranks invoices in Accounts Receivable and updates AICollectionPriority and AICollectionRecommendation tables.
    Returns (processed_count, updated_count).
    """
    processed_count = 0
    updated_count = 0
    
    # Map collection history by invoiceId
    history_map = {}
    for hist in collection_history:
        inv_id = hist.get("invoiceId")
        if inv_id:
            if inv_id not in history_map:
                history_map[inv_id] = []
            history_map[inv_id].append(hist)

    current_date = date(2026, 7, 20) # Current simulated system date

    for ar in accounts_receivable:
        invoice_id = ar["invoiceId"]
        invoice_number = ar["invoiceNumber"]
        client_id = ar["clientId"]
        client_name = ar["clientName"]
        amount = ar["amount"]
        outstanding_balance = ar["outstandingBalance"]
        
        # Parse due date
        due_date_str = ar["dueDate"]
        try:
            due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
        except ValueError:
            due_date = current_date

        days_overdue = (current_date - due_date).days
        
        # Calculate level and basis
        priority_level = "Low"
        basis = []
        recommended_action = "No active follow-up required (within payment term)."

        # Outstanding threshold
        is_large_amount = outstanding_balance >= 50000.00
        if is_large_amount:
            basis.append(f"Outstanding balance is high (PHP {outstanding_balance:,.2f})")

        # History checks
        inv_history = history_map.get(invoice_id, [])
        unresolved_history = False
        for hist in inv_history:
            if hist.get("outcome") == "Unresolved" or "not received" in hist.get("outcome", "").lower():
                unresolved_history = True
                basis.append(f"Unresolved previous follow-up: {hist['actionTaken']} on {hist['contactDate']}.")
                break

        # Priority categorization logic
        if days_overdue > 30:
            priority_level = "Urgent" if is_large_amount else "High"
            basis.append(f"Invoice is severely overdue ({days_overdue} days).")
            recommended_action = "Initiate formal collection reminder and escalate to client finance head."
        elif days_overdue > 0:
            priority_level = "High"
            basis.append(f"Invoice is overdue ({days_overdue} days).")
            recommended_action = "Send official overdue warning email and follow up by phone."
        elif 0 <= (due_date - current_date).days <= 7:
            priority_level = "High" if is_large_amount else "Medium"
            days_left = (due_date - current_date).days
            basis.append(f"Invoice is due soon in {days_left} days.")
            recommended_action = "Send pre-due courtesy reminder email."
        else:
            # Not due yet
            if unresolved_history:
                priority_level = "Medium"
                recommended_action = "Verify SpeedPay submissions and validate client payment status."
            else:
                priority_level = "Low"
                recommended_action = "Monitor invoice aging and payment submission status."

        # Fetch existing priority record
        existing = db.query(AICollectionPriority).filter(AICollectionPriority.invoice_id == invoice_id).first()
        
        if existing:
            existing.outstanding_balance = outstanding_balance
            existing.priority_level = priority_level
            existing.explanation_basis = basis
            existing.source_invoice_number = invoice_number
            existing.normalized_invoice_number = normalize_invoice(invoice_number)
            db.flush()
            
            # Update recommendation
            rec = db.query(AICollectionRecommendation).filter(AICollectionRecommendation.priority_id == existing.id).first()
            if rec:
                # If review status is not pending, we only update if details changed, or we keep it
                rec.recommended_action = recommended_action
                rec.explanation_basis = basis
            else:
                new_rec = AICollectionRecommendation(
                    priority_id=existing.id,
                    recommended_action=recommended_action,
                    explanation_basis=basis,
                    review_status="Pending Review"
                )
                db.add(new_rec)
            
            updated_count += 1
        else:
            new_priority = AICollectionPriority(
                invoice_id=invoice_id,
                invoice_number=invoice_number,
                client_id=client_id,
                client_name=client_name,
                outstanding_balance=outstanding_balance,
                due_date=due_date,
                priority_level=priority_level,
                explanation_basis=basis,
                source_invoice_number=invoice_number,
                normalized_invoice_number=normalize_invoice(invoice_number)
            )
            db.add(new_priority)
            db.flush() # get ID
            
            new_rec = AICollectionRecommendation(
                priority_id=new_priority.id,
                recommended_action=recommended_action,
                explanation_basis=basis,
                review_status="Pending Review"
            )
            db.add(new_rec)
            updated_count += 1

        processed_count += 1

    db.commit()
    return processed_count, updated_count
