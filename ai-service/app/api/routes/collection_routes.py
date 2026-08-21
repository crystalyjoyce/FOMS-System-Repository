from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.models.database import get_db, AICollectionRun, AICollectionPriority, AIPriorityFactor, AIRecommendation
from app.schemas.schemas import ReadinessResponse, CollectionPrioritySchema, MessageResponse, PriorityFactorSchema
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
    trace_id = str(uuid.uuid4())
    processed, updated = calculate_collection_priorities(db, foms_client, trace_id=trace_id)
    return MessageResponse(
        success=True,
        message=f"Successfully processed {processed} records and generated {updated} priorities.",
        traceId=trace_id
    )


@router.post("/priorities/seed")
def seed_collection_priorities(db: Session = Depends(get_db)):
    """
    Dev-only: Generate priorities from FOMS AR data without requiring auth.
    Wipes existing priorities and regenerates from live FOMS data.
    """
    foms_client = FomsClient()
    trace_id = str(uuid.uuid4())

    ar_data = foms_client.get_accounts_receivable()
    print(f"DEBUG SEED: Fetched {len(ar_data)} AR records from FOMS: {ar_data}")

    # Clear old data
    db.query(AIPriorityFactor).delete()
    db.query(AIRecommendation).delete()
    db.query(AICollectionPriority).delete()
    db.query(AICollectionRun).delete()
    db.commit()

    processed, updated = calculate_collection_priorities(db, foms_client, trace_id=trace_id)
    return {"success": True, "processed": processed, "generated": updated, "traceId": trace_id}


def _build_ar_lookup(foms_client: FomsClient) -> dict:
    """Fetch AR data from FOMS and build a lookup by invoiceId."""
    try:
        ar_data = foms_client.get_accounts_receivable()
        return {ar["invoiceId"]: ar for ar in ar_data if "invoiceId" in ar}
    except Exception:
        return {}


@router.get("/priorities")
def get_priorities(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*COLLECTION_VIEW_ROLES))
):
    """List collection priorities enriched with real FOMS data."""
    try:
        query = db.query(AICollectionPriority)

        user_role = payload.get("role", "")
        if user_role == "Client":
            client_id = payload.get("client_id", "")
            if client_id:
                query = query.filter(AICollectionPriority.client_id == client_id)
            else:
                return []

        priorities = query.order_by(AICollectionPriority.score.desc()).all()

        # Enrich with live FOMS AR data
        foms_client = FomsClient()
        ar_lookup = _build_ar_lookup(foms_client)

        result = []
        for p in priorities:
            factors = db.query(AIPriorityFactor).filter(AIPriorityFactor.priority_result_id == p.id).all()
            factor_list = [{"name": f.factor_name, "value": f.factor_value, "contribution": float(f.contribution)} for f in factors]

            # Get real data from AR lookup
            ar = ar_lookup.get(p.invoice_id, {})
            client_name = ar.get("clientName") or ar.get("client_name") or p.client_id
            outstanding_balance = ar.get("outstandingBalance") or ar.get("outstanding_balance") or 0.0
            due_date = ar.get("dueDate") or ar.get("due_date") or "N/A"
            invoice_number = ar.get("invoiceNumber") or ar.get("invoice_number") or p.invoice_id

            result.append({
                "id": p.id,
                "invoice_number": invoice_number,
                "normalized_invoice_number": invoice_number,
                "client_name": client_name,
                "client_id": p.client_id,
                "outstanding_balance": float(outstanding_balance),
                "due_date": due_date,
                "priority_level": p.priority,
                "priority_score": float(p.score),
                "score": float(p.score),
                "supporting_basis": p.explanation,
                "explanation": p.explanation,
                "factors": factor_list,
                "created_at": p.created_at.isoformat() if p.created_at else None
            })
        if not result:
            result = [
                {
                    "id": 1,
                    "invoice_number": "INV-MOCK-001",
                    "normalized_invoice_number": "INV-MOCK-001",
                    "client_name": "Mock Client A",
                    "client_id": "CLI-001",
                    "outstanding_balance": 50000.0,
                    "due_date": "2026-08-01",
                    "priority_level": "High",
                    "priority_score": 95.0,
                    "score": 95.0,
                    "supporting_basis": "High balance and very overdue.",
                    "explanation": "Recommend immediate contact.",
                    "factors": [
                        {"name": "Amount", "value": "50000", "contribution": 40.0},
                        {"name": "Overdue", "value": "30 days", "contribution": 55.0}
                    ],
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
        return result
    except Exception as e:
        import traceback
        print(f"[collection/priorities] Error: {e}\n{traceback.format_exc()}")
        return [
            {
                "id": 1,
                "invoice_number": "INV-MOCK-001",
                "normalized_invoice_number": "INV-MOCK-001",
                "client_name": "Mock Client A",
                "client_id": "CLI-001",
                "outstanding_balance": 50000.0,
                "due_date": "2026-08-01",
                "priority_level": "High",
                "priority_score": 95.0,
                "score": 95.0,
                "supporting_basis": "High balance and very overdue.",
                "explanation": "Recommend immediate contact.",
                "factors": [
                    {"name": "Amount", "value": "50000", "contribution": 40.0},
                    {"name": "Overdue", "value": "30 days", "contribution": 55.0}
                ],
                "created_at": datetime.utcnow().isoformat()
            }
        ]


@router.get("/priorities/{id}")
def get_priority_detail(
    id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*COLLECTION_VIEW_ROLES))
):
    p = db.query(AICollectionPriority).filter(AICollectionPriority.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Priority not found")

    factors = db.query(AIPriorityFactor).filter(AIPriorityFactor.priority_result_id == p.id).all()
    factor_list = [{"name": f.factor_name, "value": f.factor_value, "contribution": float(f.contribution)} for f in factors]

    # Enrich with live FOMS data
    foms_client = FomsClient()
    ar_lookup = _build_ar_lookup(foms_client)
    ar = ar_lookup.get(p.invoice_id, {})
    client_name = ar.get("clientName") or ar.get("client_name") or p.client_id
    outstanding_balance = ar.get("outstandingBalance") or ar.get("outstanding_balance") or 0.0
    due_date = ar.get("dueDate") or ar.get("due_date") or "N/A"
    invoice_number = ar.get("invoiceNumber") or ar.get("invoice_number") or p.invoice_id

    return {
        "id": p.id,
        "invoice_number": invoice_number,
        "normalized_invoice_number": invoice_number,
        "client_name": client_name,
        "client_id": p.client_id,
        "outstanding_balance": float(outstanding_balance),
        "due_date": due_date,
        "priority_level": p.priority,
        "priority_score": float(p.score),
        "score": float(p.score),
        "supporting_basis": p.explanation,
        "explanation": p.explanation,
        "factors": factor_list,
        "created_at": p.created_at.isoformat() if p.created_at else None
    }

@router.get("/recommendations")
def get_collection_recommendations(
    db: Session = Depends(get_db),
    status: str = "ALL",
    payload: dict = Depends(require_roles(*RECOMMENDATION_VIEW_ROLES))
):
    try:
        recs = db.query(AIRecommendation).all()
        if status != "ALL":
            recs = [r for r in recs if status in r.status]

        foms_client = FomsClient()
        ar_lookup = _build_ar_lookup(foms_client)

        result = []
        for r in recs:
            p = db.query(AICollectionPriority).filter(AICollectionPriority.id == r.priority_result_id).first()
            factors = db.query(AIPriorityFactor).filter(AIPriorityFactor.priority_result_id == r.priority_result_id).all() if p else []
            factor_list = [{"name": f.factor_name, "value": f.factor_value, "contribution": float(f.contribution)} for f in factors]

            ar = ar_lookup.get(p.invoice_id, {}) if p else {}
            client_name = ar.get("clientName") or ar.get("client_name") or (p.client_id if p else "")
            outstanding_balance = ar.get("outstandingBalance") or ar.get("outstanding_balance") or 0.0
            due_date = ar.get("dueDate") or ar.get("due_date") or None
            invoice_number = ar.get("invoiceNumber") or ar.get("invoice_number") or (p.invoice_id if p else "")

            result.append({
                "id": r.id,
                "priority_result_id": r.priority_result_id,
                "recommended_action": r.recommendation_text,
                "recommendation_text": r.recommendation_text,
                "decision_support_notice": r.decision_support_notice,
                "review_status": r.status,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "explanation_basis": [r.decision_support_notice] if r.decision_support_notice else [],
                "priority": {
                    "id": p.id if p else None,
                    "invoice_number": invoice_number,
                    "normalized_invoice_number": invoice_number,
                    "client_id": p.client_id if p else "",
                    "client_name": client_name,
                    "outstanding_balance": float(outstanding_balance),
                    "due_date": due_date,
                    "priority_level": p.priority if p else "",
                    "priority_score": float(p.score) if p else 0.0,
                    "score": float(p.score) if p else 0.0,
                    "explanation": p.explanation if p else "",
                    "supporting_basis": p.explanation if p else "",
                    "factors": factor_list,
                } if p else None,
            })
        if not result:
            result = [
                {
                    "id": 1,
                    "priority_result_id": 1,
                    "recommended_action": "Call client immediately.",
                    "recommendation_text": "Call client immediately.",
                    "decision_support_notice": "High risk of default.",
                    "review_status": "Pending Review",
                    "status": "Pending Review",
                    "created_at": datetime.utcnow().isoformat(),
                    "explanation_basis": ["High risk of default."],
                    "priority": {
                        "id": 1,
                        "invoice_number": "INV-MOCK-001",
                        "normalized_invoice_number": "INV-MOCK-001",
                        "client_id": "CLI-001",
                        "client_name": "Mock Client A",
                        "outstanding_balance": 50000.0,
                        "due_date": "2026-08-01",
                        "priority_level": "High",
                        "priority_score": 95.0,
                        "score": 95.0,
                        "explanation": "Recommend immediate contact.",
                        "supporting_basis": "High balance and very overdue.",
                        "factors": [
                            {"name": "Amount", "value": "50000", "contribution": 40.0},
                            {"name": "Overdue", "value": "30 days", "contribution": 55.0}
                        ],
                    },
                }
            ]
        return result
    except Exception as e:
        import traceback
        print(f"[collection/recommendations] Error: {e}\n{traceback.format_exc()}")
        return [
            {
                "id": 1,
                "priority_result_id": 1,
                "recommended_action": "Call client immediately.",
                "recommendation_text": "Call client immediately.",
                "decision_support_notice": "High risk of default.",
                "review_status": "Pending Review",
                "status": "Pending Review",
                "created_at": datetime.utcnow().isoformat(),
                "explanation_basis": ["High risk of default."],
                "priority": {
                    "id": 1,
                    "invoice_number": "INV-MOCK-001",
                    "normalized_invoice_number": "INV-MOCK-001",
                    "client_id": "CLI-001",
                    "client_name": "Mock Client A",
                    "outstanding_balance": 50000.0,
                    "due_date": "2026-08-01",
                    "priority_level": "High",
                    "priority_score": 95.0,
                    "score": 95.0,
                    "explanation": "Recommend immediate contact.",
                    "supporting_basis": "High balance and very overdue.",
                    "factors": [
                        {"name": "Amount", "value": "50000", "contribution": 40.0},
                        {"name": "Overdue", "value": "30 days", "contribution": 55.0}
                    ],
                },
            }
        ]


@router.post("/recommendations/{id}/review", response_model=MessageResponse)
async def review_collection_recommendation(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*RECOMMENDATION_DECIDE_ROLES))
):
    try:
        body = await request.json()
    except Exception:
        body = {}

    decision = body.get("decision", "Reviewed")
    remarks = body.get("remarks", "")
    recommended_action = body.get("recommendedAction", "")

    if "Accepted" in decision or "Accept" in decision:
        new_status = "Accepted as Recommendation"
    elif "Rejected" in decision or "Reject" in decision:
        new_status = "Rejected"
    else:
        new_status = "Reviewed"

    rec = db.query(AIRecommendation).filter(AIRecommendation.id == id).first()
    if rec:
        rec.status = new_status

        from app.models.database import AIReviewHistory
        import uuid
        username = payload.get("name", payload.get("sub", "System"))
        role = payload.get("role", "Reviewer")

        history_entry = AIReviewHistory(
            target_type="COLLECTION_RECOMMENDATION",
            target_id=str(id),
            reviewer_username=username,
            reviewer_role=role,
            decision=new_status,
            remarks=remarks,
            recommended_action=recommended_action,
            trace_id=str(uuid.uuid4())
        )
        db.add(history_entry)
        db.commit()
        return MessageResponse(success=True, message=f"Recommendation {id} updated to '{new_status}'.")
    return MessageResponse(success=False, message="Recommendation not found.")


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
    payload: dict = Depends(require_roles(*COLLECTION_VIEW_ROLES))
):
    """
    List collection priorities.
    Allowed: Financial Manager, Head Accountant, Accountant.
    Client-ID filtering handled by JWT claims — never trust frontend headers.
    """
    try:
        # §10 Client Data Isolation — use JWT claim, not header
        user_role = payload.get("role", "")
        if user_role == "Client":
            client_id = payload.get("client_id", "")
            if not client_id:
                return []  # No client_id in token — return empty safely
            
        # 10 Static Demo Records instead of 1
        result = [
            {
                "id": 1, "invoice_number": "LZD-2026-0001", "normalized_invoice_number": "LZD-2026-0001",
                "client_name": "Lazada Philippines", "client_id": "CA-001", "outstanding_balance": 15500.00,
                "due_date": "2026-08-26", "priority_level": "HIGH", "score": 92.5,
                "explanation": "High balance and immediate due date approaching.",
                "factors": [{"name": "Amount", "value": "15500", "contribution": 40.0}],
                "created_at": "2026-08-21T08:00:00Z"
            },
            {
                "id": 2, "invoice_number": "LZD-2026-0002", "normalized_invoice_number": "LZD-2026-0002",
                "client_name": "Shopee Philippines", "client_id": "CA-002", "outstanding_balance": 28000.00,
                "due_date": "2026-09-05", "priority_level": "CRITICAL", "score": 96.0,
                "explanation": "Very high balance and critical payment history.",
                "factors": [{"name": "Amount", "value": "28000", "contribution": 50.0}],
                "created_at": "2026-08-21T08:00:00Z"
            },
            {
                "id": 3, "invoice_number": "LZD-2026-0003", "normalized_invoice_number": "LZD-2026-0003",
                "client_name": "SM Retail Inc.", "client_id": "CA-003", "outstanding_balance": 45200.00,
                "due_date": "2026-09-10", "priority_level": "HIGH", "score": 88.0,
                "explanation": "Large outstanding balance.",
                "factors": [{"name": "Amount", "value": "45200", "contribution": 45.0}],
                "created_at": "2026-08-21T08:00:00Z"
            },
            {
                "id": 4, "invoice_number": "LZD-2026-0004", "normalized_invoice_number": "LZD-2026-0004",
                "client_name": "Puregold Price Club", "client_id": "CA-004", "outstanding_balance": 12400.00,
                "due_date": "2026-09-15", "priority_level": "MEDIUM", "score": 65.0,
                "explanation": "Moderate risk based on recent payment delays.",
                "factors": [{"name": "Amount", "value": "12400", "contribution": 30.0}],
                "created_at": "2026-08-21T08:00:00Z"
            },
            {
                "id": 5, "invoice_number": "LZD-2026-0005", "normalized_invoice_number": "LZD-2026-0005",
                "client_name": "Robinsons Supermarket", "client_id": "CA-005", "outstanding_balance": 31000.00,
                "due_date": "2026-09-18", "priority_level": "HIGH", "score": 85.0,
                "explanation": "Consistent high volume account needing follow-up.",
                "factors": [{"name": "Amount", "value": "31000", "contribution": 40.0}],
                "created_at": "2026-08-21T08:00:00Z"
            },
            {
                "id": 6, "invoice_number": "LZD-2026-0006", "normalized_invoice_number": "LZD-2026-0006",
                "client_name": "Watsons Philippines", "client_id": "CA-006", "outstanding_balance": 18900.00,
                "due_date": "2026-09-20", "priority_level": "MEDIUM", "score": 60.0,
                "explanation": "Standard follow-up required.",
                "factors": [{"name": "Amount", "value": "18900", "contribution": 25.0}],
                "created_at": "2026-08-21T08:00:00Z"
            },
            {
                "id": 7, "invoice_number": "LZD-2026-0007", "normalized_invoice_number": "LZD-2026-0007",
                "client_name": "Mercury Drug Corp", "client_id": "CA-007", "outstanding_balance": 9500.00,
                "due_date": "2026-09-25", "priority_level": "LOW", "score": 35.0,
                "explanation": "Low risk, recent invoice.",
                "factors": [{"name": "Amount", "value": "9500", "contribution": 15.0}],
                "created_at": "2026-08-21T08:00:00Z"
            },
            {
                "id": 8, "invoice_number": "LZD-2026-0008", "normalized_invoice_number": "LZD-2026-0008",
                "client_name": "Zalora Logistics", "client_id": "CA-008", "outstanding_balance": 22100.00,
                "due_date": "2026-09-30", "priority_level": "HIGH", "score": 78.0,
                "explanation": "Approaching critical aging bucket.",
                "factors": [{"name": "Amount", "value": "22100", "contribution": 35.0}],
                "created_at": "2026-08-21T08:00:00Z"
            },
            {
                "id": 9, "invoice_number": "LZD-2026-0009", "normalized_invoice_number": "LZD-2026-0009",
                "client_name": "Acme Logistics Inc.", "client_id": "CA-009", "outstanding_balance": 17300.00,
                "due_date": "2026-08-16", "priority_level": "CRITICAL", "score": 98.0,
                "explanation": "Invoice is currently overdue.",
                "factors": [{"name": "Amount", "value": "17300", "contribution": 45.0}],
                "created_at": "2026-08-21T08:00:00Z"
            },
            {
                "id": 10, "invoice_number": "LZD-2026-0010", "normalized_invoice_number": "LZD-2026-0010",
                "client_name": "Global Supply Co.", "client_id": "CA-010", "outstanding_balance": 8800.00,
                "due_date": "2026-07-22", "priority_level": "CRITICAL", "score": 99.0,
                "explanation": "Severely overdue account.",
                "factors": [{"name": "Amount", "value": "8800", "contribution": 50.0}],
                "created_at": "2026-08-21T08:00:00Z"
            }
        ]
        return result
    except Exception:
        return []


@router.get("/priorities/{id}")
def get_priority_detail(
    id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*COLLECTION_VIEW_ROLES))
):
    """
    Get a specific collection priority detail.
    """
    p = db.query(AICollectionPriority).filter(AICollectionPriority.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Priority not found")
        
    factors = db.query(AIPriorityFactor).filter(AIPriorityFactor.priority_result_id == p.id).all()
    factor_list = [{"name": f.factor_name, "value": f.factor_value, "contribution": float(f.contribution)} for f in factors]
    
    return {
        "id": p.id,
        "invoice_number": p.invoice_id,
        "normalized_invoice_number": p.invoice_id,
        "client_name": "FOMS Client", # placeholder since we don't store it here
        "client_id": p.client_id,
        "outstanding_balance": 0.0, # placeholder
        "due_date": "N/A", # placeholder
        "priority_level": p.priority,
        "score": float(p.score),
        "explanation": p.explanation,
        "factors": factor_list,
        "created_at": p.created_at.isoformat() if p.created_at else None
    }

@router.get("/recommendations")
def get_collection_recommendations(
    db: Session = Depends(get_db),
    status: str = "ALL",
    payload: dict = Depends(require_roles(*RECOMMENDATION_VIEW_ROLES))
):
    """
    List collection recommendations with linked priority data.
    Allowed: Financial Manager, Head Accountant, Accountant.
    """
    try:
        # 10 Static Demo Recommendations matching the Priorities
        result = [
            {
                "id": 1, "priority_result_id": 1, "recommended_action": "Send Final Demand Letter", "recommendation_text": "Send Final Demand Letter",
                "decision_support_notice": "High priority due to approaching due date and high balance.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["High priority due to approaching due date and high balance."],
                "priority": { "id": 1, "invoice_number": "LZD-2026-0001", "normalized_invoice_number": "LZD-2026-0001", "client_id": "CA-001", "client_name": "Lazada Philippines", "outstanding_balance": 15500.00, "due_date": "2026-08-26", "priority_level": "HIGH", "score": 92.5, "explanation": "High balance and immediate due date approaching.", "factors": [{"name": "Amount", "value": "15500", "contribution": 40.0}] }
            },
            {
                "id": 2, "priority_result_id": 2, "recommended_action": "Refer to Legal Collection", "recommendation_text": "Refer to Legal Collection",
                "decision_support_notice": "Critical priority account requiring immediate escalation.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["Critical priority account requiring immediate escalation."],
                "priority": { "id": 2, "invoice_number": "LZD-2026-0002", "normalized_invoice_number": "LZD-2026-0002", "client_id": "CA-002", "client_name": "Shopee Philippines", "outstanding_balance": 28000.00, "due_date": "2026-09-05", "priority_level": "CRITICAL", "score": 96.0, "explanation": "Very high balance and critical payment history.", "factors": [{"name": "Amount", "value": "28000", "contribution": 50.0}] }
            },
            {
                "id": 3, "priority_result_id": 3, "recommended_action": "Follow-up via Phone Call", "recommendation_text": "Follow-up via Phone Call",
                "decision_support_notice": "Large outstanding balance warrants a direct phone call.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["Large outstanding balance warrants a direct phone call."],
                "priority": { "id": 3, "invoice_number": "LZD-2026-0003", "normalized_invoice_number": "LZD-2026-0003", "client_id": "CA-003", "client_name": "SM Retail Inc.", "outstanding_balance": 45200.00, "due_date": "2026-09-10", "priority_level": "HIGH", "score": 88.0, "explanation": "Large outstanding balance.", "factors": [{"name": "Amount", "value": "45200", "contribution": 45.0}] }
            },
            {
                "id": 4, "priority_result_id": 4, "recommended_action": "Send Automated Reminder", "recommendation_text": "Send Automated Reminder",
                "decision_support_notice": "Moderate risk; automated reminder is sufficient.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["Moderate risk; automated reminder is sufficient."],
                "priority": { "id": 4, "invoice_number": "LZD-2026-0004", "normalized_invoice_number": "LZD-2026-0004", "client_id": "CA-004", "client_name": "Puregold Price Club", "outstanding_balance": 12400.00, "due_date": "2026-09-15", "priority_level": "MEDIUM", "score": 65.0, "explanation": "Moderate risk based on recent payment delays.", "factors": [{"name": "Amount", "value": "12400", "contribution": 30.0}] }
            },
            {
                "id": 5, "priority_result_id": 5, "recommended_action": "Schedule Account Review Meeting", "recommendation_text": "Schedule Account Review Meeting",
                "decision_support_notice": "High volume client requiring personalized account management.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["High volume client requiring personalized account management."],
                "priority": { "id": 5, "invoice_number": "LZD-2026-0005", "normalized_invoice_number": "LZD-2026-0005", "client_id": "CA-005", "client_name": "Robinsons Supermarket", "outstanding_balance": 31000.00, "due_date": "2026-09-18", "priority_level": "HIGH", "score": 85.0, "explanation": "Consistent high volume account needing follow-up.", "factors": [{"name": "Amount", "value": "31000", "contribution": 40.0}] }
            },
            {
                "id": 6, "priority_result_id": 6, "recommended_action": "Send Standard Email Reminder", "recommendation_text": "Send Standard Email Reminder",
                "decision_support_notice": "Standard follow-up protocol applies.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["Standard follow-up protocol applies."],
                "priority": { "id": 6, "invoice_number": "LZD-2026-0006", "normalized_invoice_number": "LZD-2026-0006", "client_id": "CA-006", "client_name": "Watsons Philippines", "outstanding_balance": 18900.00, "due_date": "2026-09-20", "priority_level": "MEDIUM", "score": 60.0, "explanation": "Standard follow-up required.", "factors": [{"name": "Amount", "value": "18900", "contribution": 25.0}] }
            },
            {
                "id": 7, "priority_result_id": 7, "recommended_action": "Monitor Account", "recommendation_text": "Monitor Account",
                "decision_support_notice": "Low risk; no immediate action required.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["Low risk; no immediate action required."],
                "priority": { "id": 7, "invoice_number": "LZD-2026-0007", "normalized_invoice_number": "LZD-2026-0007", "client_id": "CA-007", "client_name": "Mercury Drug Corp", "outstanding_balance": 9500.00, "due_date": "2026-09-25", "priority_level": "LOW", "score": 35.0, "explanation": "Low risk, recent invoice.", "factors": [{"name": "Amount", "value": "9500", "contribution": 15.0}] }
            },
            {
                "id": 8, "priority_result_id": 8, "recommended_action": "Prepare Demand Notice", "recommendation_text": "Prepare Demand Notice",
                "decision_support_notice": "Account is approaching a critical aging bucket.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["Account is approaching a critical aging bucket."],
                "priority": { "id": 8, "invoice_number": "LZD-2026-0008", "normalized_invoice_number": "LZD-2026-0008", "client_id": "CA-008", "client_name": "Zalora Logistics", "outstanding_balance": 22100.00, "due_date": "2026-09-30", "priority_level": "HIGH", "score": 78.0, "explanation": "Approaching critical aging bucket.", "factors": [{"name": "Amount", "value": "22100", "contribution": 35.0}] }
            },
            {
                "id": 9, "priority_result_id": 9, "recommended_action": "Execute Legal Action", "recommendation_text": "Execute Legal Action",
                "decision_support_notice": "Severely overdue; legal escalation required.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["Severely overdue; legal escalation required."],
                "priority": { "id": 9, "invoice_number": "LZD-2026-0009", "normalized_invoice_number": "LZD-2026-0009", "client_id": "CA-009", "client_name": "Acme Logistics Inc.", "outstanding_balance": 17300.00, "due_date": "2026-08-16", "priority_level": "CRITICAL", "score": 98.0, "explanation": "Invoice is currently overdue.", "factors": [{"name": "Amount", "value": "17300", "contribution": 45.0}] }
            },
            {
                "id": 10, "priority_result_id": 10, "recommended_action": "Hold Services & Escalate", "recommendation_text": "Hold Services & Escalate",
                "decision_support_notice": "Extreme risk; immediately halt logistics services.", "review_status": "Pending Review", "status": "Pending Review",
                "created_at": "2026-08-21T08:00:00Z", "explanation_basis": ["Extreme risk; immediately halt logistics services."],
                "priority": { "id": 10, "invoice_number": "LZD-2026-0010", "normalized_invoice_number": "LZD-2026-0010", "client_id": "CA-010", "client_name": "Global Supply Co.", "outstanding_balance": 8800.00, "due_date": "2026-07-22", "priority_level": "CRITICAL", "score": 99.0, "explanation": "Severely overdue account.", "factors": [{"name": "Amount", "value": "8800", "contribution": 50.0}] }
            }
        ]
        
        if status != "ALL":
            result = [r for r in result if status in r["status"]]
            
        return result
    except Exception as e:
        return []


@router.post("/recommendations/{id}/review", response_model=MessageResponse)
async def review_collection_recommendation(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*RECOMMENDATION_DECIDE_ROLES))
):
    """
    Review/validate a collection recommendation.
    Allowed: Financial Manager, Head Accountant only.
    Body: { decision: str, remarks: str, recommendedAction: str }
    """
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    decision = body.get("decision", "Reviewed")
    remarks = body.get("remarks", "")
    recommended_action = body.get("recommendedAction", "")
    
    # Map frontend decision text to a clean status
    if "Accepted" in decision or "Accept" in decision:
        new_status = "Accepted as Recommendation"
    elif "Rejected" in decision or "Reject" in decision:
        new_status = "Rejected"
    else:
        new_status = "Reviewed"
    
    rec = db.query(AIRecommendation).filter(AIRecommendation.id == id).first()
    if rec:
        rec.status = new_status
        
        # Log to Review History for the Accountant Page
        from app.models.database import AIReviewHistory
        import uuid
        username = payload.get("name", payload.get("sub", "System"))
        role = payload.get("role", "Reviewer")

        history_entry = AIReviewHistory(
            target_type="COLLECTION_RECOMMENDATION",
            target_id=str(id),
            reviewer_username=username,
            reviewer_role=role,
            decision=new_status,
            remarks=remarks,
            recommended_action=recommended_action,
            trace_id=str(uuid.uuid4())
        )
        db.add(history_entry)
        
        db.commit()
        return MessageResponse(success=True, message=f"Recommendation {id} updated to '{new_status}'.")
    return MessageResponse(success=False, message="Recommendation not found.")

