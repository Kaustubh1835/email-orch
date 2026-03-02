import json
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db, get_session_local
from app.models.user import User
from app.models.email import Email
from app.schemas.email import (
    GenerateEmailRequest,
    GenerateEmailResponse,
    SendEmailRequest,
    SendEmailResponse,
    EmailDetail,
    EmailListResponse,
    EmailSummary,
)
from app.utils.auth import get_current_user
from app.utils.billing import require_generate_quota, require_send_quota
from app.utils.rate_limit import limiter
from app.services.graph_service import generate_email as generate_email_service
from app.services.graph_service import generate_email_stream as stream_service
from app.services.smtp_service import send_email as smtp_send

router = APIRouter(prefix="/emails", tags=["Emails"])


@router.post("/generate", response_model=GenerateEmailResponse)
def generate_email(
    data: GenerateEmailRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_generate_quota),
):
    result = generate_email_service(
        sender=data.sender,
        receiver=data.receiver,
        subject=data.subject,
        user_intent=data.user_intent,
        salutation=data.salutation,
    )

    email = Email(
        user_id=user.id,
        sender=data.sender,
        receiver=data.receiver,
        subject=data.subject,
        body=result.formatted_email,
        intent=result.intent,
        tone=result.tone,
        status="draft",
    )
    db.add(email)
    db.commit()
    db.refresh(email)

    user.emails_generated += 1
    db.commit()

    return GenerateEmailResponse(
        email_id=email.id,
        formatted_email=email.body,
        intent=email.intent,
        tone=email.tone,
        status=email.status,
    )


@router.post("/generate-stream")
def generate_email_stream(
    data: GenerateEmailRequest,
    user: User = Depends(require_generate_quota),
):
    def event_generator():
        try:
            complete_data = None
            for event in stream_service(
                sender=data.sender,
                receiver=data.receiver,
                subject=data.subject,
                user_intent=data.user_intent,
                salutation=data.salutation,
            ):
                if event["event"] == "step":
                    yield f"event: step\ndata: {json.dumps(event)}\n\n"
                elif event["event"] == "complete":
                    complete_data = event
                elif event["event"] == "error":
                    yield f"event: error\ndata: {json.dumps(event)}\n\n"
                    return

            if complete_data:
                db = get_session_local()()
                try:
                    email = Email(
                        user_id=user.id,
                        sender=data.sender,
                        receiver=data.receiver,
                        subject=data.subject,
                        body=complete_data["formatted_email"],
                        intent=complete_data["classified_intent"],
                        tone=complete_data["determined_tone"],
                        status="draft",
                    )
                    db.add(email)
                    db.commit()
                    db.refresh(email)

                    db_user = db.query(User).filter(User.id == user.id).first()
                    if db_user:
                        db_user.emails_generated += 1
                        db.commit()

                    result = {
                        "event": "complete",
                        "email_id": str(email.id),
                        "formatted_email": email.body,
                        "intent": email.intent,
                        "tone": email.tone,
                        "status": email.status,
                    }
                    yield f"event: complete\ndata: {json.dumps(result)}\n\n"
                finally:
                    db.close()

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/send", response_model=SendEmailResponse)
@limiter.limit("10/minute")
def send_email(
    request: Request,
    data: SendEmailRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_send_quota),
):
    email = db.query(Email).filter(Email.id == data.email_id, Email.user_id == user.id).first()
    if not email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    if email.status == "sent":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already sent")

    try:
        message_id = smtp_send(
            sender=email.sender,
            receiver=email.receiver,
            subject=email.subject,
            body=email.body,
        )
        from datetime import datetime, timezone

        email.status = "sent"
        email.gmail_message_id = message_id
        email.sent_at = datetime.now(timezone.utc)
        user.emails_sent += 1
        db.commit()
        db.refresh(email)

        return SendEmailResponse(success=True, gmail_message_id=message_id, sent_at=email.sent_at)
    except Exception as e:
        email.status = "failed"
        email.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=EmailListResponse)
def list_emails(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Email).filter(Email.user_id == user.id)
    if status_filter:
        query = query.filter(Email.status == status_filter)

    total = query.count()
    emails = query.order_by(Email.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return EmailListResponse(
        emails=[EmailSummary.model_validate(e) for e in emails],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{email_id}", response_model=EmailDetail)
def get_email(
    email_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    email = db.query(Email).filter(Email.id == email_id, Email.user_id == user.id).first()
    if not email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    return EmailDetail.model_validate(email)
