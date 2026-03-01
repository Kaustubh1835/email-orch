from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.email import router as email_router
from app.api.v1.followup import router as followup_router
from app.api.v1.health import router as health_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(email_router)
api_router.include_router(followup_router)
