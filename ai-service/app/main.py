from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
from app.core.config import settings
from app.services.sync import run_synchronization
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Setup Background Scheduler for ETL sync
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and run initial sync inside scheduler
    logger.info("Initializing background scheduler...")
    
    # Schedule periodic data sync
    scheduler.add_job(
        run_synchronization, 
        'interval', 
        minutes=settings.SYNC_INTERVAL_MINUTES,
        id='etl_sync_job',
        replace_existing=True
    )
    scheduler.start()
    logger.info(f"Sync scheduler started. Will sync every {settings.SYNC_INTERVAL_MINUTES} minutes.")
    
    # Run a synchronous initial sync on startup to populate database
    try:
        logger.info("Running initial startup synchronization...")
        run_synchronization()
    except Exception as e:
        logger.warning(f"Initial startup synchronization failed (will retry in next scheduler run): {e}")

    yield

    # Shutdown: Clean up scheduler
    logger.info("Shutting down background scheduler...")
    scheduler.shutdown()

app = FastAPI(
    title=settings.PROJECT_NAME, 
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to gateway / frontend hosts
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Secret Check Middleware for security
@app.middleware("http")
async def verify_gateway_api_key(request, call_next):
    # Skip docs and health checks from key requirements
    if request.url.path in ["/health", "/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)
        
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        # Fallback to check Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # Let Bearer validation pass or handle it in Gateway. 
            # In our side-car architecture, gateway appends X-API-Key.
            pass
        elif auth_header and auth_header.startswith("ApiKey "):
            api_key = auth_header.split(" ")[1]
            
    if api_key != settings.AI_SERVICE_API_KEY:
        # For development, allow local calls if no API key is specified and they come from localhost
        host = request.client.host
        if host in ["127.0.0.1", "localhost"] and not api_key:
            # Let it proceed for easy local tests
            pass
        else:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access Forbidden: Invalid Service API Key"}
            )
            
    return await call_next(request)

# Include main router
app.include_router(router)

@app.get("/health")
def get_health():
    return {"status": "healthy", "service": "foms-ai-service"}
