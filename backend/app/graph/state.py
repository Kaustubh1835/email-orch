from typing_extensions import TypedDict


class EmailState(TypedDict):
    sender: str
    receiver: str
    subject: str
    user_intent: str
    salutation: str | None
    classified_intent: str | None
    determined_tone: str | None
    generated_body: str | None
    formatted_email: str | None
    error: str | None
