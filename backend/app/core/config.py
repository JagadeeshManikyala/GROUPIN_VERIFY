import os
from pydantic_settings import BaseSettings
from typing import Optional, Tuple

# Resolve absolute paths to potential .env locations
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(os.path.dirname(_CURRENT_DIR))
_ROOT_DIR = os.path.dirname(_BACKEND_DIR)

_ROOT_ENV = os.path.join(_ROOT_DIR, ".env")
_BACKEND_ENV = os.path.join(_BACKEND_DIR, ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Groupin Account Checker API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/groupin"
    
    # Contacts & Account Verification API Configuration (Loaded from backend/.env)
    CONTACTS_CHECK_URL: Optional[str] = None
    CONTACTS_API_KEY: Optional[str] = None
    GROUPIN_API_URL: Optional[str] = None
    GROUPIN_API_KEY: Optional[str] = None
    GROUPIN_API_SECRET: Optional[str] = None
    GROUPIN_BATCH_SIZE: int = 500
    GROUPIN_MAX_RETRIES: int = 3
    GROUPIN_REQUEST_DELAY_MS: int = 100
    GROUPIN_REQUEST_TIMEOUT: int = 30
    USE_MOCK_GROUPIN: bool = False

    # Groups SaaS Bot API Configuration (Loaded from backend/.env)
    GROUPS_API_URL: Optional[str] = None
    GROUPS_API_KEY: Optional[str] = None
    
    # Authentication & JWT Secrets (Loaded from backend/.env)
    JWT_SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ADMIN_USERNAME: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None
    
    # Database Configuration
    DATABASE_URL: str = "sqlite:///./groupin.db"
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"
    
    # File Storage
    MAX_UPLOAD_SIZE_MB: int = 100
    UPLOAD_DIR: str = os.path.join(_BACKEND_DIR, "uploads")
    RESULT_DIR: str = os.path.join(_BACKEND_DIR, "results")
    
    class Config:
        env_file: Tuple[str, ...] = (_ROOT_ENV, _BACKEND_ENV, ".env")
        env_file_encoding = "utf-8"
        extra = "allow"

settings = Settings()

def get_live_admin_credentials() -> Tuple[Optional[str], Optional[str]]:
    """
    Reads ADMIN_USERNAME and ADMIN_PASSWORD dynamically from .env on each request.
    This guarantees that whenever a user edits backend/.env, the changes take effect
    immediately in real time, and prior credentials are immediately invalidated.
    """
    import dotenv
    env_paths = [_BACKEND_ENV, _ROOT_ENV, ".env"]
    for path in env_paths:
        if os.path.exists(path):
            vals = dotenv.dotenv_values(path)
            u = vals.get("ADMIN_USERNAME")
            p = vals.get("ADMIN_PASSWORD")
            if u is not None and p is not None:
                return (u.strip(), p.strip())
            if u is not None:
                return (u.strip(), p.strip() if p else None)
    
    # Fallback to process environment or settings
    u = os.getenv("ADMIN_USERNAME") or settings.ADMIN_USERNAME
    p = os.getenv("ADMIN_PASSWORD") or settings.ADMIN_PASSWORD
    return (u.strip() if u else None, p.strip() if p else None)

# Ensure storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.RESULT_DIR, exist_ok=True)
