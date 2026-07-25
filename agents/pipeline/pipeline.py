import json
import os
import uuid

from openai import OpenAI
from opentelemetry import trace

from agents.support_bot.telemetry import get_tracer
from .agents import run_planner, run_researcher, run_writer


import httpx

def make_client():
    return OpenAI(
        api_key=os.environ["GEMINI_API_KEY"],
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        http_client=httpx.Client(),
    )


def run_pipeline(task: str, conv_id: str = None, broken_handoff: bool = False) -> dict:
    if conv_id is None:
        conv_id = str(uuid.uuid4())

    tracer = get_tracer()
    client = make_client()

    with tracer.start_as_current_span("pipeline_run") as root:
        root.set_attribute("gen_ai.conversation.id", conv_id)
        root.set_attribute("agentnemesis.agent_role", "pipeline")

        brief = run_planner(client, task, conv_id, tracer)
        findings = run_researcher(client, brief, conv_id, tracer, broken=broken_handoff)
        article = run_writer(client, findings, conv_id, tracer)

    return {"conv_id": conv_id, "article": article}
