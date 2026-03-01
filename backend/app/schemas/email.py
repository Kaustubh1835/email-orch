from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr


class GenerateEmailRequest(BaseModel):
    sender: EmailStr
    receiver: EmailStr
    subject: str
    user_intent: str
    salutation: str | None = None


class GenerateEmailResponse(BaseModel):
    email_id: UUID
    formatted_email: str
    intent: str
    tone: str
    status: str

    class Config:
        from_attributes = True


class SendEmailRequest(BaseModel):
    email_id: UUID


class SendEmailResponse(BaseModel):
    success: bool
    gmail_message_id: str | None = None
    sent_at: datetime | None = None


class EmailSummary(BaseModel):
    id: UUID
    sender: str
    receiver: str
    subject: str
    intent: str | None
    tone: str | None
    status: str
    created_at: datetime
    sent_at: datetime | None

    class Config:
        from_attributes = True


class EmailDetail(BaseModel):
    id: UUID
    sender: str
    receiver: str
    subject: str
    body: str
    intent: str | None
    tone: str | None
    status: str
    gmail_message_id: str | None
    error_message: str | None
    created_at: datetime
    sent_at: datetime | None

    class Config:
        from_attributes = True


class EmailListResponse(BaseModel):
    emails: list[EmailSummary]
    total: int
    page: int
    page_size: int
