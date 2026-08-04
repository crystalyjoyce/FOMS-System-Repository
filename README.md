# Integrated System: FOMS & AI-Powered Financial Intelligence Layer

This repository contains the integrated code for the **Finance Operations Management System (FOMS)** and the **AI-Powered Financial Intelligence Layer**.

---

## 📂 System Architecture & Modules

```text
FOMS-System-Repository/
├── 📁 FOMS.Backend/         <-- C# .NET 10 Web API Backend, Controllers, CQRS & DB Migrations (Port 5000)
├── 📁 FOMS.Frontend/        <-- React + TypeScript Staff Application Frontend (Port 5173)
├── 📁 speedpay-portal/      <-- React + TypeScript SpeedPay Client Portal (PayMongo Integrated)
└── 📁 ai-layer-be/          <-- Python FastAPI AI Layer Service (Port 8000)
```

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
- **FOMS Backend**: .NET 10 Web API, Entity Framework Core, SQL Server
- **FOMS Frontend**: React, TypeScript, Vite, Vanilla CSS
- **SpeedPay Portal**: React, TypeScript, PayMongo Payment Gateway
- **AI Layer**: Python, FastAPI, Gemini AI, Pandas, Scikit-Learn
