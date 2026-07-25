# Pitfalls Research — AgentNemesis

> Specific failure modes and gotchas identified through research and first-principles analysis. Organized by subsystem.

---

## 1. Telemetry Contract Drift (CRITICAL RISK)

**What:** Person A changes a span attribute name (e.g., `agentnemesis.agent_role` → `agentnemesis.role`) during implementation. Person B doesn't notice. The Checker silently gets `undefined` when reading that attribute, and all analyses that depend on it return false negatives — appearing to "pass" when they should be flagging issues.

**Why it's hard:** There's no compile-time enforcement of OTLP attribute names. The Checker and the agents are in different languages (Python and Node.js), so there's no shared type system.

**Mitigations:**
- This file (`TELEMETRY_CONTRACT.md`) is the single source of truth — treat any change to it as a breaking change requiring both parties' acknowledgment.
- The Checker should log a warning when it processes a conversation and finds a required attribute absent (never silently skip).
- Add a `TELEMETRY_CONTRACT_VERSION` string to the service's resource attributes (e.g., `agentnemesis.contract.version: "1.0"`) so mismatches are detectable from traces.

---

## 2. Conversation Completion Detection (MEDIUM RISK)

**What:** The Checker uses "no new spans in the last N seconds" to consider a conversation complete. If an agent is slow (e.g., LLM latency spike), this can cause the Checker to analyze a conversation mid-run, resulting in incomplete data and false positives (especially loop detection).

**Mitigations:**
- Set N conservatively (e.g., 60–90 seconds, not 30).
- Add an explicit `agent.session.end` span or attribute emitted by Person A when the session is definitively done.
- If a conversation is analyzed and found to have zero `agent.final_response` spans, mark it as `INCOMPLETE` in Supabase rather than scoring it.
- For the live demo: always use the manual trigger, not the automatic poller, to guarantee you're analyzing a complete conversation.

---

## 3. SigNoz Query API is Undocumented (MEDIUM RISK)

**What:** SigNoz doesn't publish a formal REST API spec for querying traces. The `POST /api/v1/query_range` endpoint structure has to be reverse-engineered from the network tab in the SigNoz UI.

**Mitigations:**
- Before writing Checker logic, capture the exact network request for a trace explorer query from the SigNoz UI and hard-code that payload as a template.
- The `compositeQuery` JSON structure is the key field; copy it exactly.
- Add pagination handling from the start — a trace with many tool calls may return many spans that need to be paginated.

---

## 4. Unverified Claims Detection — False Positives (HIGH RISK)

**What:** The "Unverified Claims" check tries to match factual assertions in the LLM's final response against tool outputs. This is inherently imprecise. Examples of false positives:
- The agent says "Your order total is $45" — tool returned `{ "total": 45 }`. A naive string match might miss this.
- The agent summarizes something from a knowledge base search. The KB result is long; the agent paraphrases. String matching fails.

**Mitigations:**
- Start with a lenient threshold: only flag when a specific value (order ID, dollar amount, status string) from the final response has NO match anywhere in ANY tool output for the conversation.
- Avoid trying to be smart about paraphrasing — that leads to complex LLM-as-judge calls that are slow and expensive. The Proof page demo should showcase cases where the mismatch is clear-cut.
- For the demo: script the "broken" test cases so they have obvious, easily detectable mismatches (e.g., "Your refund of $99 is processed" when no refund tool was called at all).

---

## 5. Token Cost Calculation — Accuracy (LOW RISK for demo)

**What:** Cost per token varies by model version and changes over time. Using a hardcoded price table risks showing incorrect dollar amounts.

**Mitigations:**
- For the hackathon: hardcode a price table for the models Person A will use (e.g., GPT-4o: $5/$15 per 1M tokens, in/out). Document the date and source.
- Label the "Cost Wasted" number on the dashboard with a footnote: "Estimated based on [model] pricing as of [date]."
- Don't block on getting this perfect — the chart shape matters more than the exact dollar value for the demo.

---

## 6. SigNoz Custom Metric — Cardinality Explosion (LOW RISK)

**What:** If the trust score metric is emitted with high-cardinality label values (e.g., `conversation_id` as a label dimension), SigNoz's ClickHouse backend can develop query performance issues.

**Mitigation:**
- Do NOT use `conversation_id` as a metric label. Use it only in logs and traces.
- Metric dimensions should only include low-cardinality values: `agent_type` (`support_bot` | `pipeline`), `flag_type` (`LOOP` | `UNVERIFIED_CLAIM` etc.).
- Push the per-conversation details as structured logs (with `gen_ai.conversation.id` in the log body), not as metric attributes.

---

## 7. Vercel Deployment — Environment Variables (MEDIUM RISK)

**What:** The Next.js dashboard on Vercel needs Supabase credentials. If the Vercel deployment is set up without them, the production dashboard will silently return empty data.

**Mitigation:**
- Add a `VERCEL_ENV` check on startup in the Next.js app — if required env vars are missing, render a clear error state instead of an empty dashboard.
- Commit a `.env.example` to the repo (never `.env.local`) with all variable names and dummy values, so setup is self-documenting.

---

## 8. Multi-Agent Span Context Propagation (MEDIUM RISK — Person A's domain)

**What:** In the planner → researcher → writer pipeline, if the agents run as separate processes (rather than async calls within one process), W3C trace context (the `traceparent` header) must be explicitly propagated between them. If it's not, each agent creates a separate root trace, and all spans from different agents will have different `trace_id` values — the Checker won't be able to link them into one conversation.

**Mitigation for Person A:**
- Use OTel Baggage or a custom header to propagate `gen_ai.conversation.id` between agent processes even if `traceparent` fails.
- Test this specifically: run the pipeline end-to-end once and confirm in SigNoz that all three agents' spans appear under a single trace ID before writing any multi-agent analysis logic.

---

## 9. Demo Reliability — The Live Demo Contract (OPERATIONAL RISK)

**What:** In a hackathon demo, time pressure and unfamiliar environments cause unexpected failures. The most common: the Checker picks up an old, already-analyzed conversation, or a network timeout from the SigNoz API breaks the demo mid-run.

**Mitigations:**
- The manual "Run Analysis" button is the primary demo path — never rely on the poller during the actual demo.
- Have at least 3 pre-analyzed conversations in Supabase BEFORE the demo begins, so the Overview and Conversation List pages are never empty.
- Add a demo-mode `.env` flag that shows a "seed data" banner on the dashboard — makes it clear to judges that real data is present even if the live demo agent encounters an issue.
- Test the full end-to-end flow at least 24 hours before the demo.

---
*Last updated: 2026-07-25*
