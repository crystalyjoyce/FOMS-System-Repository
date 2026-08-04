from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.database import get_db
import bcrypt
import base64
import json
import time

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class ChangePasswordRequest(BaseModel):
    username: str
    current_password: str
    new_password: str

def create_app_jwt(username: str, role: str, permissions: list, client_id: str, password_version: int):
    header = {"alg": "none", "typ": "JWT"}
    payload = {
        "unique_name": username,
        "role": role,
        "permissions": permissions,
        "client_id": client_id,
        "account_type": "Client" if role == "Client" else "Staff",
        "password_version": str(password_version),
        "exp": int(time.time()) + 3600
    }
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    return f"{header_b64}.{payload_b64}."

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("SELECT * FROM users WHERE login_id = :login_id OR email = :login_id"), 
            {"login_id": request.username}
        ).mappings().first()
        
        if not result:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        # Check password
        if not bcrypt.checkpw(request.password.encode('utf-8'), result["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
            
        permissions = []
            
        client_id = result["login_id"] if result["role_name"] == "Client" else ""
        
        token = create_app_jwt(
            username=result["full_name"],
            role=result["role_name"],
            permissions=permissions,
            client_id=client_id,
            password_version=result.get("password_version", 1)
        )
        
        return {
            "token": token,
            "user": {
                "username": result["full_name"],
                "role": result["role_name"],
                "must_change_password": result.get("must_change_password", False)
            }
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@router.post("/change-password")
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM users WHERE login_id = :login_id"), 
        {"login_id": request.username}
    ).mappings().first()
    
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    if not bcrypt.checkpw(request.current_password.encode('utf-8'), result["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    new_hash = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    db.execute(
        text("""
            UPDATE users SET 
                password_hash = :new_hash, 
                password_version = password_version + 1,
                must_change_password = FALSE,
                is_temporary_password = FALSE,
                password_changed_at = CURRENT_TIMESTAMP
            WHERE login_id = :login_id
        """),
        {"new_hash": new_hash, "login_id": request.username}
    )
    db.commit()
    
    return {"success": True, "message": "Password updated successfully"}
