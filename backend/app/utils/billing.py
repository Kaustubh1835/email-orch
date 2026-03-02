from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.utils.auth import get_current_user

FREE_GENERATION_LIMIT = 1
FREE_SEND_LIMIT = 1


def require_generate_quota(user: User = Depends(get_current_user)) -> User:
    """Raise 403 if the user has exhausted their free generation quota and is not subscribed."""
    if user.plan == "basic" and user.plan_expires_at and user.plan_expires_at > datetime.now(timezone.utc):
        return user
    if user.emails_generated >= FREE_GENERATION_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Free generation limit reached. Please upgrade to Basic plan.",
        )
    return user


def require_send_quota(user: User = Depends(get_current_user)) -> User:
    """Raise 403 if the user has exhausted their free send quota and is not subscribed."""
    if user.plan == "basic" and user.plan_expires_at and user.plan_expires_at > datetime.now(timezone.utc):
        return user
    if user.emails_sent >= FREE_SEND_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Free send limit reached. Please upgrade to Basic plan.",
        )
    return user
