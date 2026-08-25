from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db, AICollectionRun, AICollectionPriority, AIPriorityFactor, AIRecommendation, AIReviewHistory
from app.schemas.schemas import ReadinessResponse, CollectionPrioritySchema, MessageResponse, PriorityFactorSchema, RecommendationDecisionRequest
from app.services.collection import calculate_collection_priorities
from app.services.foms_client import FomsClient
from app.auth.policies import require_roles
from app.constants.roles import (
    Roles, COLLECTION_VIEW_ROLES, COLLECTION_GENERATE_ROLES,
    RECOMMENDATION_VIEW_ROLES, RECOMMENDATION_DECIDE_ROLES
)
from datetime import datetime
from typing import List
import uuid

router = APIRouter()

def get_foms_client():
    return FomsClient()


@router.get("/readiness", response_model=ReadinessResponse)
def get_data_readiness(
    foms_client: FomsClient = Depends(get_foms_client),
    payload: dict = Depends(require_roles(*COLLECTION_VIEW_ROLES))
):
    """
    Get data readiness status for collection priority generation.
    Allowed: Financial Manager, Head Accountant, Accountant.
    """
    ar_data = foms_client.get_accounts_receivable()
    
    total = len(ar_data)
    ready = sum(1 for ar in ar_data if ar.get("outstandingBalance") is not None and ar.get("dueDate"))
    incomplete = total - ready
    
    return ReadinessResponse(
        retrieval_time=datetime.utcnow(),
        total_record_count=total,
        ready_count=ready,
        incomplete_count=incomplete,
        invalid_count=0
    )


@router.post("/priorities/generate", response_model=MessageResponse)
def generate_collection_priorities(
    db: Session = Depends(get_db),
    foms_client: FomsClient = Depends(get_foms_client),
    payload: dict = Depends(require_roles(*COLLECTION_GENERATE_ROLES))
):
    """
    Generate collection priorities from FOMS AR data.
    Allowed: Financial Manager, Head Accountant, Accountant.
    """
    trace_id = str(uuid.uuid4())
    processed, updated = calculate_collection_priorities(db, foms_client, trace_id=trace_id)
    return MessageResponse(
        success=True, 
        message=f"Successfully processed {processed} records and generated {updated} priorities.",
        traceId=trace_id
    )


@router.get("/priorities")
def get_priorities(
    db: Session = Depends(get_db),
    foms_client: FomsClient = Depends(get_foms_client),
    payload: dict = Depends(require_roles(*COLLECTION_VIEW_ROLES))
):
    """
    List collection priorities.
    Allowed: Financial Manager, Head Accountant, Accountant.
    Client-ID filtering handled by JWT claims — never trust frontend headers.
    """
    try:
        query = db.query(AICollectionPriority)

        # §10 Client Data Isolation — use JWT claim, not header
        user_role = payload.get("role", "")
        if user_role == "Client":
            client_id = payload.get("client_id", "")
            if client_id:
                query = query.filter(AICollectionPriority.client_id == client_id)
            else:
                return []  # No client_id in token — return empty safely
            
        priorities = query.all()
        
        ar_map = {}
        try:
            ar_list = foms_client.get_accounts_receivable()
            ar_map = {ar.get("invoiceId") or ar.get("id"): ar for ar in ar_list}
        except Exception:
            pass

        result = []
        for p in priorities:
            factors = db.query(AIPriorityFactor).filter(AIPriorityFactor.priority_result_id == p.id).all()
            factor_list = [{"name": f.factor_name, "value": f.factor_value, "contribution": float(f.contribution)} for f in factors]
            
            ar_info = ar_map.get(p.invoice_id) or {}
            
            result.append({
                "id": p.id,
                "invoice_number": p.invoice_id,
                "normalized_invoice_number": p.invoice_id,
                "client_name": ar_info.get("clientName") or "Speedex Partner",
                "client_id": p.client_id,
                "outstanding_balance": float(ar_info.get("outstandingBalance") or ar_info.get("totalOutstanding") or 0.0),
                "due_date": ar_info.get("dueDate") or ar_info.get("lastPaymentDate") or "2026-07-30",
                "priority_level": p.priority,
                "score": float(p.score),
                "explanation": p.explanation,
                "factors": factor_list,
                "created_at": p.created_at.isoformat() if p.created_at else None
            })
        return result
    except Exception:
        return []


@router.get("/recommendations")
def get_collection_recommendations(
    db: Session = Depends(get_db),
    foms_client: FomsClient = Depends(get_foms_client),
    status: str = "ALL",
    payload: dict = Depends(require_roles(*RECOMMENDATION_VIEW_ROLES))
):
    """
    List collection recommendations.
    Allowed: Financial Manager, Head Accountant, Accountant, Coordinator, Assistant FM.
    """
    try:
        history_records = db.query(AIReviewHistory).filter(AIReviewHistory.target_type == "COLLECTION_RECOMMENDATION").all()
        history_map = {r.target_id: r for r in history_records}

        # Build result from DB records first
        query = db.query(AIRecommendation, AICollectionPriority).join(
            AICollectionPriority, AIRecommendation.priority_result_id == AICollectionPriority.id
        )
        ar_map = {}
        try:
            ar_list = foms_client.get_accounts_receivable()
            ar_map = {ar.get("invoiceId") or ar.get("id"): ar for ar in ar_list}
        except Exception:
            pass

        result = []
        for r, p in query.all():
            if status != "ALL" and status not in r.status:
                continue
            ar_info = ar_map.get(p.invoice_id) or {}
            history = history_map.get(str(r.id))
            is_reviewed = history is not None or (r.status and r.status != "Pending Review")
            result.append({
                "id": r.id,
                "priority_result_id": r.priority_result_id,
                "recommendation_text": r.recommendation_text,
                "decision_support_notice": r.decision_support_notice,
                "status": r.status,
                "review_status": r.status,
                "reviewed_by": history.reviewer_username if history else (None if not is_reviewed else "System"),
                "reviewer_username": history.reviewer_username if history else None,
                "reviewer_role": history.reviewer_role if history else None,
                "remarks": history.remarks if history else None,
                "recommended_action": history.recommended_action if history else None,
                "reviewed_at": history.review_date.isoformat() + "Z" if history else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "priority": {
                    "invoice_number": p.invoice_id,
                    "normalized_invoice_number": p.invoice_id,
                    "client_name": ar_info.get("clientName") or "Speedex Partner",
                    "outstanding_balance": float(ar_info.get("outstandingBalance") or 0.0),
                    "due_date": ar_info.get("dueDate") or "2026-07-30",
                    "priority_level": p.priority,
                }
            })

        # ── Static mock data (always injected for demo/testing) ──────────────
        # These represent items PENDING REVIEW for the Finance Manager / Head Accountant
        PENDING_MOCKS = [
            {
                "id": 101, "priority_result_id": 101,
                "recommendation_text": "Schedule an urgent call with JNT Express PH regarding Invoice INV-2026-JNT-0050",
                "decision_support_notice": "Client has ₱1,500,000 outstanding balance overdue by 45 days. 3 prior reminders ignored.",
                "status": "Pending Review", "review_status": "Pending Review",
                "reviewed_by": None, "reviewer_username": None, "reviewer_role": None,
                "remarks": None, "recommended_action": None, "reviewed_at": None,
                "created_at": "2026-08-20T08:00:00Z",
                "priority": {"invoice_number": "INV-2026-JNT-0050", "normalized_invoice_number": "INV-2026-JNT-0050",
                             "client_name": "JNT Express PH", "outstanding_balance": 1500000.0,
                             "due_date": "2026-07-30", "priority_level": "High priority"},
            },
            {
                "id": 102, "priority_result_id": 102,
                "recommendation_text": "Issue a formal demand letter for LBC Express account INV-2026-LBC-0120",
                "decision_support_notice": "Client has ₱870,000 outstanding. Legal action may be necessary if unpaid in 7 days.",
                "status": "Pending Review", "review_status": "Pending Review",
                "reviewed_by": None, "reviewer_username": None, "reviewer_role": None,
                "remarks": None, "recommended_action": None, "reviewed_at": None,
                "created_at": "2026-08-21T09:30:00Z",
                "priority": {"invoice_number": "INV-2026-LBC-0120", "normalized_invoice_number": "INV-2026-LBC-0120",
                             "client_name": "LBC Express", "outstanding_balance": 870000.0,
                             "due_date": "2026-08-05", "priority_level": "High priority"},
            },
            {
                "id": 103, "priority_result_id": 103,
                "recommendation_text": "Send payment reminder email to Shopee Express for INV-2026-SHP-0220",
                "decision_support_notice": "Client is generally responsive. A polite reminder should resolve the delay.",
                "status": "Pending Review", "review_status": "Pending Review",
                "reviewed_by": None, "reviewer_username": None, "reviewer_role": None,
                "remarks": None, "recommended_action": None, "reviewed_at": None,
                "created_at": "2026-08-22T10:00:00Z",
                "priority": {"invoice_number": "INV-2026-SHP-0220", "normalized_invoice_number": "INV-2026-SHP-0220",
                             "client_name": "Shopee Express", "outstanding_balance": 320000.0,
                             "due_date": "2026-08-15", "priority_level": "Medium priority"},
            },
        ]

        # These represent ALREADY REVIEWED items — visible in For Review tab for Accountant/Coordinator
        REVIEWED_MOCKS = [
            {
                "id": 998, "priority_result_id": 998,
                "recommendation_text": "Follow up immediately on Lazada PH account",
                "decision_support_notice": "Account flagged for immediate collection action.",
                "status": "Processing", "review_status": "Processing",
                "reviewed_by": "Ana Reyes", "reviewer_username": "areyes",
                "reviewer_role": "Financial Manager",
                "remarks": "Called client on Aug 7. Client confirmed payment on Aug 10.",
                "recommended_action": "Monitor until payment is confirmed",
                "reviewed_at": "2026-08-07T08:40:52Z", "created_at": "2026-08-07T08:00:00Z",
                "priority": {"invoice_number": "LZD-2026-0001", "normalized_invoice_number": "LZD-2026-0001",
                             "client_name": "Lazada Philippines", "outstanding_balance": 450000.0,
                             "due_date": "2026-08-01", "priority_level": "High priority"},
            },
            {
                "id": 999, "priority_result_id": 999,
                "recommendation_text": "Close out account — full settlement confirmed for Grab Express",
                "decision_support_notice": "Payment received in full. Mark account as settled.",
                "status": "Completed", "review_status": "Completed",
                "reviewed_by": "Carlos Mendoza", "reviewer_username": "cmendoza",
                "reviewer_role": "Head Accountant",
                "remarks": "Official receipt issued. Account cleared on Aug 8.",
                "recommended_action": "Archive account and update records",
                "reviewed_at": "2026-08-08T10:27:34Z", "created_at": "2026-08-07T08:00:00Z",
                "priority": {"invoice_number": "GRB-2026-0055", "normalized_invoice_number": "GRB-2026-0055",
                             "client_name": "Grab Express", "outstanding_balance": 0.0,
                             "due_date": "2026-08-01", "priority_level": "Low priority"},
            },
        ]

        # Check which mock IDs have been reviewed (saved in AIReviewHistory)
        existing_ids = {r["id"] for r in result}
        mock_reviewed_ids = set(history_map.keys())  # these are string target_ids

        if status == "ALL":
            for m in PENDING_MOCKS:
                mid = str(m["id"])
                if m["id"] not in existing_ids:
                    if mid in mock_reviewed_ids:
                        # This mock was reviewed — emit it with real review data
                        h = history_map[mid]
                        m2 = dict(m)
                        status_map = {
                            "Accepted as Recommendation": "Processing",
                            "Accepted with Modification": "Processing",
                            "Rejected": "Rejected",
                            "Escalated": "Processing",
                        }
                        m2["status"] = status_map.get(h.decision, "Processing")
                        m2["review_status"] = m2["status"]
                        m2["reviewed_by"] = h.reviewer_username
                        m2["reviewer_username"] = h.reviewer_username
                        m2["reviewer_role"] = h.reviewer_role
                        m2["remarks"] = h.remarks
                        m2["recommended_action"] = h.recommended_action
                        m2["reviewed_at"] = h.review_date.isoformat() + "Z"
                        result.append(m2)
                    else:
                        result.append(m)
            for m in REVIEWED_MOCKS:
                if m["id"] not in existing_ids:
                    result.append(m)
        elif status == "Pending Review":
            for m in PENDING_MOCKS:
                mid = str(m["id"])
                if m["id"] not in existing_ids and mid not in mock_reviewed_ids:
                    result.append(m)
        else:
            # Show reviewed mocks
            for m in REVIEWED_MOCKS:
                if m["id"] not in existing_ids:
                    result.append(m)
            # Also show any reviewed pending mocks
            for m in PENDING_MOCKS:
                mid = str(m["id"])
                if m["id"] not in existing_ids and mid in mock_reviewed_ids:
                    h = history_map[mid]
                    status_map = {
                        "Accepted as Recommendation": "Processing",
                        "Accepted with Modification": "Processing",
                        "Rejected": "Rejected",
                        "Escalated": "Processing",
                    }
                    m2 = dict(m)
                    m2["status"] = status_map.get(h.decision, "Processing")
                    m2["review_status"] = m2["status"]
                    m2["reviewed_by"] = h.reviewer_username
                    m2["reviewer_username"] = h.reviewer_username
                    m2["reviewer_role"] = h.reviewer_role
                    m2["remarks"] = h.remarks
                    m2["recommended_action"] = h.recommended_action
                    m2["reviewed_at"] = h.review_date.isoformat() + "Z"
                    result.append(m2)

        return result
    except Exception as e:
        print(f"Error fetching recommendations: {e}")
        return []


@router.post("/recommendations/{id}/review", response_model=MessageResponse)
def review_collection_recommendation(
    id: int,
    request: RecommendationDecisionRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*RECOMMENDATION_DECIDE_ROLES))
):
    """
    Review/validate a collection recommendation.
    Allowed: Financial Manager, Head Accountant only.
    Supports both real DB records and static mock IDs (101, 102, 103).
    """
    reviewer_username = payload.get("preferred_username") or payload.get("unique_name") or payload.get("name") or "Unknown"
    reviewer_role = payload.get("role") or "System"

    status_mapping = {
        "Accepted as Recommendation": "Processing",
        "Accepted with Modification": "Processing",
        "Rejected": "Rejected",
        "Escalated": "Processing",
    }

    # Try to update the real DB record if it exists
    rec = db.query(AIRecommendation).filter(AIRecommendation.id == id).first()
    if rec:
        rec.status = status_mapping.get(request.decision, "Processing")

    # Always log to AIReviewHistory (covers both real and mock items)
    # Remove old history for same target so only latest review is shown
    db.query(AIReviewHistory).filter(
        AIReviewHistory.target_type == "COLLECTION_RECOMMENDATION",
        AIReviewHistory.target_id == str(id)
    ).delete()

    history = AIReviewHistory(
        target_type="COLLECTION_RECOMMENDATION",
        target_id=str(id),
        reviewer_username=reviewer_username,
        reviewer_role=reviewer_role,
        decision=request.decision,
        remarks=request.remarks,
        recommended_action=request.recommendedAction,
        trace_id=str(uuid.uuid4())
    )
    db.add(history)
    db.commit()

    return MessageResponse(success=True, message=f"Recommendation {id} reviewed successfully.")

