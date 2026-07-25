# Architecture Research — AgentNemesis

> Confidence levels: HIGH = verified | MEDIUM = confirmed via multiple sources | LOW = proposed

## System Architecture Overview

AgentNemesis is a three-subsystem pipeline where telemetry data flows left-to-right, and audit results flow into both a product database and back into the source observability platform.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AgentNemesis System                                │
│                                                                                 │
│  ┌─────────────────────┐   OTLP/gRPC    ┌─────────────┐   REST API             │
│  │  Demo Agents         │ ─────────────► │  SigNoz     │ ◄──────────────────┐   │
│  │  (Person A)          │               │  Cloud      │                    │   │
│  │                      │               │             │ ────────────────►  │   │
│  │  • Support Bot       │               │  Traces     │   Checker polls    │   │
│  │  • Multi-Agent       │               │  Metrics    │   for complete     │   │
│  │    Pipeline          │               │  Logs       │   traces           │   │
│  │    (P→R→W)           │               │  Alerts     │                    │   │
│  └─────────────────────┘               └─────────────┘                    │   │
│                                                ▲                           │   │
│                                         Push custom                        │   │
│                                         metrics/logs                       │   │
│                                         (trust scores,                     │   │
│                                          flag events)                      │   │
│                                                │                           │   │
│                                      ┌─────────────────┐                  │   │
│                                      │  Checker Worker  │ ◄────────────────┘   │
│                                      │  (Person B)      │                      │
│                                      │  Node.js/TS      │                      │
│                                      │  Background      │                      │
│                                      │  Process         │                      │
│                                      └────────┬─────────┘                      │
│                                               │ Writes results                 │
│                                               ▼                                │
│                                      ┌─────────────────┐                      │
│                                      │  Supabase        │                      │
│                                      │  (PostgreSQL)    │                      │
│                                      │  Trust scores,   │                      │
│                                      │  Flagged issues  │                      │
│                                      └────────┬─────────┘                      │
│                                               │ Reads results                  │
│                                               ▼                                │
│                                      ┌─────────────────┐                      │
│                                      │  Next.js         │                      │
│                                      │  Dashboard       │                      │
│                                      │  (Person B)      │                      │
│                                      │                  │                      │
│                                      │ Manual trigger ──┼──────────────────────┘
│                                      │  calls Checker   │
│                                      └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Checker Worker — Internal Architecture

The Checker is a single Node.js process that runs indefinitely. It has two trigger paths:

### Path 1: Automatic (Polling)
```
setInterval (30–60s)
  → query SigNoz API for traces where:
      service.name = "agent-nemesis-demo"
      last span timestamp > N seconds ago (conversation is "done")
      conversation_id NOT already in Supabase (not yet analyzed)
  → for each new conversation:
      → fetch all spans for that conversation_id
      → run 4 checks (see below)
      → write results to Supabase
      → push trust_score metric + flag events back to SigNoz
```

### Path 2: Manual (Dashboard trigger)
```
Dashboard calls: POST /api/analyze { traceId, conversationId }
  → Next.js API route calls analyzeConversation(conversationId) directly
  → Same 4-check pipeline runs synchronously
  → Returns results immediately to dashboard
  → Also writes to Supabase + pushes to SigNoz
```

### The 4 Checks — Internal Logic Patterns

**Check 1: Loop Detection**
```
input: ordered list of all execute_tool spans, sorted by timestamp
logic: sliding window — if the same gen_ai.tool.name appears K times
       within W seconds without a different tool call in between → LOOP
thresholds: K=3 calls, W=60s (tunable)
output: { detected: bool, tool_name, call_count, timestamps }
```

**Check 2: Unverified Claims**
```
input: final LLM response text (from agent.final_response span)
       + list of all execute_tool outputs (agentnemesis.tool.output)
logic: extract factual assertions from response text (entity/value extraction)
       for each assertion: check if any tool output contains supporting evidence
       if no tool output contains the claimed value → UNVERIFIED
output: { detected: bool, claims: [{ text, supported: bool, evidence_span_id }] }
```

**Check 3: Broken Promise**
```
input: final LLM response text
       + list of all execute_tool calls + their gen_ai.tool.name values
logic: extract action claims from response (e.g., "I've processed your refund")
       map claim to expected tool name (e.g., "processed refund" → "process_refund")
       check if that tool was actually called during the conversation
       if not → BROKEN PROMISE
output: { detected: bool, claimed_actions: [{ text, expected_tool, tool_called: bool }] }
```

**Check 4: Broken Handoff**
```
input: invoke_agent spans for planner, researcher, writer
       with agentnemesis.handoff.output and agentnemesis.handoff.input attributes
logic: planner.handoff_output should semantically match researcher.handoff_input
       researcher.handoff_output should semantically match writer.handoff_input
       "semantic match" = overlap in key entities/topics (simple: cosine similarity
       of extracted keywords; advanced: LLM-as-judge)
output: { detected: bool, break_points: [{ from_agent, to_agent, mismatch_reason }] }
```

---

## Database Schema (Supabase / PostgreSQL)

```sql
-- One row per conversation analyzed by the Checker
CREATE TABLE conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  TEXT UNIQUE NOT NULL,  -- gen_ai.conversation.id from spans
  trace_id         TEXT,                   -- SigNoz trace ID
  agent_type       TEXT,                   -- 'support_bot' | 'pipeline'
  analyzed_at      TIMESTAMPTZ DEFAULT NOW(),
  trust_score      FLOAT,                  -- 0.0–1.0
  token_cost_usd   FLOAT,                  -- calculated from input/output tokens
  flags            JSONB DEFAULT '[]',     -- array of flag objects (see below)
  raw_span_count   INT,
  duration_ms      INT
);

-- Flag object structure (stored in flags JSONB column):
-- {
--   "type": "LOOP" | "UNVERIFIED_CLAIM" | "BROKEN_PROMISE" | "BROKEN_HANDOFF",
--   "severity": "HIGH" | "MEDIUM" | "LOW",
--   "evidence": { ...check-specific details },
--   "span_ids": ["..."]
-- }
```

---

## SigNoz Integration Points (Deep Use)

To satisfy the hackathon's "deep use" requirement, SigNoz is used in 4 distinct ways:

| Usage | How |
|---|---|
| **Traces (read)** | Checker polls SigNoz API to fetch agent conversation traces |
| **Custom Metrics (write)** | Checker pushes `agentnemesis.trust_score` as OTLP Gauge back to SigNoz |
| **Custom Logs (write)** | Checker pushes flag events as structured OTLP logs with trace correlation IDs |
| **Native Alerts (create)** | Alert rule on `agentnemesis.trust_score < 0.5` over sliding window via SigNoz `/api/v1/rules` |

This means SigNoz serves as both the **source** of agent behavior data AND the **target** for processed analysis results — making it a genuine observability loop rather than just a data source.

---

## Deployment Architecture

### Development
- Person A: Python agent scripts run locally, pointing to SigNoz Cloud
- Person B: Checker runs locally with `ts-node` or `tsx`; Next.js on `npm run dev`
- Shared: Single SigNoz Cloud org; single Supabase project; environment variables shared via `.env.local` (gitignored)

### Demo Day
- Checker: Run locally (not deployed) for maximum control
- Dashboard: Deployed to Vercel (Next.js native); reads Supabase directly from server components
- Person A: Agent scripts run locally, sending live traces during demo

> ⚠️ **Flag for team:** The `.env.local` approach means each developer needs to manually keep environment variables in sync. If this becomes painful, consider adding a `.env.example` file to the repo with all required variable names (values blank) so neither person misses a required key.

---
*Last updated: 2026-07-25 | Confidence: MEDIUM-HIGH*
