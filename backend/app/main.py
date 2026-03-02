import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import RedirectResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.middleware.cors import add_cors_middleware
from app.middleware.error_handler import generic_exception_handler, validation_exception_handler
from app.api.router import api_router
from app.utils.rate_limit import limiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.config import get_settings
    from app.database import init_db

    settings = get_settings()
    db_host = settings.DATABASE_URL.split("@")[-1].split("/")[0] if "@" in settings.DATABASE_URL else "unknown"
    logger.info("Starting Email Orchestrator AI API...")
    logger.info("Database host: %s", db_host)
    logger.info("FRONTEND_URL: %s", settings.FRONTEND_URL)

    try:
        init_db()
        logger.info("Database tables verified.")
    except Exception as e:
        logger.error("Failed to initialize database: %s", e)

    yield
    logger.info("Shutting down Email Orchestrator AI API...")


app = FastAPI(
    title="Email Orchestrator AI API",
    description="AI-powered email generation and sending system using LangGraph orchestration",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware
add_cors_middleware(app)
app.state.limiter = limiter

# Exception handlers
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(Exception, generic_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Routes
app.include_router(api_router)


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")
