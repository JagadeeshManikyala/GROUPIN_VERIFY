import os
import asyncio
import logging
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.job import Job
from app.models.result import AccountCheckResult
from app.services.groupin_service import get_groupin_service
from app.services.excel_service import ExcelService
from app.core.config import settings

logger = logging.getLogger(__name__)

async def process_job_background(job_id: str, valid_numbers: List[str]):
    """
    Asynchronous background worker to process phone numbers in configurable batches,
    saving results incrementally into the database and generating the final result Excel.
    """
    db: Session = SessionLocal()
    groupin_service = get_groupin_service()
    batch_size = max(1, settings.GROUPIN_BATCH_SIZE)

    try:
        job = db.query(Job).filter(Job.job_id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found in database.")
            return

        job.status = "PROCESSING"
        job.started_at = datetime.utcnow()
        db.commit()

        total = len(valid_numbers)
        processed = 0
        accounts_found = 0
        not_registered = 0
        failed = 0

        # Process in batches
        for i in range(0, total, batch_size):
            # Check if job was cancelled
            db.refresh(job)
            if job.status == "CANCELLED":
                logger.info(f"Job {job_id} was cancelled by user.")
                return

            batch = valid_numbers[i:i + batch_size]
            check_results = await groupin_service.check_accounts(batch)

            # Prepare bulk DB records
            db_records = []
            for item in check_results:
                processed += 1
                if item.error or item.status == "Failed":
                    failed += 1
                elif item.account_exists:
                    accounts_found += 1
                else:
                    not_registered += 1

                db_records.append(AccountCheckResult(
                    job_id=job_id,
                    mobile_number=item.mobile_number,
                    groupin_account_exists=item.account_exists,
                    groupin_user_id=item.user_id,
                    name=item.name,
                    status=item.status,
                    error=item.error,
                    checked_at=datetime.utcnow()
                ))

            # Bulk insert records
            db.bulk_save_objects(db_records)

            # Update job progress
            job.processed_numbers = processed
            job.accounts_found = accounts_found
            job.not_registered = not_registered
            job.failed = failed
            db.commit()

            # Optional delay to respect rate limit
            if settings.GROUPIN_REQUEST_DELAY_MS > 0:
                await asyncio.sleep(settings.GROUPIN_REQUEST_DELAY_MS / 1000.0)

        # Mark job completed
        job.status = "COMPLETED"
        job.completed_at = datetime.utcnow()

        # Generate final Excel file
        all_results = db.query(AccountCheckResult).filter(AccountCheckResult.job_id == job_id).all()
        result_filename = f"groupin_results_{job_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.xlsx"
        result_file_path = os.path.join(settings.RESULT_DIR, result_filename)
        ExcelService.export_results_excel(job, all_results, result_file_path)

        job.result_file_path = result_file_path
        db.commit()
        logger.info(f"Job {job_id} completed successfully. Exported to {result_file_path}")

    except Exception as e:
        logger.exception(f"Fatal error processing job {job_id}: {e}")
        try:
            db.rollback()
            job = db.query(Job).filter(Job.job_id == job_id).first()
            if job:
                job.status = "FAILED"
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
