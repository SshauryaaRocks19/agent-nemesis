# Project State

## Current Position
**Phase:** 0 — Foundation
**Status:** Ready to begin
**Last activity:** 2026-07-25 — Project initialized, research complete, requirements and roadmap defined

## Summary
Both tracks are blocked on Phase 0. Neither person should write instrumentation or checker logic until the telemetry contract is signed off.

## Immediate Next Steps

### Both Persons
1. Review `TELEMETRY_CONTRACT.md` together and finalize all open decisions (final response tagging: Option A vs B, `service.name` constant, multi-agent process topology)
2. Tick all sign-off checkboxes in `TELEMETRY_CONTRACT.md`
3. Share SigNoz ingestion key and API key
4. Provision Supabase project and apply schema from `ARCHITECTURE.md`
5. Commit `.env.example` with all required variable names

### Person A (after Phase 0)
- Begin Phase 1: Support Bot + Multi-Agent Pipeline with OTEL instrumentation

### Person B (after Phase 0)
- Begin Phase 2: Checker worker setup + SigNoz query client
- Dashboard scaffolding can begin in parallel using mock data

## Key Decisions

| Decision | Phase | Source | Rationale |
|----------|-------|--------|-----------|
| Node.js Checker (not serverless) | Init | User | Avoid Vercel execution time limits; needs persistent polling |
| Polling + manual trigger | Init | User | Polling for realism; manual for demo reliability |
| Supabase + SigNoz (dual persistence) | Init | User | Supabase for relational dashboard queries; SigNoz for native alerting credibility |
| Next.js + Tailwind + shadcn/ui | Init | User | Fast, polished UI for hackathon demo |
| Two-person split | Init | User | Parallel development; shared planning docs as sync mechanism |

## Blockers / Concerns

| # | Concern | Severity | Mitigation |
|---|---------|----------|------------|
| 1 | Telemetry contract not yet signed off | 🔴 Critical | Must resolve in Phase 0 before any code |
| 2 | SigNoz query API is undocumented | 🟡 Medium | Budget 2–4hrs for reverse-engineering from UI network tab |
| 3 | Unverified claims check has high false-positive risk | 🟡 Medium | Use exact-value matching only; script clear-cut demo cases |
| 4 | Multi-agent span context propagation if agents are separate processes | 🟡 Medium | Person A to verify in SigNoz that all pipeline spans share one trace ID before Phase 2 |

---
*Last updated: 2026-07-25*
