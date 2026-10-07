from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.core.database import Base

class AccountCheckResult(Base):
    __tablename__ = "account_check_results"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(64), index=True, nullable=False)
    mobile_number = Column(String(32), index=True, nullable=False)
    groupin_account_exists = Column(Boolean, index=True, default=False)
    groupin_user_id = Column(String(64), nullable=True)
    name = Column(String(128), nullable=True)
    status = Column(String(32), index=True, default="Pending")  # Active, Inactive, Not Registered, Failed
    error = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)
