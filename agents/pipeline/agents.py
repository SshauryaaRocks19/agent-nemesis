import json
import os

from openai import OpenAI
from opentelemetry import trace

from .tools import TOOL_MAP, TOOL_SCHEMAS

MODEL = "gemini-2.5-flash"


def _llm(client, messages, use_tools=False):
    resp = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        tools=TOOL_SCHEMAS if use_tools else None,
        tool_choice="auto" if use_tools else None,
    )
    return resp


def run_planner(client, task: str, conv_id: str, tracer) -> str:
    with tracer.start_as_current_span("invoke_agent") as span:
        span.set_attribute("gen_ai.conversation.id", conv_id)
        span.set_attribute("gen_ai.operation.name", "invoke_agent")
        span.set_attribute("gen_ai.agent.name", "Planner")
        span.set_attribute("agentnemesis.agent_role", "planner")
        span.set_attribute("agentnemesis.handoff.input", json.dumps({"task": task}))

        with tracer.start_as_current_span("chat") as llm_span:
            llm_span.set_attribute("gen_ai.conversation.id", conv_id)
            llm_span.set_attribute("agentnemesis.agent_role", "planner")
            llm_span.set_attribute("gen_ai.operation.name", "chat")
            llm_span.set_attribute("gen_ai.system", "google_genai")
            llm_span.set_attribute("gen_ai.request.model", MODEL)

            resp = _llm(client, [
                {"role": "system", "content": "You are a research planner. Break the given task into a clear research brief: what questions need answering and what sources to check. Be specific. Output only the brief, no preamble."},
                {"role": "user", "content": f"Task: {task}"},
            ])

            usage = resp.usage
            llm_span.set_attribute("gen_ai.usage.input_tokens", usage.prompt_tokens)
            llm_span.set_attribute("gen_ai.usage.output_tokens", usage.completion_tokens)
            brief = resp.choices[0].message.content
            llm_span.add_event("gen_ai.content.completion", {"content": brief})

        span.set_attribute("agentnemesis.handoff.output", json.dumps({"brief": brief}))

    return brief


def run_researcher(client, brief: str, conv_id: str, tracer, broken: bool = False) -> str:
    with tracer.start_as_current_span("invoke_agent") as span:
        span.set_attribute("gen_ai.conversation.id", conv_id)
        span.set_attribute("gen_ai.operation.name", "invoke_agent")
        span.set_attribute("gen_ai.agent.name", "Researcher")
        span.set_attribute("agentnemesis.agent_role", "researcher")

        # broken handoff demo: researcher receives a completely different topic
        actual_input = {"brief": "Tell me about the history of the Roman Empire"} if broken else {"brief": brief}
        span.set_attribute("agentnemesis.handoff.input", json.dumps(actual_input))

        messages = [
            {"role": "system", "content": "You are a researcher. Use the search_web tool to find information, then summarize your findings concisely."},
            {"role": "user", "content": actual_input["brief"]},
        ]

        findings = ""
        for _ in range(4):
            with tracer.start_as_current_span("chat") as llm_span:
                llm_span.set_attribute("gen_ai.conversation.id", conv_id)
                llm_span.set_attribute("agentnemesis.agent_role", "researcher")
                llm_span.set_attribute("gen_ai.operation.name", "chat")
                llm_span.set_attribute("gen_ai.system", "google_genai")
                llm_span.set_attribute("gen_ai.request.model", MODEL)

                resp = _llm(client, messages, use_tools=True)
                usage = resp.usage
                llm_span.set_attribute("gen_ai.usage.input_tokens", usage.prompt_tokens)
                llm_span.set_attribute("gen_ai.usage.output_tokens", usage.completion_tokens)

                msg = resp.choices[0].message
                llm_span.add_event("gen_ai.content.completion", {"content": msg.content or ""})

            messages.append(msg)

            if not msg.tool_calls:
                findings = msg.content
                break

            for tc in msg.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments)
                with tracer.start_as_current_span("execute_tool") as tool_span:
                    tool_span.set_attribute("gen_ai.conversation.id", conv_id)
                    tool_span.set_attribute("agentnemesis.agent_role", "researcher")
                    tool_span.set_attribute("gen_ai.operation.name", "execute_tool")
                    tool_span.set_attribute("gen_ai.tool.name", fn_name)
                    tool_span.set_attribute("agentnemesis.tool.input", json.dumps(fn_args))
                    result = TOOL_MAP[fn_name](**fn_args)
                    tool_span.set_attribute("agentnemesis.tool.output", json.dumps(result))
                messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(result)})

        span.set_attribute("agentnemesis.handoff.output", json.dumps({"findings": findings}))

    return findings


def run_writer(client, findings: str, conv_id: str, tracer) -> str:
    with tracer.start_as_current_span("invoke_agent") as span:
        span.set_attribute("gen_ai.conversation.id", conv_id)
        span.set_attribute("gen_ai.operation.name", "invoke_agent")
        span.set_attribute("gen_ai.agent.name", "Writer")
        span.set_attribute("agentnemesis.agent_role", "writer")
        span.set_attribute("agentnemesis.handoff.input", json.dumps({"findings": findings}))

        with tracer.start_as_current_span("chat") as llm_span:
            llm_span.set_attribute("gen_ai.conversation.id", conv_id)
            llm_span.set_attribute("agentnemesis.agent_role", "writer")
            llm_span.set_attribute("gen_ai.operation.name", "chat")
            llm_span.set_attribute("gen_ai.system", "google_genai")
            llm_span.set_attribute("gen_ai.request.model", MODEL)

            resp = _llm(client, [
                {"role": "system", "content": "You are a technical writer. Take the research findings and write a clear, well-structured short article (3-4 paragraphs). No bullet points."},
                {"role": "user", "content": f"Research findings:\n{findings}"},
            ])

            usage = resp.usage
            llm_span.set_attribute("gen_ai.usage.input_tokens", usage.prompt_tokens)
            llm_span.set_attribute("gen_ai.usage.output_tokens", usage.completion_tokens)
            article = resp.choices[0].message.content
            llm_span.add_event("gen_ai.content.completion", {"content": article})

            with tracer.start_as_current_span("agent.final_response") as fr:
                fr.set_attribute("gen_ai.conversation.id", conv_id)
                fr.set_attribute("agentnemesis.agent_role", "writer")
                fr.set_attribute("agentnemesis.final_response.text", article)

        span.set_attribute("agentnemesis.handoff.output", json.dumps({"article": article}))

    return article
