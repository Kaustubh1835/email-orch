from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import RedirectResponse
from app.middleware.cors import add_cors_middleware
from app.middleware.error_handler import generic_exception_handler, validation_exception_handler
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — create tables if they don't exist
    from app.database import init_db
    print("Starting Email Orchestrator AI API...")
    init_db()
    print("Database tables verified.")
    yield
    # Shutdown
    print("Shutting down Email Orchestrator AI API...")


app = FastAPI(
    title="Email Orchestrator AI API",
    description="AI-powered email generation and sending system using LangGraph orchestration",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware
add_cors_middleware(app)

# Exception handlers
app.add_exception_handler(Exception, generic_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Routes
app.include_router(api_router)


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")
