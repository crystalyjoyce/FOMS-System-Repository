from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pymongo import MongoClient
from app.core.config import settings
from app.models.database import (
    get_db, AIDuplicateAlert, AIDuplicateMatch, AICollectionPriority,
    AICollectionRecommendation, AIReviewDecision, AIOutputLog, AIActivityLog, AIAuditEvent
)
from app.schemas.schemas import (
    MessageResponse, ReviewRequest, DuplicateAlertSchema,
    CollectionPrioritySchema, CollectionRecommendationSchema,
    ReviewDecisionSchema, TrendSnapshotSchema
)
from app.services.sync import run_synchronization

router = APIRouter(prefix="/api/ai")

# Helper to verify role permission levels
def get_user_role(
    x_user_username: Optional[str] = Header(None, alias="X-User-Username"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    # For local debugging, fallback to Financial Manager if gateway headers are absent
    username = x_user_username or "local_dev"
    role = x_user_role or "Financial Manager"
    
    if role == "Client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clients are not authorized to access AI Intelligence Layer"
        )
    return {"username": username, "role": role}

# 1. Access & Metadata
@router.get("/me")
def get_me(user: dict = Depends(get_user_role)):
    return {
        "username": user["username"],
        "role": user["role"]
    }

@router.get("/permissions")
def get_permissions(user: dict = Depends(get_user_role)):
    role = user["role"]
    perms = {
        "view_dashboard": True,
        "run_sync": role in ["Financial Manager", "Head Accountant", "Accountant"],
        "view_duplicates": role in ["Financial Manager", "Head Accountant", "Accountant", "Coordinator"],
        "view_invoice_duplicates": role in ["Financial Manager", "Head Accountant", "Accountant"],
        "view_priorities": role in ["Financial Manager", "Head Accountant", "Accountant"],
        "view_recommendations": role in ["Financial Manager", "Head Accountant", "Accountant"],
        "approve_review": role in ["Financial Manager", "Head Accountant", "Accountant"],
        "view_audit_history": role in ["Financial Manager", "Head Accountant", "Accountant", "Assistant of Financial Manager"]
    }
    return perms

@router.get("/dashboard/summary")
def get_dashboard_summary(user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    role = user["role"]
    if role not in ["Financial Manager", "Head Accountant", "Accountant", "Coordinator", "Assistant of Financial Manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view dashboard summary.")

    query_dups = db.query(AIDuplicateAlert)
    query_pending = db.query(AIDuplicateAlert).filter(AIDuplicateAlert.review_status == 'Pending Review')
    query_exact = db.query(AIDuplicateAlert).filter(AIDuplicateAlert.similarity_score == 100)

    if role == "Coordinator":
        query_dups = query_dups.filter(AIDuplicateAlert.alert_type == 'WAYBILL')
        query_pending = query_pending.filter(AIDuplicateAlert.alert_type == 'WAYBILL')
        query_exact = query_exact.filter(AIDuplicateAlert.alert_type == 'WAYBILL')
        
    total_dups = query_dups.count()
    pending_dups = query_pending.count()
    exact_matches = query_exact.count()
    
    if role in ["Coordinator", "Assistant of Financial Manager"]:
        urgent_accounts = 0
        awaiting_validation = 0
    else:
        urgent_accounts = db.query(AICollectionPriority).filter(AICollectionPriority.priority_level == 'Urgent').count()
        awaiting_validation = db.query(AICollectionRecommendation).filter(AICollectionRecommendation.review_status == 'Pending Review').count()

    return {
        "totalDuplicateAlerts": total_dups,
        "pendingDuplicateReviews": pending_dups,
        "exactMatchAlerts": exact_matches,
        "urgentCollectionAccounts": urgent_accounts,
        "recommendationsAwaitingValidation": awaiting_validation,
        "lastUpdatedAt": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/dashboard/attention-accounts")
def get_attention_accounts(user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    role = user["role"]
    if role not in ["Financial Manager", "Head Accountant", "Accountant"]:
        return {"items": []}

    priorities = db.query(AICollectionPriority).filter(
        AICollectionPriority.priority_level.in_(['Urgent', 'High'])
    ).order_by(AICollectionPriority.outstanding_balance.desc()).all()

    items = []
    for p in priorities:
        rec = db.query(AICollectionRecommendation).filter(AICollectionRecommendation.priority_id == p.id).first()
        status = rec.review_status if rec else "Awaiting Validation"

        items.append({
            "priorityId": f"CP-2026-00{p.id}",
            "clientName": p.client_name,
            "invoiceNumber": p.invoice_number,
            "outstandingBalance": float(p.outstanding_balance),
            "dueDate": p.due_date.isoformat() if hasattr(p.due_date, 'isoformat') else str(p.due_date),
            "daysOverdue": (datetime.utcnow().date() - p.due_date).days if hasattr(p.due_date, 'year') else 45,
            "priorityLevel": p.priority_level,
            "recommendationBasis": p.explanation_basis,
            "reviewStatus": status
        })
    return {"items": items}

@router.get("/dashboard/recent-activity")
def get_recent_activity(user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    role = user["role"]
    if role not in ["Financial Manager", "Head Accountant", "Accountant", "Coordinator", "Assistant of Financial Manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view recent activities.")

    activities = db.query(AIActivityLog).order_by(AIActivityLog.created_at.desc()).limit(10).all()
    
    results = []
    for a in activities:
        results.append({
            "id": a.id,
            "statusDot": a.status_dot,
            "description": a.description,
            "relatedRecord": a.related_record,
            "timeAgo": a.time_ago,
            "userRole": a.user_role
        })
    return results

@router.get("/dashboard/trends", response_model=List[TrendSnapshotSchema])
def get_dashboard_trends(user: dict = Depends(get_user_role)):
    return get_trends(user)

# 2. Duplicate Detection endpoints
@router.post("/duplicates/run", response_model=MessageResponse)
def trigger_duplicates_check(user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    if user["role"] not in ["Financial Manager", "Head Accountant", "Accountant"]:
        raise HTTPException(status_code=403, detail="Unauthorized to trigger analysis runs.")
    
    # Run sync in background or synchronously
    try:
        run_synchronization()
        return {"message": "Data synchronization and duplicate detection run completed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Duplicate analysis run failed: {str(e)}")

@router.get("/duplicates", response_model=List[DuplicateAlertSchema])
def list_duplicate_alerts(
    alert_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: dict = Depends(get_user_role),
    db: Session = Depends(get_db)
):
    role = user["role"]
    # Check permissions
    if role not in ["Financial Manager", "Head Accountant", "Accountant", "Coordinator"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view duplicate alerts.")

    query = db.query(AIDuplicateAlert)
    
    # Coordinators can only see Waybill alerts
    if role == "Coordinator":
        query = query.filter(AIDuplicateAlert.alert_type == "WAYBILL")
    elif alert_type:
        query = query.filter(AIDuplicateAlert.alert_type == alert_type)

    if status:
        query = query.filter(AIDuplicateAlert.review_status == status)

    return query.order_by(AIDuplicateAlert.date_generated.desc()).all()

@router.get("/duplicates/{alert_id}", response_model=DuplicateAlertSchema)
def get_duplicate_alert(alert_id: int, user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    role = user["role"]
    alert = db.query(AIDuplicateAlert).filter(AIDuplicateAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Duplicate alert not found.")
        
    # Coordinator limits
    if role == "Coordinator" and alert.alert_type != "WAYBILL":
        raise HTTPException(status_code=403, detail="Unauthorized to view details of invoice or receipt duplicates.")
    if role not in ["Financial Manager", "Head Accountant", "Accountant", "Coordinator"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view duplicate details.")

    # Eagerly load match details
    matches = db.query(AIDuplicateMatch).filter(AIDuplicateMatch.alert_id == alert_id).all()
    alert.matches = matches
    return alert

@router.post("/duplicates/{alert_id}/review", response_model=MessageResponse)
def review_duplicate_alert(
    alert_id: int, 
    review: ReviewRequest, 
    user: dict = Depends(get_user_role), 
    db: Session = Depends(get_db)
):
    if user["role"] not in ["Financial Manager", "Head Accountant", "Accountant"]:
        raise HTTPException(status_code=403, detail="Unauthorized to submit duplicate review decisions.")

    alert = db.query(AIDuplicateAlert).filter(AIDuplicateAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Duplicate alert not found.")

    # Record review decision
    decision = AIReviewDecision(
        target_type="DUPLICATE_ALERT",
        target_id=alert_id,
        reviewer_username=user["username"],
        reviewer_role=user["role"],
        decision=review.decision,
        remarks=review.remarks,
        recommended_action=review.recommendedAction
    )
    db.add(decision)

    # Update status of original alert
    alert.review_status = review.decision
    db.commit()

    return {"message": f"Duplicate alert review recorded successfully with status: {review.decision}."}

# 3. Collection Priority endpoints
@router.post("/collection-priorities/generate", response_model=MessageResponse)
def trigger_collection_ranking(user: dict = Depends(get_user_role)):
    if user["role"] not in ["Financial Manager", "Head Accountant", "Accountant"]:
        raise HTTPException(status_code=403, detail="Unauthorized to trigger analysis runs.")
    
    try:
        run_synchronization()
        return {"message": "Collection priorities calculations run completed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Collection ranking run failed: {str(e)}")

@router.get("/collection-priorities", response_model=List[CollectionPrioritySchema])
def list_collection_priorities(
    priority: Optional[str] = Query(None),
    user: dict = Depends(get_user_role),
    db: Session = Depends(get_db)
):
    if user["role"] not in ["Financial Manager", "Head Accountant", "Accountant"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view collection priorities.")

    query = db.query(AICollectionPriority)
    if priority:
        query = query.filter(AICollectionPriority.priority_level == priority)
    return query.order_by(AICollectionPriority.outstanding_balance.desc()).all()

@router.get("/collection-priorities/{priority_id}", response_model=CollectionPrioritySchema)
def get_collection_priority(priority_id: int, user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    if user["role"] not in ["Financial Manager", "Head Accountant", "Accountant"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view priority details.")

    priority = db.query(AICollectionPriority).filter(AICollectionPriority.id == priority_id).first()
    if not priority:
        raise HTTPException(status_code=404, detail="Collection priority record not found.")
    return priority

@router.get("/collection-recommendations", response_model=List[CollectionRecommendationSchema])
def list_collection_recommendations(
    status: Optional[str] = Query(None),
    user: dict = Depends(get_user_role),
    db: Session = Depends(get_db)
):
    if user["role"] not in ["Financial Manager", "Head Accountant", "Accountant"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view recommendations.")

    query = db.query(AICollectionRecommendation)
    if status:
        query = query.filter(AICollectionRecommendation.review_status == status)

    recs = query.all()
    # Eagerly load priority models
    for rec in recs:
        rec.priority = db.query(AICollectionPriority).filter(AICollectionPriority.id == rec.priority_id).first()
    return recs

@router.post("/collection-recommendations/{rec_id}/review", response_model=MessageResponse)
def review_collection_recommendation(
    rec_id: int, 
    review: ReviewRequest, 
    user: dict = Depends(get_user_role), 
    db: Session = Depends(get_db)
):
    if user["role"] not in ["Financial Manager", "Head Accountant", "Accountant"]:
        raise HTTPException(status_code=403, detail="Unauthorized to submit collection review decisions.")

    rec = db.query(AICollectionRecommendation).filter(AICollectionRecommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Collection recommendation not found.")

    # Record review decision
    decision = AIReviewDecision(
        target_type="COLLECTION_RECOMMENDATION",
        target_id=rec_id,
        reviewer_username=user["username"],
        reviewer_role=user["role"],
        decision=review.decision,
        remarks=review.remarks,
        recommended_action=review.recommendedAction
    )
    db.add(decision)

    # Update status of original recommendation
    rec.review_status = review.decision
    db.commit()

    return {"message": f"Collection recommendation review recorded successfully with status: {review.decision}."}

@router.get("/collection-reports")
def get_collection_reports(user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    if user["role"] not in ["Financial Manager", "Head Accountant", "Accountant"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view collection reports.")

    # Count by priority level
    priorities = db.query(AICollectionPriority.priority_level, AICollectionPriority.outstanding_balance).all()
    
    report = {
        "totals": {"Urgent": 0, "High": 0, "Medium": 0, "Low": 0},
        "amounts": {"Urgent": 0.0, "High": 0.0, "Medium": 0.0, "Low": 0.0},
        "totalOutstanding": 0.0
    }

    for lvl, bal in priorities:
        if lvl in report["totals"]:
            report["totals"][lvl] += 1
            report["amounts"][lvl] += float(bal)
            report["totalOutstanding"] += float(bal)

    return report

# 4. Review History Audit Log
@router.get("/review-history", response_model=List[ReviewDecisionSchema])
def list_review_history(user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    role = user["role"]
    if role not in ["Financial Manager", "Head Accountant", "Accountant", "Assistant of Financial Manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view review history logs.")

    query = db.query(AIReviewDecision)
    # Accountants and Assistant FMs have limited audit history views (e.g. last 50 decisions only)
    if role in ["Accountant", "Assistant of Financial Manager"]:
        return query.order_by(AIReviewDecision.review_date.desc()).limit(50).all()
    
    return query.order_by(AIReviewDecision.review_date.desc()).all()

# 5. MongoDB trends snapshots endpoint
@router.get("/trends", response_model=List[TrendSnapshotSchema])
def get_trends(user: dict = Depends(get_user_role)):
    role = user["role"]
    if role not in ["Financial Manager", "Head Accountant", "Accountant", "Assistant of Financial Manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view financial trends.")

    try:
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[settings.MONGODB_DB]
        cursor = db["finance_trends"].find(
            {"metadata.clientId": "ALL_CLIENTS", "metadata.trendType": "weekly_collection"}
        ).sort("recordedAt", 1) # chronological order for line charts

        results = []
        for doc in cursor:
            results.append({
                "recordedAt": doc["recordedAt"],
                "clientId": doc["metadata"]["clientId"],
                "trendType": doc["metadata"]["trendType"],
                "totalOutstanding": float(doc.get("totalOutstanding", 0.0)),
                "overdueInvoiceCount": int(doc.get("overdueInvoiceCount", 0)),
                "collectedAmount": float(doc.get("collectedAmount", 0.0)),
                "averageCollectionDays": int(doc.get("averageCollectionDays", 0))
            })
        client.close()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trends from MongoDB: {str(e)}")

# 6. Audit Trail Endpoints
@router.get("/audit-trail/summary")
def get_audit_summary(user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    role = user["role"]
    username = user["username"]

    if role not in ["Financial Manager", "Head Accountant", "Accountant", "Assistant of Financial Manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view audit trail summary.")

    query = db.query(AIAuditEvent)

    if role in ["Accountant", "Assistant of Financial Manager"]:
        user_id_map = {
            "financial_manager_user": "USR-001",
            "head_accountant_user": "USR-002",
            "accountant_user": "USR-003",
            "assistant_fm_user": "USR-005"
        }
        mapped_user_id = user_id_map.get(username, username)
        query = query.filter((AIAuditEvent.user_id == mapped_user_id) | (AIAuditEvent.full_name == username))

    total_events = query.count()
    login_events = query.filter(AIAuditEvent.event_type.in_(["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT"])).count()
    duplicate_events = query.filter(AIAuditEvent.event_type.in_(["DUPLICATE_ALERT_CREATED", "DUPLICATE_ALERT_REVIEWED", "DUPLICATE_ALERT_DISMISSED"])).count()
    collection_events = query.filter(AIAuditEvent.event_type.in_(["COLLECTION_PRIORITY_GENERATED", "COLLECTION_RECOMMENDATION_REVIEWED"])).count()
    failed_attempts = query.filter((AIAuditEvent.result == "Failed") | (AIAuditEvent.event_type.in_(["LOGIN_FAILED", "UNAUTHORIZED_ACCESS"]))).count()

    return {
        "totalEvents": total_events,
        "loginEvents": login_events,
        "duplicateEvents": duplicate_events,
        "collectionEvents": collection_events,
        "failedAttempts": failed_attempts
    }

@router.get("/audit-trail")
def get_audit_trail(
    search: Optional[str] = Query(None),
    eventType: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    sortBy: str = Query("occurred_at"),
    sortDirection: str = Query("desc"),
    user: dict = Depends(get_user_role),
    db: Session = Depends(get_db)
):
    user_role = user["role"]
    username = user["username"]

    if user_role not in ["Financial Manager", "Head Accountant", "Accountant", "Assistant of Financial Manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view audit trail.")

    query = db.query(AIAuditEvent)

    if user_role in ["Accountant", "Assistant of Financial Manager"]:
        user_id_map = {
            "financial_manager_user": "USR-001",
            "head_accountant_user": "USR-002",
            "accountant_user": "USR-003",
            "assistant_fm_user": "USR-005"
        }
        mapped_user_id = user_id_map.get(username, username)
        query = query.filter((AIAuditEvent.user_id == mapped_user_id) | (AIAuditEvent.full_name == username))

    if eventType:
        query = query.filter(AIAuditEvent.event_type == eventType)
    if userId:
        query = query.filter(AIAuditEvent.user_id == userId)
    if role:
        query = query.filter(AIAuditEvent.role_name == role)
    if result:
        query = query.filter(AIAuditEvent.result == result)
    if dateFrom:
        try:
            dt_from = datetime.fromisoformat(dateFrom.replace('Z', '+00:00'))
            query = query.filter(AIAuditEvent.occurred_at >= dt_from)
        except Exception:
            pass
    if dateTo:
        try:
            dt_to = datetime.fromisoformat(dateTo.replace('Z', '+00:00'))
            query = query.filter(AIAuditEvent.occurred_at <= dt_to)
        except Exception:
            pass

    if search:
        search_like = f"%{search}%"
        query = query.filter(
            AIAuditEvent.action_description.ilike(search_like) |
            AIAuditEvent.event_type.ilike(search_like) |
            AIAuditEvent.source_reference.ilike(search_like) |
            AIAuditEvent.normalized_reference.ilike(search_like) |
            AIAuditEvent.full_name.ilike(search_like)
        )

    sort_column = getattr(AIAuditEvent, sortBy, AIAuditEvent.occurred_at)
    if sortDirection.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total_count = query.count()
    items = query.offset((page - 1) * pageSize).limit(pageSize).all()

    response_items = []
    for event in items:
        response_items.append({
            "eventId": str(event.event_id),
            "occurredAt": event.occurred_at.isoformat() + "Z" if event.occurred_at else None,
            "userId": event.user_id,
            "fullName": event.full_name,
            "role": event.role_name,
            "eventType": event.event_type,
            "action": event.action_description,
            "relatedRecordType": event.related_record_type,
            "sourceReference": event.source_reference,
            "normalizedReference": event.normalized_reference,
            "result": event.result,
            "ipAddress": event.ip_address,
            "userAgent": event.user_agent,
            "correlationId": event.correlation_id,
            "details": event.details
        })

    return {
        "items": response_items,
        "page": page,
        "pageSize": pageSize,
        "totalCount": total_count
    }

@router.get("/audit-trail/{eventId}")
def get_audit_event(eventId: str, user: dict = Depends(get_user_role), db: Session = Depends(get_db)):
    user_role = user["role"]
    username = user["username"]

    if user_role not in ["Financial Manager", "Head Accountant", "Accountant", "Assistant of Financial Manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view audit trail details.")

    event = db.query(AIAuditEvent).filter(AIAuditEvent.event_id == eventId).first()
    if not event:
        raise HTTPException(status_code=404, detail="Audit event not found.")

    if user_role in ["Accountant", "Assistant of Financial Manager"]:
        user_id_map = {
            "financial_manager_user": "USR-001",
            "head_accountant_user": "USR-002",
            "accountant_user": "USR-003",
            "assistant_fm_user": "USR-005"
        }
        mapped_user_id = user_id_map.get(username, username)
        if event.user_id != mapped_user_id and event.full_name != username:
            raise HTTPException(status_code=403, detail="Unauthorized to view details of this audit event.")

    return {
        "eventId": str(event.event_id),
        "occurredAt": event.occurred_at.isoformat() + "Z" if event.occurred_at else None,
        "userId": event.user_id,
        "fullName": event.full_name,
        "role": event.role_name,
        "eventType": event.event_type,
        "action": event.action_description,
        "relatedRecordType": event.related_record_type,
        "sourceReference": event.source_reference,
        "normalizedReference": event.normalized_reference,
        "result": event.result,
        "ipAddress": event.ip_address,
        "userAgent": event.user_agent,
        "correlationId": event.correlation_id,
        "details": event.details
    }
