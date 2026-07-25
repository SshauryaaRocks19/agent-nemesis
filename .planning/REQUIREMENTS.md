# Requirements

## Overview

AgentNemesis is a trust-auditing dashboard for AI agents. It reads real OpenTelemetry traces from SigNoz Cloud and checks whether an agent's behavior matches its claims, catching four specific failure modes. This document covers requirements for both halves of the system (Person A: agents/telemetry; Person B: checker/dashboard) so both sides share a single source of truth.

Requirements are split into **V1 (must ship for the hackathon demo)** and **V2 (post-hackathon or stretch goals)**. Phase assignments are indicative — final phasing is defined in ROADMAP.md.

---

## V1 — Must Have

These are table stakes. The demo doesn't work without them.

### Shared / Infrastructure

| ID | Requirement | Owner | Phase |
|----|-------------|-------|-------|
| R01 | The telemetry contract in `TELEMETRY_CONTRACT.md` is finalized and signed off by both Person A and Person B before any instrumentation or checker logic is written | Both | 0 |
| R02 | A single SigNoz Cloud org is shared by both persons for the hackathon | Both | 0 |
| R03 | A single Supabase project (PostgreSQL) is provisioned, with the schema in `ARCHITECTURE.md` applied | Person B | 1 |
| R04 | A `.env.example` file is committed to the repo documenting all required environment variable names (values blank) so neither person misses a required key | Both | 1 |

---

### Person A — Demo Agents & Telemetry

| ID | Requirement | Phase |
|----|-------------|-------|
| R05 | A **Support Bot** is implemented with at least three tools: `lookup_order`, `process_refund`, and `search_kb` (knowledge base search) | 1 |
| R06 | A **Multi-Agent Pipeline** is implemented with three named agents: Planner, Researcher, Writer | 1 |
| R07 | All agent spans are instrumented with OpenTelemetry and exported to SigNoz Cloud via OTLP | 1 |
| R08 | Every span carries `gen_ai.conversation.id` — a UUID that is consistent across all spans in a single conversation | 1 |
| R09 | Every span carries `agentnemesis.agent_role` (custom attribute) identifying the emitting component (e.g., `support_bot`, `planner`, `researcher`, `writer`) | 1 |
| R10 | LLM call spans (`gen_ai.operation.name: chat`) emit `gen_ai.content.completion` as a span event containing the full response text | 1 |
| R11 | Tool execution spans (`gen_ai.operation.name: execute_tool`) carry `gen_ai.tool.name`, `agentnemesis.tool.input`, and `agentnemesis.tool.output` | 1 |
| R12 | The final response delivered to the user is explicitly tagged (via `agent.final_response` span or `agentnemesis.is_final_response: true` attribute — to be agreed in contract sign-off) | 1 |
| R13 | Multi-agent pipeline spans carry `agentnemesis.handoff.input` and `agentnemesis.handoff.output` on each `invoke_agent` span | 1 |
| R14 | LLM call spans carry `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` for cost calculation | 1 |
| R15 | A set of **deliberately broken test conversations** is scripted for the Proof page: at least one clear example of each of the four failure modes (loop, unverified claim, broken promise, broken handoff) | 2 |

---

### Person B — Checker

| ID | Requirement | Phase |
|----|-------------|-------|
| R16 | A background Node.js/TypeScript worker runs continuously and polls SigNoz for completed conversations (heuristic: no new spans for the conversation_id in the last 60 seconds) | 2 |
| R17 | The Checker fetches all spans for a conversation from SigNoz using the query API, grouped by `gen_ai.conversation.id` | 2 |
| R18 | The Checker runs **Loop Detection**: flags a conversation where the same `gen_ai.tool.name` is called 3+ times within a 60-second window without a different tool being called in between | 2 |
| R19 | The Checker runs **Unverified Claims Detection**: flags a conversation where the final LLM response contains a specific value (dollar amount, order ID, status string) that is not present in any tool output from that conversation | 2 |
| R20 | The Checker runs **Broken Promise Detection**: flags a conversation where the final LLM response explicitly claims an action was taken (e.g., "I've processed your refund") but the corresponding tool (`process_refund`) was never called during the conversation | 2 |
| R21 | The Checker runs **Broken Handoff Detection**: flags a pipeline conversation where `agentnemesis.handoff.output` of one agent and `agentnemesis.handoff.input` of the next agent have no overlapping key entities or topics | 2 |
| R22 | The Checker computes a **trust score** (0.0–1.0) per conversation: `1.0 - (number_of_flags / max_possible_flags)` | 2 |
| R23 | The Checker writes results (trust score, flags array, token counts, duration) to the Supabase `conversations` table | 2 |
| R24 | The Checker pushes `agentnemesis.trust_score` as a custom OTLP Gauge metric back to SigNoz after each analysis | 2 |
| R25 | The Checker pushes a structured OTLP log entry to SigNoz for each flagged issue, with the `gen_ai.conversation.id` as a correlation field | 2 |
| R26 | The Checker logs a warning (and marks the conversation as `INCOMPLETE` in Supabase) when a required attribute from the telemetry contract is absent — it never silently skips or false-passes | 2 |
| R27 | A SigNoz alert rule is created (via `POST /api/v1/rules`) that triggers when the rolling average `agentnemesis.trust_score` drops below 0.5 over a 5-minute window | 3 |

---

### Person B — Dashboard

| ID | Requirement | Phase |
|----|-------------|-------|
| R28 | An **Overview page** shows: total conversations analyzed, average trust score trend (line chart), cost wasted by flagged conversations (bar chart), and a breakdown of flags by type (pie/bar chart) | 3 |
| R29 | A **Conversations page** shows a paginated, filterable, sortable table of all analyzed conversations with columns: conversation ID, agent type, trust score, flag count, cost, timestamp | 3 |
| R30 | A **Conversation Detail page** shows an annotated transcript — the sequence of tool calls and LLM responses for a conversation — with each flagged issue highlighted inline and an explanation of why it was flagged | 3 |
| R31 | An **Agent Chain page** visualizes the multi-agent pipeline for a given conversation: a node-and-edge diagram showing Planner → Researcher → Writer, with handoff data shown on each edge, and broken handoffs highlighted | 3 |
| R32 | A **Proof page** shows the deliberately broken test conversations (R15) with their Checker results: each failure mode displayed with the flag, the evidence from the trace, and the trust score impact | 3 |
| R33 | A **"Run Analysis" button** on the dashboard (available on the Conversations page or a dedicated trigger) calls the Checker on demand for a specific conversation ID, bypassing the automatic polling interval | 3 |
| R34 | All dashboard pages are built with Next.js (App Router), Tailwind CSS, shadcn/ui components, and Recharts for data visualization | 3 |
| R35 | The dashboard reads data from Supabase via Server Components (no client-side waterfall for initial page load) | 3 |

---

## V2 — Nice to Have

Differentiators for after the hackathon demo is complete.

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| R36 | LLM-as-judge mode for unverified claims detection (more accurate than exact-value matching) | High | Slow/expensive for hackathon; good post-demo upgrade |
| R37 | Historical trend comparison — compare this week's trust scores vs last week | Medium | Needs more data volume |
| R38 | Per-agent breakdown on the Overview page (trust score by agent type) | Medium | Easy once data is seeded |
| R39 | Email/Slack notification when a SigNoz alert fires | Medium | SigNoz has native notification channels; configure via UI |
| R40 | Export conversation analysis as a PDF report | Low | Nice for enterprise positioning |
| R41 | Configurable thresholds for each check (loop count, cost ceiling) via dashboard UI | Low | Hardcode for v1 |

---

## Out of Scope

- Serverless API route for the Checker (execution time limits make this unsuitable)
- Webhook-triggered Checker (avoids requiring infrastructure from Person A)
- Real-time streaming traces (polling is sufficient for the demo)
- Multi-tenancy or user authentication on the dashboard (single-team internal tool)
- Support for agent frameworks other than the custom demo agents (LangChain, CrewAI, etc.)

---
*Last updated: 2026-07-25*
