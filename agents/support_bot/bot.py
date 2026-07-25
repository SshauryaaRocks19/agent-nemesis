import json
import os
import uuid

from openai import OpenAI
from opentelemetry import trace, context, baggage

from .telemetry import get_tracer
from .tools import TOOL_MAP, TOOL_SCHEMAS

MODEL = "gemini-2.5-flash"
MAX_TURNS = 8

SYSTEM_PROMPT = """You are a helpful customer support agent for an online store.
You have access to tools to look up orders, process refunds, and search our knowledge base.
Always look up information before stating facts. Be concise."""


def make_client():
    return OpenAI(
        api_key=os.environ["GEMINI_API_KEY"],
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )


def run_conversation(user_msg: str, conv_id: str = None, force_skip_tools: bool = False):
    if conv_id is None:
        conv_id = str(uuid.uuid4())

    tracer = get_tracer()
    client = make_client()
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_msg},
    ]

    final_response = None

    with tracer.start_as_current_span("support_bot.session") as root:
        root.set_attribute("gen_ai.conversation.id", conv_id)
        root.set_attribute("agentnemesis.agent_role", "support_bot")

        for turn in range(MAX_TURNS):
            tools_arg = [] if force_skip_tools else TOOL_SCHEMAS

            with tracer.start_as_current_span("chat") as llm_span:
                llm_span.set_attribute("gen_ai.conversation.id", conv_id)
                llm_span.set_attribute("agentnemesis.agent_role", "support_bot")
                llm_span.set_attribute("gen_ai.operation.name", "chat")
                llm_span.set_attribute("gen_ai.system", "google_genai")
                llm_span.set_attribute("gen_ai.request.model", MODEL)

                resp = client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    tools=tools_arg if tools_arg else None,
                    tool_choice="auto" if tools_arg else None,
                )

                usage = resp.usage
                llm_span.set_attribute("gen_ai.usage.input_tokens", usage.prompt_tokens)
                llm_span.set_attribute("gen_ai.usage.output_tokens", usage.completion_tokens)

                msg = resp.choices[0].message
                completion_text = msg.content or ""
                llm_span.add_event("gen_ai.content.completion", {"content": completion_text})

            messages.append(msg)

            if not msg.tool_calls:
                final_response = completion_text
                break

            for tc in msg.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments)

                with tracer.start_as_current_span("execute_tool") as tool_span:
                    tool_span.set_attribute("gen_ai.conversation.id", conv_id)
                    tool_span.set_attribute("agentnemesis.agent_role", "support_bot")
                    tool_span.set_attribute("gen_ai.operation.name", "execute_tool")
                    tool_span.set_attribute("gen_ai.tool.name", fn_name)
                    tool_span.set_attribute("agentnemesis.tool.input", json.dumps(fn_args))

                    result = TOOL_MAP[fn_name](**fn_args)
                    tool_span.set_attribute("agentnemesis.tool.output", json.dumps(result))

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result),
                })

        if final_response is None:
            final_response = "I wasn't able to fully resolve your request."

        with tracer.start_as_current_span("agent.final_response") as fr_span:
            fr_span.set_attribute("gen_ai.conversation.id", conv_id)
            fr_span.set_attribute("agentnemesis.agent_role", "support_bot")
            fr_span.set_attribute("agentnemesis.final_response.text", final_response)

    return {"conv_id": conv_id, "response": final_response}
