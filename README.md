# 🚀 FOMS AI Intelligence Layer (`AI-LAYER`)

Official AI Intelligence Engine and Duplicate Detection System for Speedex FOMS.

---

## 📌 Quick Access URLs

Once running, access the services using these URLs:

| Service / Documentation | Environment | URL |
|---|---|---|
| 🖥️ **Frontend Web Application** | Local Development | [http://localhost:5174](http://localhost:5174) |
| 🌐 **Frontend (Nginx Production)** | Docker Container | [http://localhost](http://localhost) |
| ⚡ **FastAPI Backend AI Service** | Direct Container | [http://localhost:8000](http://localhost:8000) |
| 🌉 **Integration Gateway API** | ASP.NET Gateway | [http://localhost:5000](http://localhost:5000) |
| 📘 **Swagger Interactive API Docs** | FastAPI Swagger UI | [http://localhost:8000/docs](http://localhost:8000/docs) |
| 📕 **ReDoc API Documentation** | ReDoc OpenAPI | [http://localhost:8000/redoc](http://localhost:8000/redoc) |
| 📄 **OpenAPI Schema (JSON)** | Raw JSON Schema | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) |
| 🏥 **Health Check Endpoint** | System Health | [http://localhost:8000/health](http://localhost:8000/health) |

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Clone the Repository
Open Terminal / PowerShell and run:

```bash
git clone -b testing-ai-layer-backend https://github.com/JoanaOgaya/AI-LAYER.git
cd AI-LAYER
```

---

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**Bash / Linux / Mac:**
```bash
cp .env.example .env
```

Open `.env` and add your **Gemini API Key**:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

---

### Step 3: Launch Backend Containers with Docker
Build and start all backend services (PostgreSQL, MongoDB, AI Service, Gateway, Nginx):

```bash
docker compose up -d --build
```

Verify that containers are running cleanly:
```bash
docker ps
```

*Expected running containers:*
- `foms-ai-service` (Port 8000)
- `foms-ai-gateway` (Port 5000)
- `foms-nginx-proxy` (Port 80)
- `foms-postgres` (Port 5432)
- `foms-mongodb` (Port 27017)

---

### Step 4: Initialize Database Tables & Staff Users
Run database schema creation & staff user seeder:

```bash
# Create PostgreSQL tables (ai_unique_documents, ai_review_history, ai_audit_events)
docker exec foms-ai-service python -c "from app.models.database import engine, Base; Base.metadata.create_all(bind=engine)"

# Seed staff login accounts (EMP-001 to EMP-006)
docker exec foms-ai-service python seed_staff.py
```

---

### Step 5: Start the Frontend Application
Open a new terminal window inside the `AI-LAYER/frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at **[http://localhost:5174](http://localhost:5174)**.

---

## 🔑 Login Credentials

Use any of these staff accounts to sign in:

| Employee ID | User Role | Default Passcode |
|---|---|---|
| `EMP-001` | Financial Manager | `123456` |
| `EMP-002` | Head Accountant | `123456` |
| `EMP-003` | Accountant | `123456` |
| `EMP-004` | Coordinator | `123456` |
| `EMP-005` | Assistant of Financial Manager | `123456` |

---

## 📖 How to Open API Documentation

### 1. Swagger UI (Interactive Testing)
Open **[http://localhost:8000/docs](http://localhost:8000/docs)** in your browser to:
- Test API endpoints (`/api/ai/duplicates/scan`, `/api/ai/duplicates`, etc.) directly.
- View request and response JSON schemas.
- Authorize requests using JWT tokens (`Bearer <token>`).

### 2. ReDoc (Comprehensive Specification)
Open **[http://localhost:8000/redoc](http://localhost:8000/redoc)** for:
- Beautifully formatted three-panel API documentation.
- Detailed parameter breakdowns and payload examples.
- Non-interactive readable specification for developers and auditors.

---

## 🛠️ Useful Commands Summary

| Task | Command |
|---|---|
| Stop containers | `docker compose down` |
| Restart AI service | `docker compose restart foms-ai-service` |
| View AI service logs | `docker logs foms-ai-service --tail 100 -f` |
| View Gateway logs | `docker logs foms-ai-gateway --tail 100 -f` |
| Run frontend dev server | `cd frontend && npm run dev` |