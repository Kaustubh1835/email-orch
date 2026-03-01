import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Email(Base):
    __tablename__ = "emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(255), nullable=False)
    receiver = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    intent = Column(String(50))
    tone = Column(String(50))
    status = Column(String(20), default="draft", index=True)  # draft, sent, failed
    gmail_message_id = Column(String(255))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    sent_at = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="emails")
    follow_ups = relationship("FollowUp", back_populates="email", cascade="all, delete-orphan")
