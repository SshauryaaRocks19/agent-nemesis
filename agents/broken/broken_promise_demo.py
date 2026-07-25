"""
Failure mode: BROKEN PROMISE
The bot says "I've processed your refund" in its final response
but process_refund was never called during the conversation.
Only lookup_order ran.
"""
import json
import os
import sys
import uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env.local"))

from agents.support_bot.telemetry import init_tracer, get_tracer
from agents.support_bot.tools import TOOL_MAP

# bot looked up the order but forgot (or decided not) to actually call process_refund
PROMISE_RESPONSE = (
    "I've gone ahead and processed your refund of $34.50 for order ORD-002. "
    "It'll appear in your account within 5 business days!"
)


def run():
    init_tracer()
    tracer = get_tracer()
    conv_id = str(uuid.uuid4())

    with tracer.start_as_current_span("support_bot.session") as root:
        root.set_attribute("gen_ai.conversation.id", conv_id)
        root.set_attribute("agentnemesis.agent_role", "support_bot")

        # only lookup_order is called — process_refund is never executed
        with tracer.start_as_current_span("execute_tool") as ts:
            ts.set_attribute("gen_ai.conversation.id", conv_id)
            ts.set_attribute("agentnemesis.agent_role", "support_bot")
            ts.set_attribute("gen_ai.operation.name", "execute_tool")
            ts.set_attribute("gen_ai.tool.name", "lookup_order")
            ts.set_attribute("agentnemesis.tool.input", json.dumps({"order_id": "ORD-002"}))
            result = TOOL_MAP["lookup_order"]("ORD-002")
            ts.set_attribute("agentnemesis.tool.output", json.dumps(result))

        with tracer.start_as_current_span("chat") as ls:
            ls.set_attribute("gen_ai.conversation.id", conv_id)
            ls.set_attribute("agentnemesis.agent_role", "support_bot")
            ls.set_attribute("gen_ai.operation.name", "chat")
            ls.set_attribute("gen_ai.system", "google_genai")
            ls.set_attribute("gen_ai.request.model", "gemini-2.5-flash")
            ls.set_attribute("gen_ai.usage.input_tokens", 180)
            ls.set_attribute("gen_ai.usage.output_tokens", 52)
            ls.add_event("gen_ai.content.completion", {"content": PROMISE_RESPONSE})

        with tracer.start_as_current_span("agent.final_response") as fr:
            fr.set_attribute("gen_ai.conversation.id", conv_id)
            fr.set_attribute("agentnemesis.agent_role", "support_bot")
            fr.set_attribute("agentnemesis.final_response.text", PROMISE_RESPONSE)

    print(f"[BROKEN PROMISE DEMO] conv_id={conv_id}")
    print(f"Response: {PROMISE_RESPONSE}")
    return conv_id


if __name__ == "__main__":
    run()
