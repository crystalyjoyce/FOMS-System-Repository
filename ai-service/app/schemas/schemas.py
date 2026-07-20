from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime, date

# Generic Response
class MessageResponse(BaseModel):
    message: str

# Review Request
class ReviewRequest(BaseModel):
    decision: str = Field(..., description="Decision made (e.g. Reviewed, Dismissed, Accepted as Recommendation, Rejected)")
    remarks: Optional[str] = Field(None, description="Detailed remarks")
    recommendedAction: Optional[str] = Field(None, description="Recommended action to proceed")

# Duplicate Alert Detail Response
class DuplicateMatchSchema(BaseModel):
    source_details: dict
    match_details: dict

    class Config:
        from_attributes = True

class DuplicateAlertSchema(BaseModel):
    id: int
    alert_type: str
    matched_field: str
    source_record_id: str
    matched_record_id: str
    similarity_score: float
    date_generated: datetime
    reason: str
    review_status: str
    source_reference_value: Optional[str] = None
    normalized_reference_value: Optional[str] = None
    matches: Optional[List[DuplicateMatchSchema]] = []

    class Config:
        from_attributes = True

# Collection Priority Response
class CollectionPrioritySchema(BaseModel):
    id: int
    invoice_id: str
    invoice_number: str
    client_id: str
    client_name: str
    outstanding_balance: float
    due_date: date
    priority_level: str
    explanation_basis: List[str]
    updated_at: datetime
    source_invoice_number: Optional[str] = None
    normalized_invoice_number: Optional[str] = None

    class Config:
        from_attributes = True

# Collection Recommendation Response
class CollectionRecommendationSchema(BaseModel):
    id: int
    priority_id: int
    recommended_action: str
    explanation_basis: List[str]
    review_status: str
    updated_at: datetime
    priority: Optional[CollectionPrioritySchema] = None

    class Config:
        from_attributes = True

# Audit Review Decision Response
class ReviewDecisionSchema(BaseModel):
    id: int
    target_type: str
    target_id: int
    reviewer_username: str
    reviewer_role: str
    decision: str
    remarks: Optional[str]
    recommended_action: Optional[str]
    review_date: datetime

    class Config:
        from_attributes = True

# Trend Snapshot Data Schema (For MongoDB response)
class TrendSnapshotSchema(BaseModel):
    recordedAt: datetime
    clientId: str
    trendType: str
    totalOutstanding: float
    overdueInvoiceCount: int
    collectedAmount: float
    averageCollectionDays: int
