import time
from typing import Generator

from app.graph.state import EmailState
from app.graph.workflow import get_email_graph


class EmailGenerationResult:
    def __init__(self, formatted_email: str, intent: str, tone: str):
        self.formatted_email = formatted_email
        self.intent = intent
        self.tone = tone


def generate_email(sender: str, receiver: str, subject: str, user_intent: str, salutation: str | None = None) -> EmailGenerationResult:
    graph = get_email_graph()

    initial_state: EmailState = {
        "sender": sender,
        "receiver": receiver,
        "subject": subject,
        "user_intent": user_intent,
        "salutation": salutation,
        "classified_intent": None,
        "determined_tone": None,
        "generated_body": None,
        "formatted_email": None,
        "error": None,
    }

    final_state = graph.invoke(initial_state)

    if final_state.get("error"):
        raise RuntimeError(f"Email generation failed: {final_state['error']}")

    return EmailGenerationResult(
        formatted_email=final_state["formatted_email"],
        intent=final_state["classified_intent"],
        tone=final_state["determined_tone"],
    )


def generate_email_stream(
    sender: str, receiver: str, subject: str, user_intent: str, salutation: str | None = None
) -> Generator[dict, None, None]:
    """Stream email generation progress. Yields event dicts after each LangGraph node."""
    graph = get_email_graph()

    initial_state: EmailState = {
        "sender": sender,
        "receiver": receiver,
        "subject": subject,
        "user_intent": user_intent,
        "salutation": salutation,
        "classified_intent": None,
        "determined_tone": None,
        "generated_body": None,
        "formatted_email": None,
        "error": None,
    }

    final_state = dict(initial_state)

    for chunk in graph.stream(initial_state):
        node_name = list(chunk.keys())[0]
        node_output = chunk[node_name]
        final_state.update(node_output)

        exposed_data = {}
        if node_name == "classify_intent":
            exposed_data = {"classified_intent": node_output.get("classified_intent")}
        elif node_name == "determine_tone":
            exposed_data = {"determined_tone": node_output.get("determined_tone")}

        yield {
            "event": "step",
            "step": node_name,
            "status": "completed",
            "data": exposed_data,
        }

        # Small delay so fast steps are visible on frontend
        time.sleep(0.3)

    if final_state.get("error"):
        yield {"event": "error", "message": f"Email generation failed: {final_state['error']}"}
        return

    yield {
        "event": "complete",
        "formatted_email": final_state["formatted_email"],
        "classified_intent": final_state["classified_intent"],
        "determined_tone": final_state["determined_tone"],
    }
