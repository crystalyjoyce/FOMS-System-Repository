from fastapi import FastAPI, Header, HTTPException, Query, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

app = FastAPI(title="Mock Legacy FOMS API", version="1.0.0")

# Secured read-only API Key (configured as 'change-me' for development)
API_KEY = "change-me"

def verify_api_key(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    if not authorization.startswith("ApiKey "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization schema. Use 'ApiKey <key>'"
        )
    key = authorization.split(" ")[1]
    if key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key"
        )

# Seed Data representing Capstone 1 FOMS
MOCK_WAYBILLS = [
    {"waybillId": "WB-001", "waybillNumber": "WB-2026-001", "clientId": "C-001", "clientName": "Acme Corp", "amount": 25000.0, "status": "Validated", "updatedAt": "2026-07-15T08:00:00Z"},
    {"waybillId": "WB-002", "waybillNumber": "wb 2026 001", "clientId": "C-001", "clientName": "Acme Corp", "amount": 25000.0, "status": "Validated", "updatedAt": "2026-07-16T09:00:00Z"},  # Suspected duplicate of WB-001
    {"waybillId": "WB-003", "waybillNumber": "WB-2026-002", "clientId": "C-002", "clientName": "Beta Industries", "amount": 15000.0, "status": "Validated", "updatedAt": "2026-07-17T10:00:00Z"},
    {"waybillId": "WB-004", "waybillNumber": "WB-2026-003", "clientId": "C-003", "clientName": "Gamma Logix", "amount": 42000.0, "status": "Pending", "updatedAt": "2026-07-18T11:00:00Z"},
    {"waybillId": "WB-005", "waybillNumber": "wb-2026-003", "clientId": "C-003", "clientName": "Gamma Logix", "amount": 42000.0, "status": "Validated", "updatedAt": "2026-07-19T12:00:00Z"},  # Suspected duplicate of WB-004
]

MOCK_INVOICES = [
    {"invoiceId": "INV-001", "invoiceNumber": "INV-2026-001", "clientId": "C-001", "clientName": "Acme Corp", "amount": 50000.0, "dueDate": "2026-06-20", "invoiceStatus": "Sent", "paymentStatus": "Unpaid", "waybillNumber": "WB-2026-001", "billingReference": "REF-ACME-01", "updatedAt": "2026-07-10T08:00:00Z"},  # Overdue (30 days overdue based on 2026-07-20 current date)
    {"invoiceId": "INV-002", "invoiceNumber": "inv-2026-001", "clientId": "C-001", "clientName": "Acme Corp", "amount": 50000.0, "dueDate": "2026-06-20", "invoiceStatus": "Sent", "paymentStatus": "Unpaid", "waybillNumber": "wb 2026 001", "billingReference": "REF-ACME-01", "updatedAt": "2026-07-11T09:00:00Z"},  # Suspected duplicate invoice
    {"invoiceId": "INV-003", "invoiceNumber": "INV-2026-002", "clientId": "C-002", "clientName": "Beta Industries", "amount": 15000.0, "dueDate": "2026-07-25", "invoiceStatus": "Sent", "paymentStatus": "Unpaid", "waybillNumber": "WB-2026-002", "billingReference": "REF-BETA-02", "updatedAt": "2026-07-12T10:00:00Z"},  # Due soon (5 days left)
    {"invoiceId": "INV-004", "invoiceNumber": "INV-2026-003", "clientId": "C-003", "clientName": "Gamma Logix", "amount": 95000.0, "dueDate": "2026-06-15", "invoiceStatus": "Sent", "paymentStatus": "Unpaid", "waybillNumber": "WB-2026-003", "billingReference": "REF-GAMMA-03", "updatedAt": "2026-07-13T11:00:00Z"},  # Highly overdue (35 days overdue, large amount)
    {"invoiceId": "INV-005", "invoiceNumber": "INV-2026-004", "clientId": "C-004", "clientName": "Delta Co", "amount": 8000.0, "dueDate": "2026-08-15", "invoiceStatus": "Sent", "paymentStatus": "Unpaid", "waybillNumber": "WB-2026-004", "billingReference": "REF-DELTA-04", "updatedAt": "2026-07-14T12:00:00Z"},  # Not due
    {"invoiceId": "INV-006", "invoiceNumber": "INV-2026-005", "clientId": "C-005", "clientName": "Epsilon Corp", "amount": 35000.0, "dueDate": "2026-07-05", "invoiceStatus": "Sent", "paymentStatus": "Paid", "waybillNumber": "WB-2026-005", "billingReference": "REF-EPS-05", "updatedAt": "2026-07-15T13:00:00Z"},  # Already paid
]

MOCK_PAYMENTS = [
    {"paymentId": "PAY-001", "paymentReference": "PAY-REF-100", "clientId": "C-001", "amount": 25000.0, "paymentStatus": "Validated", "updatedAt": "2026-07-15T09:00:00Z"},
    {"paymentId": "PAY-002", "paymentReference": "PAY-REF-100", "clientId": "C-001", "amount": 25000.0, "paymentStatus": "Pending", "updatedAt": "2026-07-16T10:00:00Z"},  # Duplicate payment reference
]

MOCK_OFFICIAL_RECEIPTS = [
    {"orId": "OR-001", "orNumber": "OR-777888", "paymentId": "PAY-001", "amount": 25000.0, "updatedAt": "2026-07-15T09:30:00Z"},
    {"orId": "OR-002", "orNumber": "or-777888", "paymentId": "PAY-002", "amount": 25000.0, "updatedAt": "2026-07-16T10:30:00Z"},  # Duplicate OR number
]

MOCK_SPEEDPAY = [
    {"submissionId": "SP-001", "referenceNumber": "SP-999000", "clientId": "C-001", "amount": 50000.0, "status": "Pending", "updatedAt": "2026-07-17T11:00:00Z"},
    {"submissionId": "SP-002", "referenceNumber": "sp 999 000", "clientId": "C-001", "amount": 50000.0, "status": "Pending", "updatedAt": "2026-07-18T12:00:00Z"},  # Duplicate SpeedPay reference
]

MOCK_ACCOUNTS_RECEIVABLE = [
    {"invoiceId": "INV-001", "invoiceNumber": "INV-2026-001", "clientId": "C-001", "clientName": "Acme Corp", "amount": 50000.0, "outstandingBalance": 50000.0, "dueDate": "2026-06-20", "daysOverdue": 30, "agingBucket": "1-30 Days", "updatedAt": "2026-07-20T00:00:00Z"},
    {"invoiceId": "INV-002", "invoiceNumber": "inv-2026-001", "clientId": "C-001", "clientName": "Acme Corp", "amount": 50000.0, "outstandingBalance": 50000.0, "dueDate": "2026-06-20", "daysOverdue": 30, "agingBucket": "1-30 Days", "updatedAt": "2026-07-20T00:00:00Z"},
    {"invoiceId": "INV-003", "invoiceNumber": "INV-2026-002", "clientId": "C-002", "clientName": "Beta Industries", "amount": 15000.0, "outstandingBalance": 15000.0, "dueDate": "2026-07-25", "daysOverdue": 0, "agingBucket": "Current", "updatedAt": "2026-07-20T00:00:00Z"},
    {"invoiceId": "INV-004", "invoiceNumber": "INV-2026-003", "clientId": "C-003", "clientName": "Gamma Logix", "amount": 95000.0, "outstandingBalance": 95000.0, "dueDate": "2026-06-15", "daysOverdue": 35, "agingBucket": "31-60 Days", "updatedAt": "2026-07-20T00:00:00Z"},
    {"invoiceId": "INV-005", "invoiceNumber": "INV-2026-004", "clientId": "C-004", "clientName": "Delta Co", "amount": 8000.0, "outstandingBalance": 8000.0, "dueDate": "2026-08-15", "daysOverdue": 0, "agingBucket": "Current", "updatedAt": "2026-07-20T00:00:00Z"},
]

MOCK_CASH_FLOW = [
    {"date": "2026-07-14", "inflow": 45000.0, "outflow": 20000.0, "net": 25000.0},
    {"date": "2026-07-15", "inflow": 60000.0, "outflow": 15000.0, "net": 45000.0},
    {"date": "2026-07-16", "inflow": 30000.0, "outflow": 10000.0, "net": 20000.0},
    {"date": "2026-07-17", "inflow": 55000.0, "outflow": 35000.0, "net": 20000.0},
    {"date": "2026-07-18", "inflow": 12000.0, "outflow": 8000.0, "net": 4000.0},
    {"date": "2026-07-19", "inflow": 8000.0, "outflow": 5000.0, "net": 3000.0},
    {"date": "2026-07-20", "inflow": 25000.0, "outflow": 12000.0, "net": 13000.0},
]

MOCK_COLLECTION_HISTORY = [
    {"historyId": "H-001", "clientId": "C-001", "clientName": "Acme Corp", "invoiceId": "INV-001", "actionTaken": "Email Reminder Sent", "contactDate": "2026-07-10", "outcome": "Unresolved"},
    {"historyId": "H-002", "clientId": "C-003", "clientName": "Gamma Logix", "invoiceId": "INV-004", "actionTaken": "Phone Call Made", "contactDate": "2026-07-12", "outcome": "Unresolved - Promised payment by 2026-07-18, not received"},
]

# Helper to apply filters and pagination
def paginate_and_filter(items: List[dict], updated_after: Optional[str], page: int, page_size: int):
    # Filter by date if updated_after is set
    filtered_items = items
    if updated_after:
        try:
            dt_after = datetime.fromisoformat(updated_after.replace("Z", "+00:00"))
            filtered_items = []
            for item in items:
                item_date = datetime.fromisoformat(item["updatedAt"].replace("Z", "+00:00"))
                if item_date > dt_after:
                    filtered_items.append(item)
        except ValueError:
            pass # ignore invalid date format

    start = (page - 1) * page_size
    end = start + page_size
    paginated = filtered_items[start:end]

    return {
        "items": paginated,
        "page": page,
        "pageSize": page_size,
        "totalCount": len(filtered_items)
    }

# FastAPI Routes
@app.get("/api/ai-data/waybills")
def get_waybills(
    updatedAfter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=500),
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)
    return paginate_and_filter(MOCK_WAYBILLS, updatedAfter, page, pageSize)

@app.get("/api/ai-data/invoices")
def get_invoices(
    updatedAfter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=500),
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)
    return paginate_and_filter(MOCK_INVOICES, updatedAfter, page, pageSize)

@app.get("/api/ai-data/payments")
def get_payments(
    updatedAfter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=500),
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)
    return paginate_and_filter(MOCK_PAYMENTS, updatedAfter, page, pageSize)

@app.get("/api/ai-data/official-receipts")
def get_official_receipts(
    updatedAfter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=500),
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)
    return paginate_and_filter(MOCK_OFFICIAL_RECEIPTS, updatedAfter, page, pageSize)

@app.get("/api/ai-data/speedpay-submissions")
def get_speedpay_submissions(
    updatedAfter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=500),
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)
    return paginate_and_filter(MOCK_SPEEDPAY, updatedAfter, page, pageSize)

@app.get("/api/ai-data/accounts-receivable")
def get_accounts_receivable(
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=500),
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)
    # Accounts receivable doesn't filter by updatedAfter, just pagination
    start = (page - 1) * pageSize
    end = start + pageSize
    return {
        "items": MOCK_ACCOUNTS_RECEIVABLE[start:end],
        "page": page,
        "pageSize": pageSize,
        "totalCount": len(MOCK_ACCOUNTS_RECEIVABLE)
    }

@app.get("/api/ai-data/cash-flow")
def get_cash_flow(
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)
    return MOCK_CASH_FLOW

@app.get("/api/ai-data/collection-history")
def get_collection_history(
    authorization: Optional[str] = Header(None)
):
    verify_api_key(authorization)
    return MOCK_COLLECTION_HISTORY

@app.get("/health")
def get_health():
    return {"status": "healthy", "service": "mock-legacy-foms"}
