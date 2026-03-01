import logging
import smtplib
from email.mime.text import MIMEText
from email.utils import make_msgid, formatdate
from app.config import get_settings

logger = logging.getLogger(__name__)


def send_email(sender: str, receiver: str, subject: str, body: str) -> str:
    """Send an email via SMTP. Returns a generated Message-ID."""
    settings = get_settings()

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
    logger.info("Sending email from %s to %s via %s:%s",
                sender, receiver, settings.SMTP_HOST, port)

    try:
        # Port 465 uses SSL directly; port 587 uses STARTTLS
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

    logger.info("Email sent successfully, message_id=%s", message_id)
    return message_id
