"""
Failure mode: BROKEN HANDOFF
Planner produces a brief about AI agent observability.
Researcher receives a completely different topic (Roman Empire history).
Writer gets that mismatched research and produces an irrelevant article.
The handoff.output of Planner won't match handoff.input of Researcher.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env.local"))

from agents.support_bot.telemetry import init_tracer
from agents.pipeline.pipeline import run_pipeline


def run():
    init_tracer()
    result = run_pipeline(
        task="Write an article about OpenTelemetry best practices for AI agents",
        broken_handoff=True,
    )
    print(f"[BROKEN HANDOFF DEMO] conv_id={result['conv_id']}")
    print(f"\nArticle (will be about wrong topic):\n{result['article'][:300]}...")
    return result["conv_id"]


if __name__ == "__main__":
    run()
