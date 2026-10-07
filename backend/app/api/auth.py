import os
import json
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
import jwt
from app.core.config import settings, get_live_admin_credentials, _BACKEND_ENV

router = APIRouter()

# Path for saving non-secret profile metadata (name, avatar)
PROFILE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "profile.json")

def get_saved_profile() -> dict:
    if os.path.exists(PROFILE_FILE):
        try:
            with open(PROFILE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"name": "Admin User", "avatar": None}

def save_profile_metadata(name: Optional[str] = None, avatar: Optional[str] = None) -> dict:
    os.makedirs(os.path.dirname(PROFILE_FILE), exist_ok=True)
    current = get_saved_profile()
    if name is not None:
        current["name"] = name
    if avatar is not None:
        current["avatar"] = avatar
    with open(PROFILE_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, ensure_ascii=False)
    return current

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

    profile = get_saved_profile()
    display_name = profile.get("name") or "Admin User"
    avatar = profile.get("avatar")

    token_data = {
        "sub": admin_user,
        "name": display_name,
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    
    token = jwt.encode(token_data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "email": admin_user,
            "name": display_name,
            "role": "admin",
            "avatar": avatar
        }
    )

@router.get("/me")
async def get_current_user():
    admin_user, _ = get_live_admin_credentials()
    profile = get_saved_profile()
    return {
        "email": admin_user or "admin",
        "name": profile.get("name") or "Admin User",
        "role": "admin",
        "avatar": profile.get("avatar")
    }

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    avatar: Optional[str] = None

def update_live_admin_credentials(new_username: Optional[str] = None, new_password: Optional[str] = None):
    if not os.path.exists(_BACKEND_ENV):
        return
    with open(_BACKEND_ENV, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    new_lines = []
    found_user = False
    found_pass = False
    for line in lines:
        if new_username and line.strip().startswith("ADMIN_USERNAME="):
            new_lines.append(f"ADMIN_USERNAME={new_username.strip()}\n")
            found_user = True
        elif new_password and line.strip().startswith("ADMIN_PASSWORD="):
            new_lines.append(f"ADMIN_PASSWORD={new_password.strip()}\n")
            found_pass = True
        else:
            new_lines.append(line)
            
    if new_username and not found_user:
        new_lines.append(f"ADMIN_USERNAME={new_username.strip()}\n")
    if new_password and not found_pass:
        new_lines.append(f"ADMIN_PASSWORD={new_password.strip()}\n")
        
    with open(_BACKEND_ENV, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

@router.post("/update-profile")
async def update_profile(req: UpdateProfileRequest):
    admin_user, admin_pass = get_live_admin_credentials()
    
    # If new password requested, verify current password
    if req.new_password:
        if not req.current_password or req.current_password != admin_pass:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        if len(req.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters"
            )
    
    new_email = req.email.strip() if req.email else (admin_user or "admin@groupin.com")
    new_pass = req.new_password.strip() if req.new_password else None
    
    # Save credential changes directly to backend/.env
    if req.email or req.new_password:
        update_live_admin_credentials(
            new_username=new_email if req.email else None,
            new_password=new_pass
        )
    
    # Save name and avatar persistently
    profile = save_profile_metadata(name=req.name, avatar=req.avatar)
    display_name = profile.get("name") or (req.name or "Admin User")
    avatar = profile.get("avatar")

    # Issue fresh token
    token_data = {
        "sub": new_email,
        "name": display_name,
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    new_token = jwt.encode(token_data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    return {
        "success": True,
        "message": "Profile updated successfully! New credentials are now active.",
        "access_token": new_token,
        "user": {
            "email": new_email,
            "name": display_name,
            "role": "admin",
            "avatar": avatar
        }
    }


