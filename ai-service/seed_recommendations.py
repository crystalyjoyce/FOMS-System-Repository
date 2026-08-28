import sys
import os
from datetime import datetime

# Add the ai-service root to python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))
sys.path.append(os.path.dirname(__file__))

from app.models.database import SessionLocal, AICollectionPriority, AIRecommendation

def seed_db():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(AIRecommendation).count()
        if existing > 0:
            print("Database already has recommendations. Seeding skipped.")
            # Clear existing for fresh start
            db.query(AIRecommendation).delete()
            db.query(AICollectionPriority).delete()
            print("Cleared existing recommendations for fresh seed.")
            # continue to seed...
        
        # Seed Priority 1
        p1 = AICollectionPriority(
            invoice_id="INV-2026-JNT-0050",
            client_id="C-001",
            priority="High priority",
            score=92.5,
            explanation="High outstanding amount with past due date."
        )
        db.add(p1)
        db.flush() # get id

        r1 = AIRecommendation(
            priority_result_id=p1.id,
            recommendation_text="Schedule a meeting with client to discuss payment terms",
            decision_support_notice="High priority client with large outstanding balance",
            status="Pending Review"
        )
        db.add(r1)

        # Seed Priority 2
        p2 = AICollectionPriority(
            invoice_id="INV-2026-LBC-0120",
            client_id="C-002",
            priority="High priority",
            score=85.0,
            explanation="Client has ignored 3 previous reminders."
        )
        db.add(p2)
        db.flush()

        r2 = AIRecommendation(
            priority_result_id=p2.id,
            recommendation_text="Send final warning letter before legal action",
            decision_support_notice="Client has history of delayed payments",
            status="Pending Review"
        )
        db.add(r2)
        
        # Seed Priority 3
        p3 = AICollectionPriority(
            invoice_id="INV-2026-SHP-0220",
            client_id="C-003",
            priority="Medium priority",
            score=60.0,
            explanation="Client is responsive but payment is slightly delayed."
        )
        db.add(p3)
        db.flush()

        r3 = AIRecommendation(
            priority_result_id=p3.id,
            recommendation_text="Follow up via email",
            decision_support_notice="Client usually pays after email reminder",
            status="Pending Review"
        )
        db.add(r3)

        db.commit()
        print("Database seeded with 3 pending recommendations successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
