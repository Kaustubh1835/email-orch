#!/bin/bash

# Start Celery worker in the background
celery -A app.celery_app.celery_config worker --loglevel=info &

# Start Celery beat in the background
celery -A app.celery_app.celery_config beat --loglevel=info &

# Start FastAPI server in the foreground
uvicorn app.main:app --host 0.0.0.0 --port 8000
