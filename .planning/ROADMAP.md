# Roadmap

## Milestone Structure

The project is organized into **5 phases** across **2 parallel tracks**. Phases 0 and 4 require both persons. Phases 1–3 are parallelizable after Phase 0 completes.

```
PHASE 0: Foundation          ← Both (blocking everything)
    │
    ├── TRACK A: Person A ──► Phase 1: Agents & Telemetry
    │
    └── TRACK B: Person B ──► Phase 2: Infra & Checker Core
                          ──► Phase 3: Dashboard
    │
PHASE 4: Integration & Demo Prep ← Both
```

> **Recommended sequencing:** Person A completes Phase 1 (or at minimum has one working instrumented conversation flowing into SigNoz) before Person B can fully test Phase 2. However, Person B can build the dashboard scaffold and Checker logic against mocked span data in parallel.

---

## Progress Tracker

| Phase | Name | Track | Status | Requirements | Deliverables |
|-------|------|-------|--------|--------------|--------------|
| 0 | Foundation | Both | Planned | R01–R04 | Contract signed, infra provisioned |
| 1 | Agents & Telemetry | Person A | Planned | R05–R15 | Live instrumented agents sending traces to SigNoz |
| 2 | Infra & Checker Core | Person B | Planned | R03, R16–R26 | Checker running, results in Supabase, metrics back in SigNoz |
| 3 | Dashboard | Person B | Planned | R28–R35, R27 | All 5 pages live, SigNoz alert created |
| 4 | Integration & Demo Prep | Both | Planned | R15, R33 | End-to-end verified, demo seeded |

---

## Phase 0: Foundation

**Goal:** Unblock both tracks. Neither person writes instrumentation or checker logic until this is done.
**Owner:** Both
**Requirements:** R01, R02, R03 (partial), R04

### Deliverables
- [ ] Telemetry contract (`TELEMETRY_CONTRACT.md`) reviewed and all sign-off checkboxes ticked by both persons
- [ ] SigNoz Cloud org created and ingestion key shared
- [ ] Supabase project provisioned; schema applied (see `ARCHITECTURE.md`)
- [ ] `.env.example` committed to repo with all required variable names
- [ ] Both persons can run `git pull` and have the same `.planning/` context

### Definition of Done
Both persons have confirmed the telemetry contract in writing and both can reach SigNoz Cloud and Supabase with valid credentials.

---

## Phase 1: Agents & Telemetry

**Goal:** Real, instrumented AI agents sending complete traces to SigNoz Cloud, conforming to the telemetry contract.
**Owner:** Person A
**Requirements:** R05–R15
**Depends on:** Phase 0 complete

### Deliverables
- [ ] **Support Bot** implemented with 3 tools (`lookup_order`, `process_refund`, `search_kb`) (R05)
- [ ] **Multi-Agent Pipeline** implemented with Planner, Researcher, Writer agents (R06)
- [ ] Both agents instrumented with OpenTelemetry, exporting to SigNoz via OTLP (R07)
- [ ] All spans carry `gen_ai.conversation.id` on every span (R08)
- [ ] All spans carry `agentnemesis.agent_role` (R09)
- [ ] LLM call spans emit `gen_ai.content.completion` span event (R10)
- [ ] Tool spans carry `gen_ai.tool.name`, `agentnemesis.tool.input`, `agentnemesis.tool.output` (R11)
- [ ] Final response is explicitly tagged (R12)
- [ ] Pipeline spans carry `agentnemesis.handoff.input` and `agentnemesis.handoff.output` (R13)
- [ ] LLM spans carry `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` (R14)
- [ ] At least one real end-to-end conversation visible in SigNoz trace explorer with correct attributes
- [ ] **Deliberately broken test conversations** scripted and runnable for all 4 failure modes (R15)

### Definition of Done
Person B can run a support bot conversation and see all required span attributes in the SigNoz UI. The trace for that conversation has a consistent `gen_ai.conversation.id` across every span.

---

## Phase 2: Infra & Checker Core

**Goal:** The Checker worker runs, analyzes conversations, stores results in Supabase, and pushes data back into SigNoz.
**Owner:** Person B
**Requirements:** R03, R16–R26
**Depends on:** Phase 0 complete; works best after Phase 1 has at least one live conversation

### Deliverables
- [ ] Supabase schema fully applied (`conversations` table with correct columns and JSONB flags) (R03)
- [ ] Checker worker (`checker/`) bootstrapped as a standalone Node.js/TypeScript process (R16)
- [ ] SigNoz query client implemented — fetches all spans for a `gen_ai.conversation.id` (R17)
- [ ] **Loop Detection** check implemented and tested (R18)
- [ ] **Unverified Claims Detection** check implemented and tested (R19)
- [ ] **Broken Promise Detection** check implemented and tested (R20)
- [ ] **Broken Handoff Detection** check implemented and tested (R21)
- [ ] Trust score computed and written to Supabase per conversation (R22, R23)
- [ ] Custom `agentnemesis.trust_score` OTLP Gauge metric pushed back to SigNoz (R24)
- [ ] Structured OTLP log entry pushed to SigNoz per flag, with trace correlation (R25)
- [ ] Missing-attribute warning and `INCOMPLETE` status logic implemented (R26)
- [ ] Checker successfully analyzes at least one real conversation from Phase 1 end-to-end

### Definition of Done
Running the Checker against a real conversation from Phase 1 produces a row in Supabase with a trust score and flags array, AND the `agentnemesis.trust_score` metric is visible in SigNoz.

---

## Phase 3: Dashboard

**Goal:** All five dashboard pages are live, reading real data from Supabase, and the SigNoz alert rule is created.
**Owner:** Person B
**Requirements:** R27–R35
**Depends on:** Phase 2 (needs Supabase data to display)

> **Note:** Dashboard scaffolding (routing, layout, component setup) can begin in parallel with Phase 2 using mock data. Switch to real Supabase reads once Phase 2 is complete.

### Deliverables
- [ ] Next.js project initialized with Tailwind CSS and shadcn/ui (R34)
- [ ] **Overview page** — trust score trend (Recharts line chart), cost wasted (bar chart), flag type breakdown (R28)
- [ ] **Conversations page** — paginated table with filter by agent type, sort by trust score / timestamp (R29)
- [ ] **Conversation Detail page** — annotated transcript with inline flag callouts (R30)
- [ ] **Agent Chain page** — node-and-edge visualization of Planner → Researcher → Writer, broken handoffs highlighted (R31)
- [ ] **Proof page** — side-by-side display of broken test conversations with checker evidence (R32)
- [ ] **"Run Analysis" button** wired to Checker via Next.js API route (R33)
- [ ] All pages use Server Components for initial Supabase data fetch (R35)
- [ ] SigNoz alert rule created via `POST /api/v1/rules` for trust score < 0.5 (R27)

### Definition of Done
All 5 pages render real data. Clicking "Run Analysis" for a conversation ID triggers the Checker and the result appears in the dashboard within a reasonable time.

---

## Phase 4: Integration & Demo Prep

**Goal:** Full end-to-end flow verified, demo seeded with compelling data, and both persons ready to present.
**Owner:** Both
**Requirements:** R15 (verification), R33 (manual trigger testing)

### Deliverables
- [ ] **End-to-end test:** Person A runs all 4 deliberately broken conversations → Person B verifies Checker catches each one → Proof page displays correct evidence
- [ ] At least 3 pre-analyzed conversations seeded in Supabase so no page is empty at demo start
- [ ] SigNoz alert rule confirmed firing correctly on low trust scores
- [ ] `agentnemesis.trust_score` metric visible in SigNoz's native dashboards (confirm with judges' checklist)
- [ ] "Run Analysis" manual trigger tested live: run a conversation → click button → result appears
- [ ] Both persons have tested the full demo flow at least once, end-to-end, 24 hours before submission

### Definition of Done
The full demo can be run in under 5 minutes without unexpected failures: run a conversation, click "Run Analysis," show annotated transcript with flags, show Proof page, show SigNoz alert.

---

## Dependency Map

```
R01 (contract) ─────────────────────────────────────────► R08–R15 (Person A spans)
                                                           R17–R21 (Checker checks)

R02 (SigNoz org) ──────────────────────────────────────► R07 (OTLP export)
                                                          R17 (SigNoz query)
                                                          R24–R25 (push back)
                                                          R27 (alert rule)

R03 (Supabase) ─────────────────────────────────────────► R23 (write results)
                                                           R28–R32 (dashboard reads)

R05–R14 (agents done) ──────────────────────────────────► R18–R21 (real checker tests)

R16–R26 (checker done) ─────────────────────────────────► R28–R32 (dashboard has data)
                                                           R33 (manual trigger exists)
```

---
*Last updated: 2026-07-25*
