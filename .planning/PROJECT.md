# AgentNemesis

## Vision
A trust-auditing dashboard for AI agents that reads real OpenTelemetry traces from SigNoz to check whether an agent's behavior actually matches its claims. This project, built for the SigNoz "Agents of SigNoz" hackathon, ensures accountability by actively detecting failure modes like loops, hallucinations, and broken promises in AI agents.

## Core Value
Automatically catching four specific agent problems using actual observability data, thereby proving that the agents are trustworthy (or highlighting exactly where they fail):
1. **Loops:** The agent gets stuck calling the same tool repeatedly without making progress.
2. **Unverified claims:** The agent states something as fact without looking it up via a tool.
3. **Broken promises:** The agent claims to have taken an action that it never executed.
4. **Broken handoffs:** In a multi-agent pipeline, one agent's output doesn't match what the next agent actually needed or used.

## Target Users
Engineers and operators managing AI agents who need observability beyond basic metrics, specifically requiring behavioral auditing. Additionally, the judges for the SigNoz hackathon who will evaluate the deep, non-superficial use of SigNoz traces, metrics, dashboards, and alerts.

## Technical Context
The project is built in parallel by a two-person team. The architecture is split into two halves:
- **Person A (Demo Agents & Telemetry):** A support bot with tools (order lookup, refund, knowledge base search) and a multi-agent pipeline (planner/researcher/writer). Instrumented with OpenTelemetry, sending real traces to SigNoz Cloud.
- **Person B (Checker & Dashboard):** 
  - **Checker:** A lightweight, background Node script (not a serverless API route) that polls SigNoz for complete traces (plus a manual trigger for demo reliability) and runs the four checks.
  - **Dashboard:** Built with Next.js, React, Tailwind CSS, shadcn/ui, and Recharts. Includes Overview, Conversation list, Conversation detail (annotated transcript), Agent chain visualization, and a Proof page.

### Crucial Dependency: The Telemetry Contract
Before either side writes analysis or instrumentation code, a strict OpenTelemetry contract must be defined and agreed upon by both Person A and Person B. This must include:
- Consistent naming for tool-execution vs. final-response spans (e.g., `tool.*` vs `llm.final_response`).
- Standard attributes on tool spans (name, input, output, timestamp).
- Standard attributes on the final response span (actual response text).
- A consistent session/conversation ID attribute across all spans.
- Multi-agent identifiers indicating the named agent (planner/researcher/writer) and its input/output boundaries.

## AI Discretion Policy

This is a hackathon where AI-assisted development is not prohibited but is looked down upon by judges. All code, comments, commit messages, and documentation written with AI assistance must be reviewed and rewritten to read as natural, human-authored work before committing.

**Practical rules for both persons:**
- No excessive inline comments. Humans don't comment every line.
- No AI-telltale phrasing in comments (e.g., "This function handles...", "We need to ensure that...", "It's important to note...").
- Variable and function names should be practical and slightly imperfect — not exhaustively descriptive.
- Commit messages should be short and natural (`fix refund edge case`, not `fix: handle edge case in process_refund tool with comprehensive error handling`).
- No over-engineered error handling on first pass. Humans add that incrementally.
- Code structure should feel built up organically, not laid out all at once.
- Remove any docstrings that read like they were auto-generated. Keep ones that would genuinely help a human reader.

**The bar:** If a judge skimmed the git diff and thought "this reads like ChatGPT wrote it," that's a problem. If they thought "this looks like two people hacking something together under time pressure," that's correct.

## Requirements

### Validated
(None yet — ship to validate)

### Active
- [ ] Define the strict OpenTelemetry attribute contract between Person A and Person B
- [ ] Build Demo Agents with OTEL instrumentation (Person A)
- [ ] Build the background Node script Checker that polls SigNoz and runs 4 behavioral checks (Person B)
- [ ] Set up Supabase (PostgreSQL) for storing Checker results (trust scores, flagged issues) (Person B)
- [ ] Configure the Checker to push summary metrics/logs back to SigNoz for native dashboards/alerting (Person B)
- [ ] Build the Next.js Dashboard with Tailwind, shadcn/ui, and Recharts (Person B)

### Out of Scope
- Serverless API routes for the Checker (avoided due to execution time limits).
- Webhook infrastructure for triggering the Checker (avoided to reduce moving parts for the live demo).

## Key Decisions

| Decision | Source | Rationale | Outcome |
|----------|--------|-----------|---------|
| Two-person split | User | Parallel development for hackathon; requires shared context files. | Decided |
| Node script Checker | User | Avoid serverless timeouts; keep polling simple and controllable. | Decided |
| Dual Data Persistence | User | Postgres (Supabase) handles complex relational dashboard queries; pushing back to SigNoz fulfills the "deep use" hackathon criteria for native alerting. | Decided |
| Polling + Manual Trigger | User | Automatic polling provides realism; manual trigger ensures a fast, reliable live demo. | Decided |
| Tech Stack | User | Next.js, Tailwind, shadcn/ui, Recharts for high presentation quality and speed. | Decided |

---
*Last updated: 2026-07-25 after initialization*
