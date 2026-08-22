# How to Run the FOMS System Locally (Step-by-Step)

This guide explains the exact steps required to start the entire FOMS system from scratch on your local machine.

## Phase 1: Start the Databases (The Foundation)
You only need to do this once per session.

1. **SQL Server**: This runs natively on Windows. Ensure the `SQL Server (SQLEXPRESS)` service is running in your Windows Services manager.
2. **Docker Databases**: Open a terminal in this root repository folder (`FOMS-System-Repository`) and run:
   ```powershell
   docker-compose up -d
   ```
   *(This starts PostgreSQL, MongoDB, and pgAdmin in the background).*

---

## Phase 2: Start the Backends (The Brains)
You will need **three** separate PowerShell windows for this phase. Keep them running!

### 1. Main FOMS Backend (.NET)
* **Terminal**: Open a new PowerShell window.
* **Path**: Navigate to `foms-backend\FOMS.Api`
* **Command**:
  ```powershell
  dotnet run
  ```
* **Verify**: Open `http://localhost:5000/swagger`. If you see the Swagger API page, it is perfectly connected to SQL Server.

### 2. AI Service (Python)
* **Terminal**: Open a new PowerShell window.
* **Path**: Navigate to `ai-service`
* **Command**:
  ```powershell
  .\venv\Scripts\activate
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
* **Verify**: Open `http://localhost:8000/health/ready`. If it says "CONNECTED" for Postgres and MongoDB, it is working perfectly!

### 3. AI Gateway Proxy (.NET)
* **Terminal**: Open a new PowerShell window.
* **Path**: Navigate to `ai-gateway`
* **Command**:
  ```powershell
  dotnet run
  ```
* *(Note: This runs on port 5002 and acts as the bridge. If the terminal says "Application started", it is good!)*

---

## Phase 3: Start the Frontends (The UIs)
Now that the backends are running, you can start the websites. Open **three more** PowerShell windows.

### 1. Main Staff Frontend
* **Terminal**: Open a new PowerShell window.
* **Path**: Navigate to `foms-frontend`
* **Command**:
  ```powershell
  npm run dev
  ```
* **Verify**: Open `http://localhost:5173`. Try to log in.

### 2. AI Dashboard
* **Terminal**: Open a new PowerShell window.
* **Path**: Navigate to `ai-frontend`
* **Command**:
  ```powershell
  npm run dev
  ```
* **Verify**: Open `http://localhost:5175`. If the dashboard loads without red error popups, it is successfully talking through the AI Gateway!

### 3. SpeedPay Client Portal
* **Terminal**: Open a new PowerShell window.
* **Path**: Navigate to `speedpay-portal`
* **Command**:
  ```powershell
  npm run dev
  ```
* **Verify**: Open `http://localhost:5174`.

---

## Troubleshooting

* **Port 5002 already in use?** If the AI Gateway crashes with "Failed to bind to address", run this command to forcefully close the hidden stuck process, then try `dotnet run` again:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5002).OwningProcess -Force
  ```
* **Missing Python `.env` connection?** Make sure you activated your python virtual environment `.\venv\Scripts\activate` *before* running uvicorn!
