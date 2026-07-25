# OpenTelemetry Telemetry Contract — AgentNemesis

> **STATUS: DRAFT — Requires explicit sign-off from both Person A and Person B before either side writes instrumentation or analysis code.**
>
> This is the most critical sync document in the project. A mismatch between what Person A emits and what Person B reads will cause silent analysis failures — the Checker will miss real bugs without any error.

> Confidence levels: HIGH = verified via live opentelemetry.io docs | MEDIUM = confirmed via community sources | LOW = proposed (needs team agreement)

---

## Background: Official OTEL GenAI Conventions (as of mid-2026)

The `gen_ai.*` attribute namespace has moved from the main OTel spec repo to `open-telemetry/semantic-conventions-genai`. All attributes remain in **Development** status — widely adopted but not yet Stable. [HIGH]

### Standard Operation Names (verified)

| `gen_ai.operation.name` | Meaning |
|---|---|
| `chat` | A single LLM inference/completion call |
| `invoke_agent` | Invoking a named agent (used as the parent span for an agent turn) |
| `execute_tool` | Executing a tool/function call |
| `create_agent` | Instantiating a new agent |

### Standard Span Attributes (verified via opentelemetry.io)

| Attribute | Type | Applies To | Meaning |
|---|---|---|---|
| `gen_ai.operation.name` | string | all | The operation type (see above) |
| `gen_ai.system` | string | LLM calls | Provider: `openai`, `anthropic`, `google_genai`, etc. |
| `gen_ai.request.model` | string | LLM calls | The model requested (e.g., `gpt-4o`) |
| `gen_ai.response.model` | string | LLM calls | The model that actually responded |
| `gen_ai.usage.input_tokens` | int | LLM calls | Prompt token count (for cost tracking) |
| `gen_ai.usage.output_tokens` | int | LLM calls | Completion token count (for cost tracking) |
| `gen_ai.agent.name` | string | invoke_agent | Human-readable agent name |
| `gen_ai.conversation.id` | string | all | **Session grouping key** — must be on EVERY span |
| `gen_ai.tool.name` | string | execute_tool | The name of the tool being called |

### Content Capture via Span Events (recommended practice)

As of 2026, the convention is to emit prompts and completions as **span events**, not attributes, for privacy control and to avoid attribute size limits. [HIGH]

```
Event name: "gen_ai.content.prompt"    → body contains the prompt text
Event name: "gen_ai.content.completion" → body contains the response text
Event name: "gen_ai.tool.message"      → body contains tool input/output JSON
```

---

## AgentNemesis Custom Contract

The following attributes extend the OTEL standard with project-specific conventions needed by the Checker. Items marked ⚠️ **NEED SIGN-OFF** require explicit agreement from both Person A and Person B.

### Section 1: Session / Conversation Identity

Every span emitted by both the support bot AND the multi-agent pipeline MUST carry:

| Attribute | Type | Value | Notes |
|---|---|---|---|
| `gen_ai.conversation.id` | string | UUID per conversation/session | OTEL standard. The Checker groups all spans by this key. If absent, the Checker cannot analyze the conversation. |
| `agentnemesis.agent_role` | string | `support_bot` or `planner` or `researcher` or `writer` | ⚠️ **CUSTOM — NEEDS SIGN-OFF.** Identifies which named component emitted the span. Critical for handoff analysis. |
| `service.name` | string | Agreed constant, e.g., `agent-nemesis-demo` | Standard OTEL resource attribute. Allows SigNoz to filter all project spans. |

### Section 2: LLM Call Spans

Span name: `chat` | `gen_ai.operation.name`: `chat`

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `gen_ai.conversation.id` | string | YES | Links to session |
| `gen_ai.system` | string | YES | `openai` / `anthropic` |
| `gen_ai.request.model` | string | YES | |
| `gen_ai.usage.input_tokens` | int | YES | For cost calc |
| `gen_ai.usage.output_tokens` | int | YES | For cost calc |
| `agentnemesis.agent_role` | string | YES | ⚠️ CUSTOM |

**Span Events on LLM Call Spans:**
- `gen_ai.content.prompt` — the full prompt text sent
- `gen_ai.content.completion` — the full response text received

> ⚠️ **CHECKER DEPENDENCY:** The Checker reads the completion text to detect unverified claims and broken promises. If this event is absent or the body is empty, those checks cannot run.

### Section 3: Tool Execution Spans

Span name: `execute_tool` | `gen_ai.operation.name`: `execute_tool`

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `gen_ai.conversation.id` | string | YES | Links to session |
| `gen_ai.tool.name` | string | YES | e.g., `lookup_order`, `process_refund`, `search_kb` |
| `agentnemesis.tool.input` | string (JSON) | YES | ⚠️ **CUSTOM.** Serialized tool call arguments |
| `agentnemesis.tool.output` | string (JSON) | YES | ⚠️ **CUSTOM.** Serialized tool result |
| `agentnemesis.agent_role` | string | YES | ⚠️ CUSTOM |

> ⚠️ **CHECKER DEPENDENCY:** The Checker reads `gen_ai.tool.name` to detect loops (same tool called N times in a row). It reads `agentnemesis.tool.input/output` to verify that claimed facts in the LLM completion are grounded in an actual tool result.

### Section 4: Final Response Spans (Support Bot)

⚠️ **CUSTOM — NEEDS SIGN-OFF on exact implementation.**

The support bot's final message to the user must be explicitly tagged so the Checker can cross-reference it against the tool call history.

**Proposed:** A dedicated span (or a span event on the final LLM call) that marks a turn as "this is the response delivered to the user."

Option A — Dedicated span:
```
span name: "agent.final_response"
attributes:
  gen_ai.conversation.id: <id>
  agentnemesis.agent_role: "support_bot"
  agentnemesis.final_response.text: <text>   # ⚠️ CUSTOM
```

Option B — Attribute flag on the last `chat` span:
```
  agentnemesis.is_final_response: true        # ⚠️ CUSTOM
```

> **Recommended: Option A** — cleaner to query from SigNoz; no ambiguity about which `chat` span is final.

### Section 5: Multi-Agent Handoff Spans (Pipeline)

⚠️ **CUSTOM — NEEDS SIGN-OFF.**

To detect broken handoffs, the Checker needs to know what each agent in the planner → researcher → writer pipeline received as input and produced as output, independently of the LLM content.

**Proposed:** Each agent's `invoke_agent` span includes:

| Attribute | Type | Notes |
|---|---|---|
| `gen_ai.conversation.id` | string | Session link |
| `gen_ai.agent.name` | string | OTEL standard: `Planner`, `Researcher`, `Writer` |
| `agentnemesis.agent_role` | string | `planner` / `researcher` / `writer` ⚠️ CUSTOM |
| `agentnemesis.handoff.input` | string (JSON) | What this agent received from the upstream agent ⚠️ CUSTOM |
| `agentnemesis.handoff.output` | string (JSON) | What this agent passed to the downstream agent ⚠️ CUSTOM |

**Span hierarchy for the pipeline (proposed):**
```
[Trace]  pipeline_run  (gen_ai.conversation.id = "xyz")
  ├── invoke_agent  (gen_ai.agent.name = "Planner")
  │   └── chat      (LLM call)
  ├── invoke_agent  (gen_ai.agent.name = "Researcher")
  │   ├── chat
  │   └── execute_tool  (gen_ai.tool.name = "search_web")
  └── invoke_agent  (gen_ai.agent.name = "Writer")
      └── chat
          └── agent.final_response
```

---

## What Happens If This Contract Is Broken

| Missing attribute | Checker behavior |
|---|---|
| `gen_ai.conversation.id` absent | Conversation cannot be grouped → skipped entirely |
| `gen_ai.tool.name` absent on tool span | Loop detection fails silently |
| `gen_ai.content.completion` event absent | Unverified claims & broken promise checks cannot run |
| `agentnemesis.handoff.input/output` absent | Handoff analysis returns "no data" (not "pass") |
| `agentnemesis.is_final_response` / final_response span absent | Broken promise check cannot compare claimed vs actual actions |

---

## Sign-Off Checklist

- [ ] Person A agrees to emit `gen_ai.conversation.id` on every span
- [ ] Person A agrees to use `agentnemesis.agent_role` custom attribute
- [ ] Person A agrees to emit `gen_ai.content.completion` as a span event
- [ ] Person A agrees to the final response tagging strategy (Option A or B)
- [ ] Person A agrees to `agentnemesis.tool.input` and `agentnemesis.tool.output` on tool spans
- [ ] Person A agrees to the handoff attribute schema for the pipeline
- [ ] Person A agrees on the `service.name` constant for SigNoz filtering
- [ ] Person B has verified the Checker can query all required attributes from SigNoz API

**Neither side should write analysis logic or instrumentation code until all boxes above are checked.**

---
*Last updated: 2026-07-25 | Sources: opentelemetry.io (HIGH), community verification (MEDIUM)*
