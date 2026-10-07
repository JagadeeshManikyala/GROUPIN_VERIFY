from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(64), unique=True, index=True, nullable=False)
    filename = Column(String(255), nullable=False)
    
    total_numbers = Column(Integer, default=0)
    valid_numbers = Column(Integer, default=0)
    invalid_numbers = Column(Integer, default=0)
    duplicate_numbers = Column(Integer, default=0)
    
    processed_numbers = Column(Integer, default=0)
    accounts_found = Column(Integer, default=0)
    not_registered = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    
    status = Column(String(32), default="PENDING", index=True)  # PENDING, VALIDATING, PROCESSING, COMPLETED, FAILED, CANCELLED
    result_file_path = Column(String(512), nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
