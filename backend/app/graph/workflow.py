from langgraph.graph import StateGraph, END
from app.graph.state import EmailState
from app.graph.nodes import classify_intent, determine_tone, generate_email, format_email

_compiled_graph = None


def build_email_graph() -> StateGraph:
    graph = StateGraph(EmailState)

    graph.add_node("classify_intent", classify_intent)
    graph.add_node("determine_tone", determine_tone)
    graph.add_node("generate_email", generate_email)
    graph.add_node("format_email", format_email)

    graph.set_entry_point("classify_intent")
    graph.add_edge("classify_intent", "determine_tone")
    graph.add_edge("determine_tone", "generate_email")
    graph.add_edge("generate_email", "format_email")
    graph.add_edge("format_email", END)

    return graph.compile()


def get_email_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_email_graph()
    return _compiled_graph
