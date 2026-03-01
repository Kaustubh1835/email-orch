from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    return {
        "status": "healthy",
        "service": "Email Orchestrator AI API",
        "database": db_status,
    }
