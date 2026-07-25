# Onboarding Prompt for Person A — AgentNemesis

> **Instructions for Person A:** Copy everything below this line and paste it as your first message to your AI coding assistant (Antigravity). Send this along with the `.planning/` folder files you've been given.

---

## Paste below this line into your AI assistant:

---

I'm Person A on a two-person hackathon project called **AgentNemesis**. My teammate (Person B) has already set up our shared planning system and written all the context docs. I need you to get up to speed on the project and help me build my half of it.

Here's everything you need to know, in order.

---

## Step 1 — Install GSD (Our Workflow System)

First, set up GSD (Get Shit Done for Antigravity) locally. This is the workflow system Person B is already using. It lives in `.agent/` and is invisible to GitHub (handled via `.git/info/exclude`, not `.gitignore`).

Run these commands in the project root:

```bash
npm init -y
npm install get-shit-done-antigravity
npx get-shit-done-antigravity -l
```

Then add these lines to `.git/info/exclude` (NOT to `.gitignore` — this keeps it hidden from GitHub):

```
.agent/
node_modules/
package.json
package-lock.json
```

After this, GSD is installed locally and you'll have access to `/gsd-help`, `/gsd-plan`, `/gsd-execute`, etc. as slash commands in this assistant. Do NOT commit `package.json`, `node_modules/`, or `.agent/` to git.

---

## Step 2 — Understand the Project

**AgentNemesis** is a trust-auditing dashboard for AI agents, built for the SigNoz "Agents of SigNoz" hackathon (Track 01: AI & Agent Observability).

The system catches four specific AI agent failure modes by reading real OpenTelemetry traces from SigNoz Cloud:

1. **Loops** — agent calls the same tool repeatedly without progress
2. **Unverified claims** — agent states facts it never actually looked up via a tool
3. **Broken promises** — agent claims to have taken an action it never executed
4. **Broken handoffs** — in a multi-agent pipeline, one agent's output doesn't match what the next agent actually used

The system has three parts:
- **Demo Agents** ← **YOUR HALF** (Person A)
- **Checker** ← Person B's half
- **Dashboard** ← Person B's half

---

## Step 3 — Read the Planning Docs

You have been given the following files from the `.planning/` folder. Read them all before writing any code:

| File | Why you need it |
|------|----------------|
| `PROJECT.md` | Full project vision and team structure |
| `REQUIREMENTS.md` | All requirements — yours are R05–R15 |
| `ROADMAP.md` | The 5-phase plan and parallel track structure |
| `STATE.md` | Current project state and immediate next steps |
| `research/SUMMARY.md` | Fast-read overview of all research |
| `research/STACK.md` | Verified tech stack for your subsystem (Python, OTEL, SigNoz) |
| `research/TELEMETRY_CONTRACT.md` | **THE MOST IMPORTANT DOC — read this carefully** |
| `research/ARCHITECTURE.md` | Full system architecture and how your output feeds Person B |
| `research/PITFALLS.md` | Failure modes to avoid, including ones specific to your subsystem |

---

## Step 4 — Your Specific Role

**You are Person A. You own everything in Phase 1 of the roadmap.**

### What you're building:

**1. Support Bot** — a Python AI agent with three tools:
- `lookup_order(order_id)` → returns order status/details
- `process_refund(order_id, amount)` → processes a refund
- `search_kb(query)` → searches a knowledge base and returns relevant content

The bot takes a user query, reasons about it, calls tools as needed, and produces a final response. It should be a simple custom agent loop (NOT LangChain or another framework) so instrumentation stays explicit and deterministic.

**2. Multi-Agent Pipeline** — three agents in sequence:
- **Planner** — receives a task and breaks it into a research brief
- **Researcher** — takes the brief, performs searches/lookups, produces findings
- **Writer** — takes the findings and produces a final written output

**3. OpenTelemetry Instrumentation** — both agents are fully instrumented per the telemetry contract (see Step 5).

**4. Deliberately Broken Test Conversations** — scripted conversations that intentionally trigger each of the four failure modes, for the demo's "Proof" page.

---

## Step 5 — The Telemetry Contract (BLOCKING — Do Not Skip)

This is the most critical sync point between you and Person B. **Do not write instrumentation code until you have read `research/TELEMETRY_CONTRACT.md` in full and confirmed every item in the sign-off checklist.**

Here is a summary of what EVERY span you emit must carry:

### Required on every span (without exception)

```python
span.set_attribute("gen_ai.conversation.id", conversation_id)  # UUID per session
span.set_attribute("agentnemesis.agent_role", "support_bot")   # or "planner" / "researcher" / "writer"
```

### LLM call spans (`gen_ai.operation.name = "chat"`)

```python
span.set_attribute("gen_ai.operation.name", "chat")
span.set_attribute("gen_ai.system", "openai")              # or "anthropic" etc.
span.set_attribute("gen_ai.request.model", "gpt-4o")
span.set_attribute("gen_ai.usage.input_tokens", N)
span.set_attribute("gen_ai.usage.output_tokens", N)

# Emit the response as a span EVENT (not an attribute):
span.add_event("gen_ai.content.completion", {"content": response_text})
```

> ⚠️ Person B's "Unverified Claims" and "Broken Promise" checks READ the `gen_ai.content.completion` event body. If this event is absent, those checks cannot run.

### Tool execution spans (`gen_ai.operation.name = "execute_tool"`)

```python
span.set_attribute("gen_ai.operation.name", "execute_tool")
span.set_attribute("gen_ai.tool.name", "lookup_order")      # exact tool name
span.set_attribute("agentnemesis.tool.input", json.dumps({"order_id": "123"}))
span.set_attribute("agentnemesis.tool.output", json.dumps({"status": "shipped"}))
```

> ⚠️ Person B's "Loop Detection" check reads `gen_ai.tool.name`. The "Broken Promise" check cross-references `gen_ai.tool.name` against the final response.

### Final response tagging

When the agent produces its final answer to the user, emit a dedicated span:

```python
with tracer.start_as_current_span("agent.final_response") as span:
    span.set_attribute("gen_ai.conversation.id", conversation_id)
    span.set_attribute("agentnemesis.agent_role", "support_bot")
    span.set_attribute("agentnemesis.final_response.text", final_answer_text)
```

### Multi-agent pipeline handoff spans (`gen_ai.operation.name = "invoke_agent"`)

```python
span.set_attribute("gen_ai.operation.name", "invoke_agent")
span.set_attribute("gen_ai.agent.name", "Planner")                  # or "Researcher" / "Writer"
span.set_attribute("agentnemesis.agent_role", "planner")             # lowercase
span.set_attribute("agentnemesis.handoff.input", json.dumps(...))    # what this agent received
span.set_attribute("agentnemesis.handoff.output", json.dumps(...))   # what this agent passed forward
```

### Span hierarchy (required)

The pipeline trace must look like this so Person B can group everything:

```
[Trace root]  pipeline_run  (gen_ai.conversation.id = "uuid-xyz")
  ├── invoke_agent  (gen_ai.agent.name = "Planner")
  │   └── chat
  ├── invoke_agent  (gen_ai.agent.name = "Researcher")
  │   ├── chat
  │   └── execute_tool  (gen_ai.tool.name = "search_web")
  └── invoke_agent  (gen_ai.agent.name = "Writer")
      └── chat
          └── agent.final_response
```

### SigNoz connection

```python
# Use these environment variables:
OTEL_EXPORTER_OTLP_ENDPOINT = "https://ingest.<region>.signoz.cloud:443"
OTEL_EXPORTER_OTLP_HEADERS = "signoz-ingestion-key=<your-key>"
OTEL_SERVICE_NAME = "agent-nemesis-demo"  # ← exact string, must match what Person B queries
```

---

## Step 6 — The Sign-Off Checklist

Before either of us writes logic that depends on the other's output, we need to agree on the contract. Go through `research/TELEMETRY_CONTRACT.md` and confirm each item:

- [ ] You agree to emit `gen_ai.conversation.id` on every span
- [ ] You agree to use `agentnemesis.agent_role` custom attribute
- [ ] You agree to emit `gen_ai.content.completion` as a span event (not attribute)
- [ ] You agree to the `agent.final_response` dedicated span approach
- [ ] You agree to `agentnemesis.tool.input` and `agentnemesis.tool.output` on tool spans
- [ ] You agree to the handoff attribute schema for the pipeline
- [ ] You agree that `service.name` = `"agent-nemesis-demo"` for SigNoz filtering
- [ ] You've tested that all pipeline spans share a single `trace_id` in SigNoz

Communicate your sign-off to Person B before moving past Phase 0.

---

## Step 7 — Key Pitfalls to Avoid (Person A Specific)

1. **Don't use LangChain or an agent framework** — the auto-instrumentation these add creates noise spans with inconsistent naming that will break the Checker's queries.

2. **Don't skip context propagation in the multi-agent pipeline** — if the agents run as separate processes, you MUST propagate the W3C `traceparent` header between them. Test in SigNoz that all three agents' spans appear under a single trace ID before telling Person B Phase 1 is done.

3. **Don't emit prompts/completions as span attributes** — use span events (`span.add_event(...)`) for content. Attributes have size limits and the privacy model is different.

4. **The `gen_ai.conversation.id` must be the same UUID for every span in a conversation** — generate it once at the start of the session and pass it through every context.

5. **Script the broken test conversations explicitly** — don't try to make the agent randomly fail. Write deterministic scripts that reliably trigger each failure mode so the demo Proof page always shows something.

---

## Step 8 — How to Proceed

Your immediate next steps are:

1. **Read all the `.planning/` docs** (especially `TELEMETRY_CONTRACT.md`)
2. **Sign off on the telemetry contract** with Person B
3. **Confirm SigNoz and Supabase credentials** are shared
4. **Set up your Python project** with the OTEL SDK
5. **Build the Support Bot first** — get one working conversation into SigNoz with correct attributes
6. **Verify in SigNoz** that `gen_ai.conversation.id` and all required attributes are visible on the trace before building more
7. **Build the Multi-Agent Pipeline**
8. **Script the 4 broken test conversations**
9. **Tell Person B** when Phase 1 is done so they can run real data through the Checker

For GSD workflow commands, use:
- `/gsd-discuss 1` — to capture your implementation decisions for Phase 1 before planning
- `/gsd-plan 1` — to research and plan your Phase 1 tasks in detail
- `/gsd-execute 1` — to execute the planned tasks with atomic git commits
- `/gsd-progress` — to check current state at any time

---

## What Person B is Building (So You Understand the Full System)

Person B's Checker reads your traces from SigNoz using the API, runs the 4 checks, computes a trust score, and:
- Stores results in Supabase (PostgreSQL)
- Pushes `agentnemesis.trust_score` as a custom metric back to SigNoz
- Pushes structured flag events as logs to SigNoz (with your `gen_ai.conversation.id` as correlation ID)
- Creates a SigNoz alert rule when scores drop below 0.5

Person B's Dashboard then reads from Supabase to show an Overview, Conversation list, annotated Conversation detail, Agent Chain visualization, and a Proof page.

The shared repo has `.planning/` committed so both of us stay in sync via `git pull`. Always pull before starting a work session.

---

That's everything. Start by reading the planning docs, then confirm the telemetry contract with Person B, and you're unblocked to build.
