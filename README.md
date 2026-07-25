# AgentNemesis

AI agents are great until they get stuck in an infinite loop and burn $400 in API credits before you wake up. **AgentNemesis** is a trust-auditing dashboard that sits on top of your agent pipelines to catch logical gaps, unverified claims, and broken handoffs in real-time.

Built as a hackathon project, it hooks into OpenTelemetry (OTel) traces to mathematically prove if your agent actually did what it said it was going to do.

## What it actually does

We expose the gap between **intent** and **execution**. 

Instead of just parsing strings or relying on the agent to "grade itself", AgentNemesis uses deterministic OTel spans sent to **SigNoz**. A headless Node worker polls these traces and looks for:
- **Infinite Loops**: Agents calling the same tool repeatedly without advancing the state.
- **Unverified Claims**: The agent states a fact in its output, but the trace history proves it never dispatched a tool to check that fact.
- **Broken Promises**: The agent claims it executed an action, but the telemetry says otherwise.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS v4
- **UI / Animations**: Custom Shadcn components, GSAP (ScrollTrigger), Framer Motion, React Flow (for the agent topology graph)
- **Auth**: Clerk (Next.js proxy middleware protected)
- **Telemetry**: OpenTelemetry GenAI conventions, SigNoz
- **Database / State**: Supabase
- **Pipeline**: Python (OpenAI/Gemini agent scripts)

## Getting Started

You'll need a SigNoz workspace and a Clerk application to get this running locally.

### 1. Environment Variables
Create a `.env.local` file in the root. You'll need your Clerk keys, Supabase credentials, and the SigNoz ingestion URL.

### 2. Install dependencies
```bash
npm install
```

### 3. Run the dev server
```bash
npm run dev
```
The app will be up at `http://localhost:3000`. 

## Architecture Notes

- **The Checker (`src/lib/checker`)**: This is the core logic. It reads raw OTel spans via the SigNoz API, parses the `agentnemesis.*` custom attributes, and flags anomalies.
- **The Dashboard (`src/app/dashboard`)**: Protected by Clerk middleware. All the charts are powered by Recharts, and the agent topology graph is built with `@xyflow/react`.
- **Python Agents (`agents/pipeline`)**: We included some dummy agent scripts to generate test traces. They intentionally hallucinate and loop so you can see the checker in action.

## Contributing
Since this was built for a hackathon, the code is a bit chaotic in places (don't look too closely at the prop drilling in the graph nodes). If you want to fix something, open a PR.

---
*Built to keep rogue agents on a leash.*
