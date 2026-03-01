import logging
import smtplib
from email.mime.text import MIMEText
from email.utils import make_msgid, formatdate
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)


def _send_via_resend(sender: str, receiver: str, subject: str, body: str, settings) -> str:
    """Send email using Resend HTTP API."""
    message_id = make_msgid()
    logger.info("Sending email via Resend from %s to %s", sender, receiver)

    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": f"{sender} <onboarding@resend.dev>",
            "to": [receiver],
            "subject": subject,
            "text": body,
            "reply_to": sender,
        },
        timeout=30,
    )

    if response.status_code not in (200, 201):
        error_detail = response.text
        logger.error("Resend API error (%s): %s", response.status_code, error_detail)
        raise ValueError(f"Failed to send email via Resend: {error_detail}")

    data = response.json()
    resend_id = data.get("id", "")
    logger.info("Email sent via Resend, id=%s, message_id=%s", resend_id, message_id)
    return message_id


def _send_via_smtp(sender: str, receiver: str, subject: str, body: str, settings) -> str:
    """Send email using SMTP."""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise ValueError("SMTP credentials not configured")

    msg = MIMEText(body)
    msg["From"] = f"{sender} <{settings.SMTP_USERNAME}>"
    msg["Reply-To"] = sender
    msg["To"] = receiver
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)

    message_id = make_msgid()
    msg["Message-ID"] = message_id

    port = settings.SMTP_PORT
    logger.info("Sending email via SMTP from %s to %s via %s:%s",
                sender, receiver, settings.SMTP_HOST, port)

    try:
        if port == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, port, timeout=30) as server:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USERNAME, [receiver], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, port, timeout=30) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USERNAME, [receiver], msg.as_string())
    except smtplib.SMTPAuthenticationError as e:
        logger.error("SMTP auth failed: %s", e)
        raise ValueError("SMTP authentication failed. Check SMTP_USERNAME and SMTP_PASSWORD.") from e
    except (smtplib.SMTPException, OSError) as e:
        logger.error("SMTP error: %s", e)
        raise ValueError(f"Failed to send email: {e}") from e

    logger.info("Email sent via SMTP, message_id=%s", message_id)
    return message_id


def send_email(sender: str, receiver: str, subject: str, body: str) -> str:
    """Send an email. Uses Resend API if configured, otherwise falls back to SMTP."""
    settings = get_settings()

    if settings.RESEND_API_KEY:
        return _send_via_resend(sender, receiver, subject, body, settings)
    else:
        return _send_via_smtp(sender, receiver, subject, body, settings)
