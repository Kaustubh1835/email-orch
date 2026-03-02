import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Billing
    emails_generated = Column(Integer, default=0, server_default="0", nullable=False)
    emails_sent = Column(Integer, default=0, server_default="0", nullable=False)
    stripe_customer_id = Column(String(255), unique=True, index=True)
    stripe_subscription_id = Column(String(255))
    plan = Column(String(20), default="free", server_default="free", nullable=False)
    plan_expires_at = Column(DateTime(timezone=True))

    emails = relationship("Email", back_populates="user", cascade="all, delete-orphan")
