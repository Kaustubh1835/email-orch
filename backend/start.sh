#!/bin/bash

# Use PORT from environment (Render sets this), default to 8000
PORT="${PORT:-8000}"

# Start Celery worker in the background
celery -A app.celery_app.celery_config worker --loglevel=info &

# Start Celery beat in the background
celery -A app.celery_app.celery_config beat --loglevel=info &

# Start FastAPI server in the foreground
uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
