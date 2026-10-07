from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class SingleCheckRequest(BaseModel):
    mobile_number: str = Field(..., description="Mobile number to verify (e.g. +919876543210)")

class SingleCheckResponse(BaseModel):
    mobile_number: str
    account_exists: bool
    user_id: Optional[str] = None
    name: Optional[str] = None
    status: str
    error: Optional[str] = None
    # Extended profile fields (populated when the API provides them or in mock mode)
    email: Optional[str] = None
    dob: Optional[str] = None
    alternate_phone: Optional[str] = None
    about: Optional[str] = None
    location: Optional[str] = None
    user_type: Optional[str] = None
    last_active: Optional[str] = None
    registered_on: Optional[str] = None
    verified: Optional[bool] = None

class UploadResponse(BaseModel):
    job_id: str
    filename: str
    total_numbers: int
    valid_numbers: int
    invalid_numbers: int
    duplicate_numbers: int
    sample_valid: List[str] = []
    sample_invalid: List[dict] = []

class JobStatusResponse(BaseModel):
    job_id: str
    filename: str
    status: str
    total_numbers: int
    valid_numbers: int
    invalid_numbers: int
    duplicate_numbers: int
    processed_numbers: int
    accounts_found: int
    not_registered: int
    failed: int
    progress_percentage: float = 0.0
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    elapsed_time_seconds: Optional[int] = None
    estimated_remaining_seconds: Optional[int] = None
    has_download: bool = False

class AccountResultItem(BaseModel):
    id: int
    job_id: str
    mobile_number: str
    groupin_account_exists: bool
    groupin_user_id: Optional[str] = None
    name: Optional[str] = None
    status: str
    error: Optional[str] = None
    checked_at: datetime

    class Config:
        from_attributes = True

class ResultsPageResponse(BaseModel):
    items: List[AccountResultItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    accounts_found: int
    not_registered: int
    failed: int
