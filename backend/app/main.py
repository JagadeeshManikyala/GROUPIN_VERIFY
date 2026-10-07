import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.groupin import router as groupin_router
from app.api.auth import router as auth_router
from app.api.groups import router as groups_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("groupin_app")

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-performance backend API for checking Groupin user accounts in bulk."
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(groupin_router, prefix=settings.API_V1_STR, tags=["Groupin Account Checker"])
app.include_router(groups_router, prefix=f"{settings.API_V1_STR}/groups", tags=["Groups API"])
app.include_router(groups_router, prefix="/api/groups", tags=["Groups API"])
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "mock_mode": settings.USE_MOCK_GROUPIN,
        "batch_size": settings.GROUPIN_BATCH_SIZE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
