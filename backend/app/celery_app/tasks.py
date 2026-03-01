import logging
from datetime import datetime, timezone
from uuid import UUID
from app.celery_app.celery_config import celery_app
from app.database import get_session_local
from app.models.email import Email
from app.models.followup import FollowUp
from app.services.smtp_service import send_email
from app.services.graph_service import generate_email

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=300)
def send_followup(self, followup_id: str, followup_email_id: str = None):
    db = None
    followup = None
    try:
        db = get_session_local()()
        followup = db.query(FollowUp).filter(FollowUp.id == UUID(followup_id)).first()
        if not followup or followup.status != "pending":
            return

        original_email = db.query(Email).filter(Email.id == followup.email_id).first()
        if not original_email:
            followup.status = "failed"
            if followup_email_id:
                placeholder = db.query(Email).filter(Email.id == UUID(followup_email_id)).first()
                if placeholder:
                    placeholder.status = "failed"
            db.commit()
            return

        # Generate follow-up email
        result = generate_email(
            sender=original_email.sender,
            receiver=original_email.receiver,
            subject=f"Follow-up: {original_email.subject}",
            user_intent=f"Follow up on previous email about: {original_email.subject}. Original intent: {original_email.intent}",
        )

        # Send the follow-up
        message_id = send_email(
            sender=original_email.sender,
            receiver=original_email.receiver,
            subject=f"Follow-up: {original_email.subject}",
            body=result.formatted_email,
        )

        # Update the placeholder email or create a new record
        if followup_email_id:
            followup_email = db.query(Email).filter(Email.id == UUID(followup_email_id)).first()
            if followup_email:
                followup_email.body = result.formatted_email
                followup_email.tone = result.tone
                followup_email.status = "sent"
                followup_email.gmail_message_id = message_id
                followup_email.sent_at = datetime.now(timezone.utc)
        else:
            followup_email = Email(
                user_id=original_email.user_id,
                sender=original_email.sender,
                receiver=original_email.receiver,
                subject=f"Follow-up: {original_email.subject}",
                body=result.formatted_email,
                intent="follow_up",
                tone=result.tone,
                status="sent",
                gmail_message_id=message_id,
                sent_at=datetime.now(timezone.utc),
            )
            db.add(followup_email)

        followup.status = "sent"
        followup.executed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as exc:
        logger.error("send_followup failed for %s: %s", followup_id, exc)
        if db and followup:
            followup.retry_count = (followup.retry_count or 0) + 1
            if followup.retry_count >= 3:
                followup.status = "failed"
                if followup_email_id:
                    placeholder = db.query(Email).filter(Email.id == UUID(followup_email_id)).first()
                    if placeholder:
                        placeholder.status = "failed"
                db.commit()
                return
            db.commit()
        raise self.retry(exc=exc)
    finally:
        if db:
            db.close()
