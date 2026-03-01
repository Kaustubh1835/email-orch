import logging
import smtplib
from email.mime.text import MIMEText
from email.utils import make_msgid, formatdate
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)


def _send_via_brevo(sender: str, receiver: str, subject: str, body: str, settings) -> str:
    """Send email using Brevo (Sendinblue) HTTP API."""
    message_id = make_msgid()
    logger.info("Sending email via Brevo from %s to %s", sender, receiver)

    response = httpx.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "api-key": settings.BREVO_API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "sender": {"name": sender, "email": settings.SMTP_USERNAME},
            "to": [{"email": receiver}],
            "subject": subject,
            "textContent": body,
            "replyTo": {"email": settings.SMTP_USERNAME, "name": sender},
        },
        timeout=30,
    )

    if response.status_code not in (200, 201):
        error_detail = response.text
        logger.error("Brevo API error (%s): %s", response.status_code, error_detail)
        raise ValueError(f"Failed to send email via Brevo: {error_detail}")

    data = response.json()
    brevo_id = data.get("messageId", "")
    logger.info("Email sent via Brevo, id=%s, message_id=%s", brevo_id, message_id)
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
    """Send an email. Uses Brevo API if configured, otherwise falls back to SMTP."""
    settings = get_settings()

    if settings.BREVO_API_KEY:
        return _send_via_brevo(sender, receiver, subject, body, settings)
    else:
        return _send_via_smtp(sender, receiver, subject, body, settings)
