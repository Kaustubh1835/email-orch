import ssl
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings


class Base(DeclarativeBase):
    pass


_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        db_url = get_settings().DATABASE_URL
        connect_args = {}

        # Render PostgreSQL requires SSL
        if "render.com" in db_url or "sslmode" in db_url:
            connect_args["sslmode"] = "require"

        _engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args=connect_args,
        )
    return _engine


def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import all models so Base.metadata knows about them
    from app.models import User, Email, FollowUp  # noqa: F401
    Base.metadata.create_all(bind=get_engine())
