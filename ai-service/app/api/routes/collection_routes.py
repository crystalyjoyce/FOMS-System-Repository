from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.models.database import get_db, AICollectionRun, AICollectionPriority, AIPriorityFactor, AIRecommendation, AIRecommendationDecision
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
    List collection priorities with live FOMS SQL Server metadata lookup.
    Allowed: Financial Manager, Head Accountant, Accountant.
    """
    try:
        foms_client = FomsClient()
        ar_list = foms_client.get_accounts_receivable()
        # Build AR map keyed by clientId (primary lookup key) AND by record id (fallback)
        ar_map_by_client = {ar["clientId"]: ar for ar in ar_list if ar.get("clientId")}
        ar_map_by_id = {ar["id"]: ar for ar in ar_list if ar.get("id")}
        def get_ar_info(client_id, inv_id=""):
            return ar_map_by_client.get(client_id) or ar_map_by_id.get(client_id) or ar_map_by_client.get(inv_id) or ar_map_by_id.get(inv_id) or {}
        inv_list = foms_client.get_invoices()
        inv_map = {inv.get("invoiceNo", inv.get("id")): inv for inv in inv_list}

        query = db.query(AICollectionPriority)

        user_role = payload.get("role", "")
        if user_role == "Client":
            client_id = payload.get("client_id", "")
            if client_id:
                query = query.filter(AICollectionPriority.client_id == client_id)
            else:
                return []
            
        priorities = query.all()
        result = []
        for p in priorities:
            factors = db.query(AIPriorityFactor).filter(AIPriorityFactor.priority_result_id == p.id).all()
            factor_list = [{"name": f.factor_name, "value": f.factor_value, "contribution": float(f.contribution)} for f in factors]
            
            # Dynamic lookup from FOMS MSSQL
            inv_info = inv_map.get(p.invoice_id, {})
            ar_info = get_ar_info(p.client_id, p.invoice_id)

            client_name = inv_info.get("clientName") or ar_info.get("clientName") or p.client_id
            # Prefer AR outstanding balance; invoice balance can be 0 if partially/fully paid
            ar_bal = ar_info.get("outstandingBalance", ar_info.get("totalOutstanding", None))
            inv_bal = inv_info.get("balance", inv_info.get("amount", None))
            balance = float(ar_bal if ar_bal is not None else (inv_bal if inv_bal is not None else 0))
            due_date = inv_info.get("dueDate") or ar_info.get("dueDate") or "2026-08-30"

            result.append({
                "id": p.id,
                "invoice_number": p.invoice_id,
                "normalized_invoice_number": p.invoice_id,
                "client_name": client_name,
                "client_id": p.client_id,
                "outstanding_balance": balance,
                "due_date": due_date,
                "priority_level": p.priority,
                "score": float(p.score),
                "explanation": p.explanation,
                "factors": factor_list,
                "created_at": p.created_at.isoformat() if p.created_at else None
            })

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch priorities: {str(e)}")


@router.get("/priorities/{priority_id}")
def get_priority_detail(
    priority_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*COLLECTION_VIEW_ROLES))
):
    """
    Get detailed breakdown for a single collection priority item.
    """
    p = db.query(AICollectionPriority).filter(AICollectionPriority.id == priority_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Priority record not found.")

    try:
        foms_client = FomsClient()
        ar_list = foms_client.get_accounts_receivable()
        ar_map_by_client = {ar["clientId"]: ar for ar in ar_list if ar.get("clientId")}
        ar_map_by_id = {ar["id"]: ar for ar in ar_list if ar.get("id")}
        def get_ar_info_detail(client_id, inv_id=""):
            return ar_map_by_client.get(client_id) or ar_map_by_id.get(client_id) or ar_map_by_client.get(inv_id) or ar_map_by_id.get(inv_id) or {}
        inv_list = foms_client.get_invoices()
        inv_map = {inv.get("invoiceNo", inv.get("id")): inv for inv in inv_list}

        inv_info = inv_map.get(p.invoice_id, {})
        ar_info = get_ar_info_detail(p.client_id, p.invoice_id)

        client_name = inv_info.get("clientName") or ar_info.get("clientName") or p.client_id
        # Prefer AR outstanding balance; invoice balance can be 0 if partially/fully paid
        ar_bal = ar_info.get("outstandingBalance", ar_info.get("totalOutstanding", None))
        inv_bal = inv_info.get("balance", inv_info.get("amount", None))
        balance = float(ar_bal if ar_bal is not None else (inv_bal if inv_bal is not None else 0))
        due_date = inv_info.get("dueDate") or ar_info.get("dueDate") or "2026-08-30"
    except Exception:
        client_name = p.client_id
        balance = 0.0
        due_date = "2026-08-30"

    factors = db.query(AIPriorityFactor).filter(AIPriorityFactor.priority_result_id == p.id).all()
    factor_list = [{"name": f.factor_name, "value": f.factor_value, "contribution": float(f.contribution)} for f in factors]

    rec = db.query(AIRecommendation).filter(AIRecommendation.priority_result_id == p.id).first()
    rec_info = {
        "text": rec.recommendation_text if rec else "Monitor invoice aging.",
        "notice": rec.decision_support_notice if rec else "Priority analysis completed."
    }

    return {
        "id": p.id,
        "invoice_number": p.invoice_id,
        "normalized_invoice_number": p.invoice_id,
        "client_name": client_name,
        "client_id": p.client_id,
        "outstanding_balance": balance,
        "due_date": due_date,
        "priority_level": p.priority,
        "score": float(p.score),
        "explanation": p.explanation,
        "factors": factor_list,
        "recommendation": rec_info,
        "created_at": p.created_at.isoformat() if p.created_at else None
    }


@router.get("/recommendations")
def get_collection_recommendations(
    db: Session = Depends(get_db),
    status: str = "ALL",
    payload: dict = Depends(require_roles(*RECOMMENDATION_VIEW_ROLES))
):
    """
    List collection recommendations with live FOMS metadata.
    Allowed: Financial Manager, Head Accountant, Accountant.
    """
    try:
        foms_client = FomsClient()
        ar_list = foms_client.get_accounts_receivable()
        ar_map_by_client_r = {ar["clientId"]: ar for ar in ar_list if ar.get("clientId")}
        ar_map_by_id_r = {ar["id"]: ar for ar in ar_list if ar.get("id")}
        def get_ar_info_rec(client_id, inv_id=""):
            return ar_map_by_client_r.get(client_id) or ar_map_by_id_r.get(client_id) or ar_map_by_client_r.get(inv_id) or ar_map_by_id_r.get(inv_id) or {}
        inv_list = foms_client.get_invoices()
        inv_map = {inv.get("invoiceNo", inv.get("id")): inv for inv in inv_list}

        recs = db.query(AIRecommendation).all()
        if status != "ALL":
            recs = [r for r in recs if status in r.status]
        
        result = []
        for r in recs:
            p = db.query(AICollectionPriority).filter(AICollectionPriority.id == r.priority_result_id).first()
            inv_id = p.invoice_id if p else "N/A"
            client_id = p.client_id if p else "N/A"
            priority_lvl = p.priority if p else "LOW"

            inv_info = inv_map.get(inv_id, {})
            ar_info = get_ar_info_rec(client_id, inv_id)

            c_name = inv_info.get("clientName") or ar_info.get("clientName") or client_id
            # Prefer AR outstanding balance; invoice balance can be 0 if partially/fully paid
            ar_bal = ar_info.get("outstandingBalance", ar_info.get("totalOutstanding", None))
            inv_bal = inv_info.get("balance", inv_info.get("amount", None))
            bal = float(ar_bal if ar_bal is not None else (inv_bal if inv_bal is not None else 0))
            d_date = inv_info.get("dueDate") or ar_info.get("dueDate") or "2026-08-30"

            result.append({
                "id": r.id,
                "priority_result_id": r.priority_result_id,
                "invoice_number": inv_id,
                "normalized_invoice_number": inv_id,
                "client_name": c_name,
                "client_id": client_id,
                "outstanding_balance": bal,
                "due_date": d_date,
                "priority_level": priority_lvl,
                "recommendation_text": r.recommendation_text,
                "decision_support_notice": r.decision_support_notice,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendations: {str(e)}")


@router.get("/recommendations/history")
def get_recommendation_history(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*RECOMMENDATION_VIEW_ROLES))
):
    """
    Get all logged recommendation decisions for review history / For Review page.
    """
    try:
        foms_client = FomsClient()
        ar_list = foms_client.get_accounts_receivable()
        ar_map_by_client_h = {ar["clientId"]: ar for ar in ar_list if ar.get("clientId")}
        ar_map_by_id_h = {ar["id"]: ar for ar in ar_list if ar.get("id")}
        def get_ar_info_hist(client_id, inv_id=""):
            return ar_map_by_client_h.get(client_id) or ar_map_by_id_h.get(client_id) or ar_map_by_client_h.get(inv_id) or ar_map_by_id_h.get(inv_id) or {}
        inv_list = foms_client.get_invoices()
        inv_map = {inv.get("invoiceNo", inv.get("id")): inv for inv in inv_list}

        decisions = db.query(AIRecommendationDecision).order_by(AIRecommendationDecision.decided_at.desc()).all()
        seen_recs = set()
        result = []
        for d in decisions:
            if d.recommendation_id in seen_recs:
                continue
            seen_recs.add(d.recommendation_id)

            rec = db.query(AIRecommendation).filter(AIRecommendation.id == d.recommendation_id).first()
            p = db.query(AICollectionPriority).filter(AICollectionPriority.id == rec.priority_result_id).first() if rec else None
            
            inv_id = p.invoice_id if p else "N/A"
            client_id = p.client_id if p else "N/A"

            inv_info = inv_map.get(inv_id, {})
            ar_info = get_ar_info_hist(client_id, inv_id)

            c_name = inv_info.get("clientName") or ar_info.get("clientName") or client_id
            # Prefer AR outstanding balance; invoice balance can be 0 if partially/fully paid
            ar_bal = ar_info.get("outstandingBalance", ar_info.get("totalOutstanding", None))
            inv_bal = inv_info.get("balance", inv_info.get("amount", None))
            bal = float(ar_bal if ar_bal is not None else (inv_bal if inv_bal is not None else 0))

            dec_by = d.decided_by or "Maria Santos"
            if dec_by == "EMP-001": dec_by = "Maria Santos"
            elif dec_by == "EMP-002": dec_by = "Juan Dela Cruz"
            elif dec_by == "EMP-003": dec_by = "Pedro Penduko"
            elif dec_by == "EMP-004": dec_by = "Ana Ramos"
            elif dec_by == "EMP-005": dec_by = "Miguel Gomez"

            result.append({
                "id": d.id,
                "recommendation_id": d.recommendation_id,
                "invoice_number": inv_id,
                "normalized_invoice_number": inv_id,
                "client_name": c_name,
                "client_id": client_id,
                "outstanding_balance": bal,
                "decision": d.decision,
                "remarks": d.remarks or "N/A",
                "decided_by": dec_by,
                "decided_role": d.decided_role or "Financial Manager",
                "decided_at": d.decided_at.isoformat() if d.decided_at else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendation history: {str(e)}")


@router.post("/recommendations/{id}/review", response_model=MessageResponse)
def review_collection_recommendation(
    id: int,
    data: dict = Body(default={}),
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*RECOMMENDATION_DECIDE_ROLES))
):
    """
    Review/validate a collection recommendation.
    Allowed: Financial Manager, Head Accountant, Accountant, Coordinator, Assistant FM.
    """
    rec = db.query(AIRecommendation).filter(AIRecommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    decision_str = data.get("decision") or "Accepted as Recommendation"
    remarks_str = data.get("remarks") or ""
    action_taken_str = data.get("recommendedAction") or ""

    rec.status = decision_str

    full_remarks = f"Action Taken: {action_taken_str}"
    if remarks_str.strip():
        full_remarks += f" | Notes: {remarks_str.strip()}"

    user_id = payload.get("sub", "EMP-001")
    user_role = payload.get("role", "Financial Manager")

    name_map = {
        "EMP-001": "Maria Santos",
        "EMP-002": "Juan Dela Cruz",
        "EMP-003": "Pedro Penduko",
        "EMP-004": "Ana Ramos",
        "EMP-005": "Miguel Gomez",
    }
    reviewer_display = name_map.get(user_id, payload.get("name") or user_id)

    dec_record = AIRecommendationDecision(
        recommendation_id=rec.id,
        decision=decision_str,
        remarks=full_remarks,
        decided_by=reviewer_display,
        decided_role=user_role,
        decided_at=datetime.utcnow()
    )
    db.add(dec_record)
    db.commit()

    return MessageResponse(success=True, message=f"Logged decision on Recommendation #{id}.")

