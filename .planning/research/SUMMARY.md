# Research Summary — AgentNemesis

> All four research documents are stored in this directory. This file is the fast-read entry point.
> Confidence levels match the source documents.

---

## Key Findings

### 1. OTEL GenAI Conventions Are Real but Unstable
The `gen_ai.*` attribute namespace is in **Development** status as of mid-2026 — widely adopted by the industry but not yet Stable. We should adopt it (avoids inventing everything from scratch) but must not assume it won't shift. Our custom `agentnemesis.*` attributes extend it for our specific needs. [HIGH confidence]

**Critical standard attributes for this project:**
| Attribute | Purpose |
|---|---|
| `gen_ai.conversation.id` | Groups all spans in one session — the linchpin of the Checker |
| `gen_ai.operation.name` | Classifies span type: `chat`, `invoke_agent`, `execute_tool` |
| `gen_ai.agent.name` | Names the agent for multi-agent pipeline visibility |
| `gen_ai.tool.name` | Names the tool for loop detection |
| `gen_ai.usage.input_tokens` + `output_tokens` | Token counts for cost calculation |
| `gen_ai.content.completion` (span event) | LLM response text — needed for claim/promise checks |

### 2. The Telemetry Contract Is the Single Highest-Risk Item
The Checker and the agents live in different codebases, different languages, different owners. If they disagree on attribute names, the Checker fails silently. See `TELEMETRY_CONTRACT.md` for the full draft schema — **both persons must sign off before writing instrumentation or analysis code**.

### 3. The Architecture Is Proven, but the SigNoz Query API Requires Reverse-Engineering
The overall architecture (agent → SigNoz → Checker → Supabase → Dashboard) is sound and maps to real systems. The one friction point: SigNoz doesn't publish a formal REST API spec. The query payload structure must be reverse-engineered from the UI's network tab. Budget 2–4 hours for this discovery work before building the Checker's SigNoz client.

### 4. The "Deep Use" of SigNoz Is Achievable and Specific
The four integration points (read traces, write metrics, write logs, create alerts) satisfy the hackathon's "deep use" criterion. These are not bolted-on — they each serve a concrete product purpose and together form a genuine observability loop.

### 5. The Four Checks Have Well-Understood Complexity Profiles

| Check | Complexity | Risk of false positives |
|---|---|---|
| Loop Detection | Low — window over sorted spans | Low (tunable threshold) |
| Broken Promise | Medium — keyword-to-tool mapping | Medium (needs good mapping table) |
| Unverified Claims | High — text vs structured output | High (use exact-value matching only) |
| Broken Handoff | High — semantic comparison | High (use keyword overlap, not NLP) |

### 6. Demo Reliability Requires Explicit Preparation
Do not rely on the automatic poller during the live demo. Use the manual trigger. Pre-seed at least 3 analyzed conversations in Supabase. Test end-to-end at least 24 hours before the demo.

---

## Open Items Requiring Team Sync (Before Coding)

| # | Item | Blocker for |
|---|---|---|
| 1 | Sign off on `TELEMETRY_CONTRACT.md` — custom attribute names | Checker + Agents |
| 2 | Confirm Option A vs B for final response tagging | Checker (broken promise check) |
| 3 | Confirm multi-agent pipeline runs as one process or multiple | Checker (handoff analysis) |
| 4 | Confirm `service.name` value for SigNoz filtering | Checker query |
| 5 | Share Supabase project URL + anon key | Dashboard |
| 6 | Share SigNoz ingestion key (for Checker to push metrics back) | Checker |
| 7 | Share SigNoz API key (for Checker to query traces) | Checker |

---

## Files in This Directory

| File | Contents |
|---|---|
| `STACK.md` | Verified library and tool choices per subsystem |
| `TELEMETRY_CONTRACT.md` | **DRAFT** OTEL attribute schema — sign-off required |
| `ARCHITECTURE.md` | System diagram, Checker internals, DB schema, SigNoz integration points |
| `PITFALLS.md` | Failure modes and specific mitigations per subsystem |
| `SUMMARY.md` | This file |

---
*Last updated: 2026-07-25*
