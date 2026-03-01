from typing import Literal
from pydantic import BaseModel
from openai import OpenAI
from app.config import get_settings
from app.graph.state import EmailState


class IntentClassification(BaseModel):
    intent: Literal[
        "formal_request",
        "follow_up",
        "inquiry",
        "introduction",
        "thank_you",
        "complaint",
    ]
    confidence: float


INTENT_TO_TONE: dict[str, str] = {
    "formal_request": "professional",
    "follow_up": "semi_formal",
    "inquiry": "semi_formal",
    "introduction": "warm_professional",
    "thank_you": "friendly",
    "complaint": "empathetic_professional",
}

TONE_GREETINGS: dict[str, str] = {
    "professional": "Dear",
    "semi_formal": "Hello",
    "warm_professional": "Hi",
    "friendly": "Hey",
    "empathetic_professional": "Dear",
}

TONE_CLOSINGS: dict[str, str] = {
    "professional": "Best regards",
    "semi_formal": "Kind regards",
    "warm_professional": "Warm regards",
    "friendly": "Cheers",
    "empathetic_professional": "Sincerely",
}


def _get_client() -> OpenAI:
    return OpenAI(api_key=get_settings().OPENAI_API_KEY)


def classify_intent(state: EmailState) -> dict:
    client = _get_client()

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        response_format=IntentClassification,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an email classification expert. Classify the user's email intent "
                    "into exactly one of: formal_request, follow_up, inquiry, introduction, "
                    "thank_you, complaint. Also provide a confidence score between 0 and 1."
                ),
            },
            {
                "role": "user",
                "content": f"Subject: {state['subject']}\nIntent: {state['user_intent']}",
            },
        ],
    )

    parsed = response.choices[0].message.parsed
    return {"classified_intent": parsed.intent}


def determine_tone(state: EmailState) -> dict:
    intent = state.get("classified_intent", "formal_request")
    tone = INTENT_TO_TONE.get(intent, "professional")
    return {"determined_tone": tone}


def generate_email(state: EmailState) -> dict:
    client = _get_client()
    tone = state.get("determined_tone", "professional")
    intent = state.get("classified_intent", "formal_request")

    system_prompt = f"""You are a professional email writer. Write a {tone.replace('_', ' ')} email.

Context:
- From: {state['sender']}
- To: {state['receiver']}
- Subject: {state['subject']}
- Intent type: {intent.replace('_', ' ')}
- User's description: {state['user_intent']}

Write exactly 3-4 paragraphs for the email body. Do NOT include any greeting (e.g., "Dear..."), 
closing (e.g., "Best regards"), or signature. Write ONLY the body paragraphs.
Each paragraph should be separated by a blank line."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Write the email body for: {state['user_intent']}"},
        ],
        temperature=0.7,
        max_tokens=1000,
    )

    body = response.choices[0].message.content.strip()
    return {"generated_body": body}


def format_email(state: EmailState) -> dict:
    tone = state.get("determined_tone", "professional")
    body = state.get("generated_body", "")
    receiver = state["receiver"]
    sender = state["sender"]
    salutation = state.get("salutation")

    # Extract names from email (part before @)
    sender_name = sender.split("@")[0].replace(".", " ").replace("_", " ").title()

    greeting_word = TONE_GREETINGS.get(tone, "Dear")
    closing_word = TONE_CLOSINGS.get(tone, "Best regards")

    # Use user-provided salutation or auto-detect from receiver email
    if salutation:
        greeting_line = f"{greeting_word} {salutation}"
    else:
        receiver_name = receiver.split("@")[0].replace(".", " ").replace("_", " ").title()
        greeting_line = f"{greeting_word} {receiver_name}"

    formatted = f"{greeting_line},\n\n{body}\n\n{closing_word},\n{sender_name}"
    return {"formatted_email": formatted}
