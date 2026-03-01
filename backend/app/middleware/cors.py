from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings


def add_cors_middleware(app):
    settings = get_settings()
    origins = [settings.FRONTEND_URL]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
