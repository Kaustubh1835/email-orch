import smtplib
from email.mime.text import MIMEText
from email.utils import make_msgid, formatdate
from app.config import get_settings


def send_email(sender: str, receiver: str, subject: str, body: str) -> str:
    """Send an email via SMTP. Returns a generated Message-ID."""
    settings = get_settings()

    msg = MIMEText(body)
    msg["From"] = sender
    msg["To"] = receiver
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)

    message_id = make_msgid()
    msg["Message-ID"] = message_id

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(sender, [receiver], msg.as_string())

    return message_id
