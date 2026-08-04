from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db, AIDuplicateAlert, AIDuplicateReview
from app.auth.policies import require_roles
from app.constants.roles import (
    Roles, DASHBOARD_FULL_ROLES, DASHBOARD_ALL_ROLES, AUDIT_VIEW_ROLES
)
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*DASHBOARD_ALL_ROLES))
):
    """
    Get aggregated metrics for the AI Intelligence Dashboard.
    Queries PostgreSQL DB for real alert counts, returning zeroes if empty.
    Allowed: Financial Manager, Head Accountant, Accountant, Coordinator (limited), Assistant FM (limited).
    """
    alerts = db.query(AIDuplicateAlert).all()
    total_alerts = len(alerts)
    pending_reviews = len([a for a in alerts if a.status == "Pending Review"])
    exact_matches = len([a for a in alerts if a.confidence_score >= 99.0])
    
    return {
        "totalDuplicateAlerts": total_alerts,
        "pendingDuplicateReviews": pending_reviews,
        "exactMatchAlerts": exact_matches,
        "urgentCollectionAccounts": 0,
        "recommendationsAwaitingValidation": 0,
        "lastUpdatedAt": datetime.utcnow().isoformat()
    }

@router.get("/attention-accounts")
def get_attention_accounts(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*DASHBOARD_FULL_ROLES))
):
    """
    Get collection accounts requiring immediate manager attention.
    Allowed: Financial Manager, Head Accountant, Accountant.
    """
    return {"items": []}

@router.get("/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*DASHBOARD_ALL_ROLES))
):
    """
    Get recent activity feed.
    Allowed: All staff roles.
    """
    return []

@router.get("/trends")
def get_trends(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*DASHBOARD_FULL_ROLES))
):
    """
    Get time-series trends data.
    Allowed: Financial Manager, Head Accountant, Accountant.
    """
    return []

@router.get("/review-history")
def get_review_history(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*AUDIT_VIEW_ROLES))
):
    """
    Get review history log.
    Allowed: Financial Manager, Head Accountant, Accountant, Assistant FM.
    """
    reviews = db.query(AIDuplicateReview).all()
    result = []
    for r in reviews:
        result.append({
            "id": r.id,
            "alert_id": r.alert_id,
            "decision": r.decision,
            "justification": r.justification,
            "reviewed_by": r.reviewed_by,
            "reviewed_role": r.reviewed_role,
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            "trace_id": r.trace_id
        })
    return result


@router.get("/audit-trail")
def get_audit_trail(
    page: int = 1,
    pageSize: int = 100,
    sortBy: str = "occurred_at",
    sortDirection: str = "desc",
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*AUDIT_VIEW_ROLES))
):
    """
    Get system audit trail events from PostgreSQL ai_audit_events table.
    """
    try:
        from app.models.database import AIAuditEvent
        events = db.query(AIAuditEvent).order_by(AIAuditEvent.occurred_at.desc()).all()
        items = []
        for e in events:
            items.append({
                "eventId": e.event_id,
                "occurredAt": e.occurred_at.isoformat() if e.occurred_at else None,
                "userId": e.user_id or "System",
                "fullName": e.full_name or e.user_id or "System User",
                "role": e.role_name or "AI System",
                "eventType": e.event_type,
                "action": e.action_description,
                "relatedRecordType": e.related_record_type or "NONE",
                "sourceReference": e.source_reference or "N/A",
                "normalizedReference": e.normalized_reference or "N/A",
                "result": e.result or "SUCCESS",
                "ipAddress": e.ip_address or "127.0.0.1",
                "userAgent": e.user_agent or "Browser",
                "correlationId": e.correlation_id or "",
                "details": e.details
            })
        return {"items": items, "totalCount": len(items)}
    except Exception as e:
        return {"items": [], "totalCount": 0, "error": str(e)}

@router.get("/audit-trail/summary")
def get_audit_trail_summary(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*AUDIT_VIEW_ROLES))
):
    """
    Get summary metrics for audit trail based on real database records.
    """
    try:
        from app.models.database import AIAuditEvent
        events = db.query(AIAuditEvent).all()
        total_events = len(events)
        login_events = len([e for e in events if "LOGIN" in (e.event_type or "").upper() or "AUTH" in (e.event_type or "").upper()])
        dup_events = len([e for e in events if "DUPLICATE" in (e.event_type or "").upper() or "SCAN" in (e.event_type or "").upper() or "DOCUMENT" in (e.event_type or "").upper()])
        coll_events = len([e for e in events if "COLLECTION" in (e.event_type or "").upper() or "PRIORITY" in (e.event_type or "").upper()])
        failed_attempts = len([e for e in events if (e.result or "").upper() in ["FAIL", "FAILED", "REJECTED", "ERROR"]])
        
        return {
            "totalEvents": total_events,
            "loginEvents": login_events,
            "duplicateEvents": dup_events,
            "collectionEvents": coll_events,
            "failedAttempts": failed_attempts
        }
    except Exception:
        return {
            "totalEvents": 0,
            "loginEvents": 0,
            "duplicateEvents": 0,
            "collectionEvents": 0,
            "failedAttempts": 0
        }

@router.post("/audit-trail")
def create_audit_event(
    body: dict,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_roles(*DASHBOARD_ALL_ROLES))
):
    """
    Allow frontend to append audit events directly into PostgreSQL ai_audit_events table.
    """
    from app.audit.logger import log_audit_event_to_db
    event_id = log_audit_event_to_db(
        event_type=body.get("eventType", "USER_ACTION"),
        action_description=body.get("actionDescription", body.get("action", "User action performed")),
        result=body.get("result", "SUCCESS"),
        user_id=payload.get("sub") or payload.get("username"),
        full_name=payload.get("name") or payload.get("sub"),
        role_name=payload.get("role"),
        related_record_type=body.get("relatedRecordType"),
        source_reference=body.get("sourceReference"),
        normalized_reference=body.get("normalizedReference"),
        details=body.get("details")
    )
    return {"success": True, "eventId": event_id}

