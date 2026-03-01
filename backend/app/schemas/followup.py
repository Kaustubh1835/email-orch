from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel, field_validator


class ScheduleFollowupRequest(BaseModel):
    email_id: UUID
    scheduled_at: datetime

    @field_validator("scheduled_at")
    @classmethod
    def must_be_in_future(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= datetime.now(timezone.utc):
            raise ValueError("scheduled_at must be in the future")
        return v


class FollowupResponse(BaseModel):
    id: UUID
    email_id: UUID
    scheduled_at: datetime
    status: str
    retry_count: int
    created_at: datetime
    executed_at: datetime | None

    class Config:
        from_attributes = True


class FollowupListResponse(BaseModel):
    followups: list[FollowupResponse]
    total: int
