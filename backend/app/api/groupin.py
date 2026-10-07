import os
import json
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.config import settings
from app.models.job import Job
from app.models.result import AccountCheckResult
from app.schemas.groupin import (
    SingleCheckRequest,
    SingleCheckResponse,
    UploadResponse,
    JobStatusResponse,
    AccountResultItem,
    ResultsPageResponse
)
from app.services.excel_service import ExcelService, normalize_indian_mobile
from app.services.groupin_service import get_groupin_service
from app.workers.groupin_worker import process_job_background

router = APIRouter()

# Temporary store for validated numbers until job start
JOB_NUMBERS_CACHE: dict = {}

def generate_job_id(db: Session) -> str:
    today_str = datetime.utcnow().strftime("%Y%m%d")
    count_today = db.query(Job).filter(Job.job_id.like(f"GRP-{today_str}-%")).count()
    return f"GRP-{today_str}-{(count_today + 1):03d}"

@router.get("/sample-template")
async def download_sample_template():
    """Download a pre-formatted sample Excel file with expected columns."""
    excel_stream = ExcelService.generate_sample_file()
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=groupin_sample_numbers.xlsx"}
    )

@router.post("/check", response_model=SingleCheckResponse)
async def check_single_number(request: SingleCheckRequest):
    """Check a single mobile number against Groupin account database."""
    is_valid, normalized, reason = normalize_indian_mobile(request.mobile_number)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid mobile number format: {reason}")

    service = get_groupin_service()
    res = await service.check_account(normalized)
    return SingleCheckResponse(
        mobile_number=res.mobile_number,
        account_exists=res.account_exists,
        user_id=res.user_id,
        name=res.name,
        status=res.status,
        error=res.error,
        email=res.email,
        dob=res.dob,
        alternate_phone=res.alternate_phone,
        about=res.about,
        location=res.location,
        user_type=res.user_type,
        last_active=res.last_active,
        registered_on=res.registered_on,
        verified=res.verified,
    )

@router.post("/upload", response_model=UploadResponse)
async def upload_excel_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and validate an Excel file (.xlsx, .xls) containing mobile numbers.
    Does not start processing automatically; returns validation metrics and Job ID.
    """
    filename = file.filename or "unknown.xlsx"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".xlsx", ".xls", ".csv"]:
        raise HTTPException(status_code=400, detail="Only .xlsx, .xls, and .csv files are supported.")

    # Read content
    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB}MB.")

    job_id = generate_job_id(db)
    saved_filename = f"{job_id}_{filename}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)
    
    with open(saved_path, "wb") as f:
        f.write(contents)

    # Parse and validate numbers
    try:
        parsed_data = ExcelService.parse_and_validate(saved_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading Excel file: {str(e)}")

    valid_list = parsed_data["valid_list"]
    JOB_NUMBERS_CACHE[job_id] = valid_list

    # Also persist numbers to scratch cache json file for reliability
    cache_path = os.path.join(settings.UPLOAD_DIR, f"{job_id}_numbers.json")
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(valid_list, f)

    new_job = Job(
        job_id=job_id,
        filename=filename,
        total_numbers=parsed_data["total_numbers"],
        valid_numbers=parsed_data["valid_numbers"],
        invalid_numbers=parsed_data["invalid_numbers"],
        duplicate_numbers=parsed_data["duplicate_numbers"],
        status="VALIDATING"
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return UploadResponse(
        job_id=new_job.job_id,
        filename=new_job.filename,
        total_numbers=new_job.total_numbers,
        valid_numbers=new_job.valid_numbers,
        invalid_numbers=new_job.invalid_numbers,
        duplicate_numbers=new_job.duplicate_numbers,
        sample_valid=parsed_data["sample_valid"],
        sample_invalid=parsed_data["sample_invalid"]
    )

@router.post("/jobs/{job_id}/start")
async def start_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Trigger background batch processing for an uploaded job."""
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.status == "PROCESSING":
        return {"message": "Job is already running.", "job_id": job_id, "status": job.status}

    # Retrieve valid numbers from memory or cached json
    numbers = JOB_NUMBERS_CACHE.get(job_id)
    if not numbers:
        cache_path = os.path.join(settings.UPLOAD_DIR, f"{job_id}_numbers.json")
        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                numbers = json.load(f)
        else:
            raise HTTPException(status_code=400, detail="Validated numbers not found for this job. Please re-upload.")

    job.status = "PROCESSING"
    job.started_at = datetime.utcnow()
    db.commit()

    background_tasks.add_task(process_job_background, job_id, numbers)
    return {"message": "Processing started", "job_id": job_id, "status": "PROCESSING"}

@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """Fetch live status, counts, and estimated completion time for a job."""
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    # Calculate progress %
    total_to_process = job.valid_numbers or 1
    pct = round((job.processed_numbers / total_to_process) * 100, 1)
    pct = min(100.0, pct)

    # Elapsed & Estimated Remaining Time
    elapsed = None
    remaining = None
    if job.started_at:
        end_time = job.completed_at or datetime.utcnow()
        diff_sec = (end_time - job.started_at).total_seconds()
        elapsed = max(1, int(round(diff_sec))) if diff_sec > 0.05 else (1 if job.completed_at else 0)

        if job.status == "PROCESSING" and job.processed_numbers > 0:
            rate = job.processed_numbers / max(1, elapsed)
            remaining_numbers = max(0, job.valid_numbers - job.processed_numbers)
            remaining = int(remaining_numbers / max(0.1, rate))

    has_download = bool(job.result_file_path and os.path.exists(job.result_file_path))

    return JobStatusResponse(
        job_id=job.job_id,
        filename=job.filename,
        status=job.status,
        total_numbers=job.total_numbers,
        valid_numbers=job.valid_numbers,
        invalid_numbers=job.invalid_numbers,
        duplicate_numbers=job.duplicate_numbers,
        processed_numbers=job.processed_numbers,
        accounts_found=job.accounts_found,
        not_registered=job.not_registered,
        failed=job.failed,
        progress_percentage=pct,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        elapsed_time_seconds=elapsed,
        estimated_remaining_seconds=remaining,
        has_download=has_download
    )

@router.get("/jobs/{job_id}/results", response_model=ResultsPageResponse)
async def get_job_results(
    job_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve paginated and filtered list of verified results for a job."""
    query = db.query(AccountCheckResult).filter(AccountCheckResult.job_id == job_id)

    if search:
        query = query.filter(
            (AccountCheckResult.mobile_number.ilike(f"%{search}%")) |
            (AccountCheckResult.name.ilike(f"%{search}%")) |
            (AccountCheckResult.groupin_user_id.ilike(f"%{search}%"))
        )

    if status and status != "ALL":
        if status.upper() == "EXISTS":
            query = query.filter(AccountCheckResult.groupin_account_exists == True)
        elif status.upper() == "NOT_EXISTS":
            query = query.filter(AccountCheckResult.groupin_account_exists == False)
        else:
            query = query.filter(AccountCheckResult.status.ilike(status))

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)

    items = query.order_by(AccountCheckResult.id.asc()).offset((page - 1) * page_size).limit(page_size).all()

    # Get job level stats
    job = db.query(Job).filter(Job.job_id == job_id).first()
    accounts_found = job.accounts_found if job else 0
    not_registered = job.not_registered if job else 0
    failed = job.failed if job else 0

    return ResultsPageResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        accounts_found=accounts_found,
        not_registered=not_registered,
        failed=failed
    )

@router.get("/jobs/{job_id}/download")
async def download_job_results(job_id: str, db: Session = Depends(get_db)):
    """Download the completed verification report Excel file."""
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if not job.result_file_path or not os.path.exists(job.result_file_path):
        # Generate on the fly if needed
        all_results = db.query(AccountCheckResult).filter(AccountCheckResult.job_id == job_id).all()
        if not all_results:
            raise HTTPException(status_code=400, detail="No results available for download.")
            
        result_filename = f"groupin_results_{job_id}.xlsx"
        result_file_path = os.path.join(settings.RESULT_DIR, result_filename)
        ExcelService.export_results_excel(job, all_results, result_file_path)
        job.result_file_path = result_file_path
        db.commit()

    return FileResponse(
        path=job.result_file_path,
        filename=os.path.basename(job.result_file_path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str, db: Session = Depends(get_db)):
    """Cancel a running job."""
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.status not in ["PROCESSING", "VALIDATING", "PENDING"]:
        return {"message": f"Job is already {job.status}", "job_id": job_id, "status": job.status}

    job.status = "CANCELLED"
    job.completed_at = datetime.utcnow()
    db.commit()
    return {"message": "Job cancelled", "job_id": job_id, "status": "CANCELLED"}

@router.get("/jobs")
async def list_recent_jobs(
    limit: int = 15,
    db: Session = Depends(get_db)
):
    """List recent verification jobs."""
    jobs = db.query(Job).order_by(desc(Job.created_at)).limit(limit).all()
    return jobs
