from sqlalchemy import create_engine, Column, Integer, String, Numeric, DateTime, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
from app.core.config import settings

engine = create_engine(settings.POSTGRES_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1. AI Processing Runs Model
class AIProcessingRun(Base):
    __tablename__ = "ai_processing_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    records_retrieved = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    error_message = Column(Text)

# 2. AI Duplicate Alerts Model
class AIDuplicateAlert(Base):
    __tablename__ = "ai_duplicate_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False)
    matched_field = Column(String(50), nullable=False)
    source_record_id = Column(String(100), nullable=False)
    matched_record_id = Column(String(100), nullable=False)
    similarity_score = Column(Numeric(5, 2), nullable=False)
    date_generated = Column(DateTime, default=datetime.utcnow)
    reason = Column(Text, nullable=False)
    review_status = Column(String(30), default="Pending Review", nullable=False)
    source_reference_value = Column(String(150))
    normalized_reference_value = Column(String(150))

    matches = relationship("AIDuplicateMatch", back_populates="alert", cascade="all, delete-orphan")

# 3. AI Duplicate Match Details Model
class AIDuplicateMatch(Base):
    __tablename__ = "ai_duplicate_matches"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("ai_duplicate_alerts.id", ondelete="CASCADE"))
    source_details = Column(JSONB, nullable=False)
    match_details = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    alert = relationship("AIDuplicateAlert", back_populates="matches")

# 4. AI Collection Priorities Model
class AICollectionPriority(Base):
    __tablename__ = "ai_collection_priorities"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(String(100), unique=True, nullable=False)
    invoice_number = Column(String(100), nullable=False)
    client_id = Column(String(100), nullable=False)
    client_name = Column(String(200), nullable=False)
    outstanding_balance = Column(Numeric(15, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    priority_level = Column(String(20), nullable=False)
    explanation_basis = Column(JSONB, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source_invoice_number = Column(String(150))
    normalized_invoice_number = Column(String(150))

    recommendations = relationship("AICollectionRecommendation", back_populates="priority", cascade="all, delete-orphan")

# 5. AI Collection Recommendations Model
class AICollectionRecommendation(Base):
    __tablename__ = "ai_collection_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    priority_id = Column(Integer, ForeignKey("ai_collection_priorities.id", ondelete="CASCADE"))
    recommended_action = Column(String(200), nullable=False)
    explanation_basis = Column(JSONB, nullable=False)
    review_status = Column(String(30), default="Pending Review", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    priority = relationship("AICollectionPriority", back_populates="recommendations")

# 6. AI Human Review Decisions Model
class AIReviewDecision(Base):
    __tablename__ = "ai_review_decisions"

    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String(50), nullable=False) # 'DUPLICATE_ALERT' or 'COLLECTION_RECOMMENDATION'
    target_id = Column(Integer, nullable=False)
    reviewer_username = Column(String(100), nullable=False)
    reviewer_role = Column(String(50), nullable=False)
    decision = Column(String(50), nullable=False)
    remarks = Column(Text)
    recommended_action = Column(String(100))
    review_date = Column(DateTime, default=datetime.utcnow)

# 7. AI Output and Execution Logs Model
class AIOutputLog(Base):
    __tablename__ = "ai_output_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_level = Column(String(10), nullable=False)
    message = Column(Text, nullable=False)
    service_name = Column(String(50), default="ai-service", nullable=False)
    correlation_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

# 8. AI Activity Logs Model
class AIActivityLog(Base):
    __tablename__ = "ai_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    status_dot = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    related_record = Column(String(50), nullable=False)
    time_ago = Column(String(50), nullable=False)
    user_role = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# 9. AI Audit Events Model
class AIAuditEvent(Base):
    __tablename__ = "ai_audit_events"

    event_id = Column(String(36), primary_key=True)
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String(100))
    full_name = Column(String(200))
    role_name = Column(String(100))
    event_type = Column(String(100), nullable=False)
    action_description = Column(Text, nullable=False)
    related_record_type = Column(String(100))
    source_reference = Column(String(200))
    normalized_reference = Column(String(200))
    result = Column(String(50), nullable=False)
    ip_address = Column(String(64))
    user_agent = Column(Text)
    details = Column(JSONB)
    correlation_id = Column(String(150))

