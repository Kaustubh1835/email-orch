import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.email import Email
from app.models.followup import FollowUp
from app.schemas.followup import ScheduleFollowupRequest, FollowupResponse, FollowupListResponse
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/followups", tags=["Follow-ups"])


@router.post("", response_model=FollowupResponse, status_code=status.HTTP_201_CREATED)
def schedule_followup(
    data: ScheduleFollowupRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    email = db.query(Email).filter(Email.id == data.email_id, Email.user_id == user.id).first()
    if not email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    if email.status != "sent":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only schedule follow-ups for sent emails")

    # Create a placeholder email that will appear in history as "scheduled"
    followup_email = Email(
        user_id=user.id,
        sender=email.sender,
        receiver=email.receiver,
        subject=f"Follow-up: {email.subject}",
        body="This follow-up email is scheduled and will be generated automatically at the scheduled time.",
        intent="follow_up",
        status="scheduled",
    )
    db.add(followup_email)
    db.flush()

    followup = FollowUp(
        email_id=data.email_id,
        scheduled_at=data.scheduled_at,
        status="pending",
    )
    db.add(followup)
    db.commit()
    db.refresh(followup)

    # Schedule Celery task — pass both IDs so the task can update the placeholder email
    try:
        from app.celery_app.tasks import send_followup

        task = send_followup.apply_async(
            args=[str(followup.id), str(followup_email.id)],
            eta=data.scheduled_at,
        )
        followup.celery_task_id = task.id
        db.commit()
    except Exception as exc:
        logger.warning("Failed to queue Celery task for followup %s: %s", followup.id, exc)

    return FollowupResponse.model_validate(followup)


@router.get("", response_model=FollowupListResponse)
def list_followups(
    email_id: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = (
        db.query(FollowUp)
        .join(Email)
        .filter(Email.user_id == user.id)
    )
    if email_id:
        query = query.filter(FollowUp.email_id == email_id)
    if status_filter:
        query = query.filter(FollowUp.status == status_filter)

    total = query.count()
    followups = query.order_by(FollowUp.scheduled_at.desc()).all()

    return FollowupListResponse(
        followups=[FollowupResponse.model_validate(f) for f in followups],
        total=total,
    )


@router.delete("/{followup_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_followup(
    followup_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    followup = (
        db.query(FollowUp)
        .join(Email)
        .filter(FollowUp.id == followup_id, Email.user_id == user.id)
        .first()
    )
    if not followup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found")

    followup.status = "cancelled"

    # Also mark the placeholder follow-up email as cancelled
    original_email = db.query(Email).filter(Email.id == followup.email_id).first()
    if original_email:
        placeholder = (
            db.query(Email)
            .filter(
                Email.user_id == original_email.user_id,
                Email.subject == f"Follow-up: {original_email.subject}",
                Email.status == "scheduled",
                Email.intent == "follow_up",
            )
            .first()
        )
        if placeholder:
            placeholder.status = "cancelled"

    # Revoke Celery task if exists
    if followup.celery_task_id:
        try:
            from app.celery_app.celery_config import celery_app

            celery_app.control.revoke(followup.celery_task_id, terminate=True)
        except Exception as exc:
            logger.warning("Failed to revoke Celery task %s: %s", followup.celery_task_id, exc)

    db.commit()
