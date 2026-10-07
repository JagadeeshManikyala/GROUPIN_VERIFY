from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
import jwt
from app.core.config import settings, get_live_admin_credentials

router = APIRouter()

class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    identifier = req.email or req.username or ""
    
    # Read live admin credentials directly from .env dynamically
    admin_user, admin_pass = get_live_admin_credentials()
    
    if not admin_user or not admin_pass:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin credentials are not configured in backend .env"
        )

    is_valid_user = (identifier.strip() == admin_user)
    is_valid_password = (req.password == admin_pass)

    if not (is_valid_user and is_valid_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )

    token_data = {
        "sub": admin_user,
        "name": "Admin User",
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    
    token = jwt.encode(token_data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "email": admin_user,
            "name": "Admin User",
            "role": "admin"
        }
    )

@router.get("/me")
async def get_current_user():
    admin_user, _ = get_live_admin_credentials()
    return {
        "email": admin_user or "admin",
        "name": "Admin User",
        "role": "admin"
    }
