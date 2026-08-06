# Integrated System: FOMS & AI-Powered Financial Intelligence Layer

This repository contains the integrated code for the **Finance Operations Management System (FOMS)** and the **AI-Powered Financial Intelligence Layer**.

---

## 📂 Repository Structure

```text
FOMS-System-Repository/
│
├── foms-frontend/              ← React + TypeScript Staff Application (Port 5173)
├── foms-backend/               ← C# .NET 10 Web API, CQRS & DB Migrations (Port 5000)
│   └── database/               ← PostgreSQL & MongoDB schema files
├── speedpay-portal/            ← React + TypeScript SpeedPay Client Portal (PayMongo)
├── ai-frontend/                ← React AI Dashboard Frontend
├── ai-service/                 ← Python FastAPI AI Intelligence Service (Port 8000)
├── ai-gateway/                 ← ASP.NET Core 10 Integration Gateway (Port 5000)
├── proxy/                      ← Nginx Reverse Proxy Configuration (Port 80)
├── scripts/                    ← Utility & seed scripts
├── docker-compose.yml          ← Multi-service orchestration
├── .env.example                ← Environment variable template
├── .gitignore
├── TEST_CASE_TRACKING.md
├── USER_STORY_TRACKING.md
└── README.md
```

> **Note:** FOMS and AI Layer are separated as independent services — they do **not** share folders or filenames, even though they live in a single repository.

---

## 📌 Quick Access URLs & Ports

| Service / Documentation | Environment | URL / Endpoint |
|---|---|---|
| 🖥️ **FOMS Staff Web Application** | Frontend (Vite) | [http://localhost:5173](http://localhost:5173) |
| 💳 **SpeedPay Client Portal** | Frontend (Vite) | [http://localhost:5173/speedpay](http://localhost:5173/speedpay) |
| ⚡ **FOMS .NET 10 Web API** | Backend API | [http://localhost:5000/api](http://localhost:5000/api) |
| 🤖 **FastAPI AI Intelligence Engine** | AI Microservice | [http://localhost:8000](http://localhost:8000) |
| 📘 **FastAPI Swagger API Docs** | Interactive Docs | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

## 🌟 Main Features & Modules

### 1. Finance Operations Management System (FOMS)
- **Accounts Receivable & Invoicing**: Automated billing computation, VAT calculations, and aging buckets.
- **Digital Payments**: PayMongo checkout integration for GCash, Maya, and Cards.
- **Audit & Security**: Role-based access control (RBAC) with detailed before/after audit logs.
- **Official Receipts**: Auto-generated Official Receipts (OR) upon validated payment collection.

### 2. AI-Powered Financial Intelligence Layer
- **Duplicate Document Detection**: AI similarity scoring for invoices, receipts, and payment proof.
- **Collection Forecasting**: Predictive risk models for client delinquency and expected cash inflow.
- **Decision Support**: Automated payment recommendations without modifying core financial records (No-Touch Policy).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **FOMS Backend** | .NET 10 Web API, Entity Framework Core, SQL Server |
| **FOMS Frontend** | React, TypeScript, Vite, Vanilla CSS |
| **SpeedPay Portal** | React, TypeScript, PayMongo Payment Gateway |
| **AI Service** | Python, FastAPI, Gemini AI, Pandas, Scikit-Learn |
| **AI Gateway** | ASP.NET Core 10, C# |
| **AI Frontend** | React 19, TypeScript, Vite |
| **Proxy** | Nginx (Alpine) |
| **Orchestration** | Docker Compose |

---

## 🌿 Branching Strategy (Git Flow)

```
feature/foms-backend ──────┐
feature/foms-frontend ─────┤
feature/speedpay ──────────┤
feature/ai-service ────────┼──→ develop ──→ integration testing ──→ main
feature/ai-gateway ────────┤
feature/ai-frontend ───────┤
feature/docker-integration─┘
```

### Branches

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `develop` | Integration branch for all features |
| `feature/foms-backend` | FOMS .NET backend development |
| `feature/foms-frontend` | FOMS React frontend development |
| `feature/speedpay` | SpeedPay portal development |
| `feature/ai-service` | AI Python FastAPI service |
| `feature/ai-gateway` | AI .NET integration gateway |
| `feature/ai-frontend` | AI React dashboard |
| `feature/docker-integration` | Docker & deployment configs |

### Rules
- ❌ **Never** merge feature branches directly to `main`
- ✅ All feature branches merge into `develop` via **Pull Request**
- ✅ `develop` → `main` only after **integration testing** passes

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/crystalyjoyce/FOMS-System-Repository.git
   cd FOMS-System-Repository
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Start all services:
   ```bash
   docker-compose up --build
   ```
