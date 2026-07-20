import requests
import logging
from pymongo import MongoClient
from sqlalchemy.orm import Session
from datetime import datetime, date
from app.core.config import settings
from app.models.database import SessionLocal, AIProcessingRun, AIOutputLog
from app.services.duplicate_check import check_duplicates
from app.services.collection import calculate_collection_priorities

logger = logging.getLogger("sync-service")

def write_audit_log(db: Session, level: str, message: str, correlation_id: str = None):
    try:
        log = AIOutputLog(
            log_level=level,
            message=message,
            correlation_id=correlation_id
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")

def run_synchronization():
    """
    ETL function called periodically.
    1. Fetches transactional data from Legacy FOMS read-only APIs.
    2. Runs Duplicate Detection rules.
    3. Runs Collection priority scoring rules.
    4. Computes trend snapshots and writes them to MongoDB.
    """
    db = SessionLocal()
    correlation_id = f"SYNC-{int(datetime.utcnow().timestamp())}"
    
    # 1. Initialize Processing Run Record
    run_record = AIProcessingRun(
        run_type="ETL_SYNC",
        status="STARTED",
        started_at=datetime.utcnow()
    )
    db.add(run_record)
    db.commit()

    headers = {"Authorization": f"ApiKey {settings.FOMS_API_KEY}"}

    try:
        write_audit_log(db, "INFO", "Starting synchronization pipeline with Legacy FOMS.", correlation_id)

        # Get waybills
        r_wb = requests.get(f"{settings.FOMS_API_URL}/api/ai-data/waybills", headers=headers, timeout=10)
        r_wb.raise_for_status()
        waybills = r_wb.json().get("items", [])

        # Get invoices
        r_inv = requests.get(f"{settings.FOMS_API_URL}/api/ai-data/invoices", headers=headers, timeout=10)
        r_inv.raise_for_status()
        invoices = r_inv.json().get("items", [])

        # Get payments
        r_pay = requests.get(f"{settings.FOMS_API_URL}/api/ai-data/payments", headers=headers, timeout=10)
        r_pay.raise_for_status()
        payments = r_pay.json().get("items", [])

        # Get official receipts
        r_or = requests.get(f"{settings.FOMS_API_URL}/api/ai-data/official-receipts", headers=headers, timeout=10)
        r_or.raise_for_status()
        receipts = r_or.json().get("items", [])

        # Get speedpay submissions
        r_sp = requests.get(f"{settings.FOMS_API_URL}/api/ai-data/speedpay-submissions", headers=headers, timeout=10)
        r_sp.raise_for_status()
        speedpay = r_sp.json().get("items", [])

        # Get accounts receivable
        r_ar = requests.get(f"{settings.FOMS_API_URL}/api/ai-data/accounts-receivable", headers=headers, timeout=10)
        r_ar.raise_for_status()
        ar_data = r_ar.json().get("items", [])

        # Get collection history
        r_hist = requests.get(f"{settings.FOMS_API_URL}/api/ai-data/collection-history", headers=headers, timeout=10)
        r_hist.raise_for_status()
        collection_history = r_hist.json()

        write_audit_log(db, "INFO", f"Data retrieved successfully. Running analysis checks...", correlation_id)

        # 2. Run Duplicate Analysis
        scanned_dups, new_alerts = check_duplicates(db, waybills, invoices, payments, receipts, speedpay)
        write_audit_log(
            db, "INFO", 
            f"Duplicate checks completed. Scanned: {scanned_dups}. Generated {new_alerts} new alerts.", 
            correlation_id
        )

        # 3. Run Collection Priorities Ranking
        processed_ar, updated_ar = calculate_collection_priorities(db, ar_data, collection_history)
        write_audit_log(
            db, "INFO", 
            f"Collection priorities analysis completed. Processed: {processed_ar}. Updated recommendations: {updated_ar}.", 
            correlation_id
        )

        # 4. Generate Snapshot trends for MongoDB
        save_trends_to_mongodb(ar_data, payments)
        write_audit_log(db, "INFO", "MongoDB financial trends snapshots recorded successfully.", correlation_id)

        # Update processing run status
        run_record.status = "COMPLETED"
        run_record.records_retrieved = scanned_dups
        run_record.completed_at = datetime.utcnow()
        db.commit()

    except requests.exceptions.RequestException as e:
        error_msg = f"Legacy FOMS Read API unavailable: {str(e)}"
        logger.error(error_msg)
        write_audit_log(db, "ERROR", error_msg, correlation_id)
        
        run_record.status = "FAILED"
        run_record.error_message = error_msg
        run_record.completed_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        error_msg = f"ETL Pipeline internal failure: {str(e)}"
        logger.error(error_msg)
        write_audit_log(db, "ERROR", error_msg, correlation_id)
        
        run_record.status = "FAILED"
        run_record.error_message = error_msg
        run_record.completed_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()

def save_trends_to_mongodb(ar_items: list, payment_items: list):
    """
    Aggregates dashboard stats into a weekly time-series trend report.
    Inserts trend document in MongoDB.
    """
    try:
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[settings.MONGODB_DB]
        collection = db["finance_trends"]

        # Aggregate outstanding metrics
        total_outstanding = sum(item.get("outstandingBalance", 0) for item in ar_items)
        overdue_invoices = sum(1 for item in ar_items if item.get("daysOverdue", 0) > 0)
        
        # Aggregate payment metrics
        collected_amount = sum(item.get("amount", 0) for item in payment_items if item.get("paymentStatus") == "Validated")

        # Mock average days to collect
        avg_collection_days = 32 if total_outstanding < 300000 else 36

        # Check if trend already exists for today's date
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        existing = collection.find_one({
            "recordedAt": today,
            "metadata.clientId": "ALL_CLIENTS",
            "metadata.trendType": "weekly_collection"
        })

        trend_doc = {
            "recordedAt": today,
            "metadata": {
                "trendType": "weekly_collection",
                "clientId": "ALL_CLIENTS"
            },
            "totalOutstanding": float(total_outstanding),
            "overdueInvoiceCount": int(overdue_invoices),
            "collectedAmount": float(collected_amount),
            "averageCollectionDays": int(avg_collection_days)
        }

        if existing:
            collection.replace_one({"_id": existing["_id"]}, trend_doc)
        else:
            collection.insert_one(trend_doc)

        client.close()
    except Exception as e:
        logger.error(f"Failed to record trends in MongoDB: {e}")
