import logging
import ssl
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

logger = logging.getLogger(__name__)


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
    engine = get_engine()
    Base.metadata.create_all(bind=engine)

    # Add billing columns to existing users table (safe for production)
    billing_columns = [
        ("emails_generated", "INTEGER DEFAULT 0 NOT NULL"),
        ("emails_sent", "INTEGER DEFAULT 0 NOT NULL"),
        ("stripe_customer_id", "VARCHAR(255)"),
        ("stripe_subscription_id", "VARCHAR(255)"),
        ("plan", "VARCHAR(20) DEFAULT 'free' NOT NULL"),
        ("plan_expires_at", "TIMESTAMPTZ"),
    ]
    with engine.connect() as conn:
        for col_name, col_type in billing_columns:
            try:
                conn.execute(text(
                    f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                ))
            except Exception as e:
                logger.debug("Column %s may already exist: %s", col_name, e)
        conn.commit()
