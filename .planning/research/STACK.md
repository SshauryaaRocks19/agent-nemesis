# Stack Research — AgentNemesis

> Confidence levels: HIGH = verified via live docs/source | MEDIUM = confirmed via multiple search results | LOW = from research synthesis (verify before use)

## Overview

AgentNemesis is composed of three interconnected subsystems, each with its own stack. This document covers the standard, verified choices for each.

---

## Subsystem 1: Demo Agents (Person A)

### Runtime
- **Language:** Python — the dominant language for AI agent frameworks. [HIGH]
- **LLM Client:** OpenAI SDK (`openai` >= 1.0) or Anthropic SDK. Both have native async support. [HIGH]
- **Agent Pattern:** Custom agent loop (not a framework like LangChain) to keep instrumentation explicit and deterministic. Frameworks add invisible span noise. [MEDIUM - recommended for clarity]

### OpenTelemetry Instrumentation (Python)
- **Core SDK:** `opentelemetry-sdk`, `opentelemetry-api` [HIGH]
- **Exporter:** `opentelemetry-exporter-otlp-proto-grpc` or `opentelemetry-exporter-otlp-proto-http` — both supported by SigNoz Cloud. [HIGH]
- **Auto-instrumentation:** `opentelemetry-distro`, `opentelemetry-instrument` — can wrap HTTP calls automatically, but manual spans needed for agent-specific semantics. [HIGH]
- **GenAI conventions:** As of mid-2026, the `gen_ai.*` attribute namespace is in **Development** status (not yet Stable). Use with the understanding that attribute names may shift in future versions. [HIGH - confirmed via opentelemetry.io]

### SigNoz Connection
- **Endpoint:** `https://ingest.<region>.signoz.cloud:443` (gRPC) or `:4318` (HTTP)
- **Auth Header:** `signoz-ingestion-key: <key>` in `OTEL_EXPORTER_OTLP_HEADERS`
- **Protocol:** OTLP/gRPC preferred for agents (lower overhead than HTTP/JSON) [MEDIUM]

---

## Subsystem 2: Checker (Person B)

### Runtime
- **Language:** Node.js (TypeScript) — chosen to share types and utilities with the Next.js dashboard without cross-language overhead. [HIGH - team decision]
- **Process type:** Long-running background worker (NOT a serverless function) — required for persistent polling. [HIGH - team decision]
- **Scheduler:** `node-cron` for the automatic polling interval; a REST endpoint on the dashboard calls `analyzeTrace(traceId)` directly for the manual trigger. [MEDIUM]

### SigNoz API Access
- **Query endpoint:** `POST /api/v1/query_range` with composite queries (mirrors the Query Builder UI). No official public REST SDK exists; build with `axios` or native `fetch`. [MEDIUM]
- **Trace exploration:** Use the Network tab trick — replicate exact payloads from the SigNoz UI trace explorer to reverse-engineer the correct JSON query structure. [MEDIUM - widely confirmed community practice]
- **Authentication:** SigNoz service account API key in `SIGNOZ-API-KEY` header. [HIGH]

### Data Persistence
- **Supabase (PostgreSQL):** Stores Checker output — trust scores, flagged issues per conversation, raw span summaries. Acts as the source of truth for the dashboard. [HIGH - team decision]
- **Client:** `@supabase/supabase-js` — works in both Node.js and Next.js. [HIGH]

### Push-back to SigNoz
- **Custom metrics:** OpenTelemetry Node.js SDK (`@opentelemetry/sdk-metrics`, `@opentelemetry/exporter-otlp-proto-grpc`) — push `agentnemesis.trust_score` as a Gauge per conversation. [HIGH]
- **Custom logs:** `@opentelemetry/sdk-logs`, `@opentelemetry/exporter-otlp-proto-http` — push structured flag events (e.g., `LOOP_DETECTED`, `BROKEN_PROMISE`) with trace correlation IDs. [HIGH]
- **Alerts:** `POST /api/v1/rules` on the SigNoz API to create metric-threshold alerts on `agentnemesis.trust_score`. [MEDIUM]

---

## Subsystem 3: Dashboard (Person B)

### Framework
- **Next.js 14+ (App Router)** — SSR for fast initial load, API routes for the manual "Run Analysis" trigger, file-based routing for the multi-page dashboard. [HIGH - team decision]
- **TypeScript** — shared types across checker and dashboard; reduces integration bugs at the contract boundary. [HIGH]

### UI Libraries
- **Tailwind CSS** — utility-first; mandatory for shadcn/ui. [HIGH - team decision]
- **shadcn/ui** — component library built on Radix UI primitives; pre-built accessible components (Table, Dialog, Badge, Card) that match a polished design bar. [HIGH - team decision]
- **Recharts** — React-native charting; used for trend lines on the Overview page and bar charts on the Proof page. [HIGH - team decision]
- **Lucide React** — icon set; included by default in shadcn/ui toolchain. [HIGH]

### Data Fetching
- **Server Components** for dashboard pages that query Supabase directly (no client-side waterfall). [HIGH]
- **SWR or React Query** for the Conversation list (live-ish polling from dashboard with refresh). [MEDIUM - prefer SWR for simplicity]

---

## Key Stack Summary Table

| Component | Language | Key Deps | Owner |
|---|---|---|---|
| Demo agents | Python | `openai`, `opentelemetry-sdk`, `otlp-exporter` | Person A |
| Checker worker | Node.js/TS | `node-cron`, `axios`, `@supabase/supabase-js`, `@opentelemetry/sdk-*` | Person B |
| Dashboard | Next.js/TS | `tailwindcss`, `shadcn/ui`, `recharts`, `@supabase/supabase-js` | Person B |
| Shared telemetry target | — | SigNoz Cloud | Both |
| Shared database | — | Supabase (PostgreSQL) | Person B (schema) |

---
*Last updated: 2026-07-25 | Confidence: HIGH unless noted*
