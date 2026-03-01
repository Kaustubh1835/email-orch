from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings


def add_cors_middleware(app):
    settings = get_settings()
    origins = [
        o.strip()
        for o in settings.FRONTEND_URL.split(",")
        if o.strip()
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
