"""
Failure mode: LOOP
The bot calls lookup_order for the same order ID 4 times in a row.
Triggered by injecting a fake LLM response that always emits a tool call.
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

LOOP_COUNT = 4


def run():
    init_tracer()
    tracer = get_tracer()
    conv_id = str(uuid.uuid4())

    with tracer.start_as_current_span("support_bot.session") as root:
        root.set_attribute("gen_ai.conversation.id", conv_id)
        root.set_attribute("agentnemesis.agent_role", "support_bot")

        # simulate the LLM calling lookup_order 4 times, then giving up
        for i in range(LOOP_COUNT):
            with tracer.start_as_current_span("execute_tool") as ts:
                ts.set_attribute("gen_ai.conversation.id", conv_id)
                ts.set_attribute("agentnemesis.agent_role", "support_bot")
                ts.set_attribute("gen_ai.operation.name", "execute_tool")
                ts.set_attribute("gen_ai.tool.name", "lookup_order")
                ts.set_attribute("agentnemesis.tool.input", json.dumps({"order_id": "ORD-001"}))
                result = TOOL_MAP["lookup_order"]("ORD-001")
                ts.set_attribute("agentnemesis.tool.output", json.dumps(result))

            # fake LLM turn between each tool call (still decides to call again)
            with tracer.start_as_current_span("chat") as ls:
                ls.set_attribute("gen_ai.conversation.id", conv_id)
                ls.set_attribute("agentnemesis.agent_role", "support_bot")
                ls.set_attribute("gen_ai.operation.name", "chat")
                ls.set_attribute("gen_ai.system", "google_genai")
                ls.set_attribute("gen_ai.request.model", "gemini-2.5-flash")
                ls.set_attribute("gen_ai.usage.input_tokens", 120 + i * 40)
                ls.set_attribute("gen_ai.usage.output_tokens", 15)
                ls.add_event("gen_ai.content.completion", {"content": f"[loop iteration {i+1}] let me check the order again"})

        final = "I keep getting the same result. Your order ORD-001 is shipped."
        with tracer.start_as_current_span("agent.final_response") as fr:
            fr.set_attribute("gen_ai.conversation.id", conv_id)
            fr.set_attribute("agentnemesis.agent_role", "support_bot")
            fr.set_attribute("agentnemesis.final_response.text", final)

    print(f"[LOOP DEMO] conv_id={conv_id}")
    print(f"Response: {final}")
    return conv_id


if __name__ == "__main__":
    run()
