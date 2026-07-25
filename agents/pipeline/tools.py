import json

# basic search results — deterministic for demo purposes
SEARCH_RESULTS = {
    "default": [
        {"title": "AI Agent Observability 2024", "snippet": "Modern AI agents require trace-level observability to detect loops, hallucinations, and broken handoffs."},
        {"title": "OpenTelemetry GenAI Conventions", "snippet": "The gen_ai.* attribute namespace provides standardized span attributes for LLM calls and tool executions."},
    ],
    "signoz": [
        {"title": "SigNoz for AI Agents", "snippet": "SigNoz supports OTLP ingestion for traces, metrics, and logs — making it suitable for AI agent observability pipelines."},
    ],
}


def search_web(query: str) -> dict:
    q = query.lower()
    for key, results in SEARCH_RESULTS.items():
        if key in q:
            return {"query": query, "results": results}
    return {"query": query, "results": SEARCH_RESULTS["default"]}


TOOL_MAP = {"search_web": search_web}

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search for information on a topic",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    }
]
