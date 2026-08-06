# 🚀 Setup & Developer Guide: FOMS & AI-Powered Financial Intelligence Layer

This guide provides a step-by-step walkthrough for cloning the repository from GitHub and running the entire integrated system (Frontend, Backend, Databases, SpeedPay/PayMongo, and AI Layer) in **one command**.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- 🐙 **Git**: [Download Git](https://git-scm.com/downloads)
- 🐳 **Docker Desktop**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) *(Ensure Docker Desktop is running)*

---

## 📥 Step 1: Clone the Repository

Open your Terminal or PowerShell and run:

```bash
git clone https://github.com/crystalyjoyce/FOMS-System-Repository.git
cd FOMS-System-Repository
```

---

## ⚙️ Step 2: Set Up Environment Variables

Create your local `.env` configuration file from the template:

```bash
# On Windows (PowerShell):
copy .env.example .env

# On Mac / Linux:
cp .env.example .env
```

---

## 🚀 Step 3: Run the Entire System (1-Click Docker Launch)

Run the following command to build and launch all **9 integrated microservices** automatically:

```bash
docker-compose up -d --build
```

*(Docker will automatically build the images, start the databases, initialize tables, and launch all web apps & APIs.)*

---

## 🌐 Quick Access URLs & Ports

Once Docker completes, open any of the following URLs in your web browser:

| Application / Service | Description | URL |
|---|---|---|
| 🖥️ **FOMS Staff Web Application** | Staff Portal for Billing & Invoicing | [http://localhost](http://localhost) *(or [http://localhost:5173](http://localhost:5173))* |
| 💳 **SpeedPay Client Portal** | Client Payment Gateway (PayMongo) | [http://localhost/speedpay](http://localhost/speedpay) *(or [http://localhost:5174](http://localhost:5174))* |
| 📊 **AI Intelligence Dashboard** | Risk Forecasting & Duplicate Detection | [http://localhost:4173](http://localhost:4173) *(or [http://localhost:5175](http://localhost:5175))* |
| ⚡ **FOMS .NET 10 Web API** | Core Financial Backend API | [http://localhost:5000/api](http://localhost:5000/api) |
| 🤖 **FastAPI AI Engine (Swagger)** | Interactive AI Microservice API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) |
| 🐘 **PostgreSQL (pgAdmin 4 GUI)** | Web Database Manager | [http://localhost:5050](http://localhost:5050) |
| 🍃 **MongoDB (Mongo Express GUI)** | Web Database Manager | [http://localhost:8081](http://localhost:8081) |
| 🏥 **System Health Check** | Microservices Health Status | [http://localhost/health](http://localhost/health) |

---

## 💾 Step 4: Connecting Databases to Desktop Apps

If you prefer using desktop applications (e.g., **pgAdmin 4 Desktop**, **DBeaver**, **TablePlus**, **MongoDB Compass**):

### 🐘 PostgreSQL Connection (pgAdmin / DBeaver / TablePlus):
- **Host / Server**: `localhost` *(or `127.0.0.1`)*
- **Port**: `5432`
- **Database**: `foms_ai_db`
- **Username**: `postgres`
- **Password**: `postgres`

### 🍃 MongoDB Connection (MongoDB Compass):
- **URI Connection String**: `mongodb://localhost:27017`
- **Database**: `foms_trends_db`

---

## 💳 Step 5: Testing PayMongo Payment Flow in SpeedPay

1. Open **SpeedPay Portal**: [http://localhost:5174](http://localhost:5174) *(or [http://localhost/speedpay](http://localhost/speedpay))*.
2. Navigate to **"Pay Invoice"**.
3. Select an invoice from the dropdown.
4. Choose your payment method (**GCash**, **Maya**, or **Card**).
5. Click **"Pay via PayMongo →"**.
6. The system will create a live PayMongo Checkout Session via `.NET Backend` (`POST /api/speedpay/initiate-invoice`) and redirect you to PayMongo!
7. Once payment is completed on PayMongo, PayMongo sends an automated **Webhook** to `POST /api/speedpay/webhook` to verify the HMAC signature and auto-generate an **Official Receipt (OR)**.

---

## 🛑 How to Stop or Reset the System

- **Stop all services**:
  ```bash
  docker-compose down
  ```

- **Complete Clean Reset (Clear volumes and rebuild from scratch)**:
  ```bash
  docker-compose down -v
  docker-compose up -d --build
  ```

---

## 🌿 Git Flow Branching Reference

| Branch | Purpose |
|---|---|
| `develop` | **Default Integration Branch** (All features merged here) |
| `main` | Production-ready stable release |
| `feature/foms-backend` | FOMS .NET 10 Web API |
| `feature/foms-frontend` | FOMS Staff Application |
| `feature/speedpay` | SpeedPay Client Portal + PayMongo Integration |
| `feature/ai-service` | Python FastAPI AI Intelligence Engine |
| `feature/ai-gateway` | .NET Integration Gateway |
| `feature/ai-frontend` | AI Dashboard Web Application |
| `feature/docker-integration` | Docker Compose Orchestration & Nginx Proxy |
