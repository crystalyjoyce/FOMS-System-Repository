import sys
import os

# Add the ai-service root to python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))
sys.path.append(os.path.dirname(__file__))

from app.models.database import SessionLocal, AICollectionPriority, AIRecommendation, AIPriorityFactor

def test_seed():
    db = SessionLocal()
    try:
        p1 = AICollectionPriority(invoice_id="INV-2026-JNT-0050", client_id="C-001", priority="High priority", score=92.5, explanation="High outstanding amount with past due date.")
        db.add(p1)
        db.flush()
        db.add(AIPriorityFactor(priority_result_id=p1.id, factor_name="Amount", factor_value="1500000", contribution=40.0))
        db.add(AIRecommendation(priority_result_id=p1.id, recommendation_text="Schedule a meeting with client to discuss payment terms", decision_support_notice="High priority client with large outstanding balance", status="Pending Review"))
        
        db.commit()
        print("Success")
    except Exception as e:
        print(f"Exception: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_seed()
