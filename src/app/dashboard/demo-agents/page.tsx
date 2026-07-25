"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const DEMOS = [
  { id: "loop", name: "Infinite Loop Agent", desc: "Agent gets stuck calling the same tool repeatedly.", file: "loop_demo.py" },
  { id: "claim", name: "Unverified Claim Agent", desc: "Agent states a fact without invoking a tool to check.", file: "unverified_claim_demo.py" },
  { id: "promise", name: "Broken Promise Agent", desc: "Agent promises to do something but never dispatches the tool.", file: "broken_promise_demo.py" },
  { id: "handoff", name: "Broken Handoff Agent", desc: "Planner hands off to Researcher with corrupted context.", file: "broken_handoff_demo.py" },
];

export default function DemoAgentsPage() {
  const [running, setRunning] = useState<string | null>(null);

  async function runDemo(demoId: string) {
    setRunning(demoId);
    try {
      const res = await fetch("/api/run-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId })
      });
      if (!res.ok) throw new Error("Failed to run demo");
      toast.success("Agent executed! Traces sent to SigNoz.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demo Agents Sandbox</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Trigger the malicious agents to generate real OTel traces for the hackathon demo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {DEMOS.map((demo) => (
          <Card key={demo.id} className="relative overflow-hidden group border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">{demo.name}</CardTitle>
              <CardDescription className="text-sm">{demo.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mt-4">
                <code className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                  python3 agents/{demo.file}
                </code>
                <Button 
                  onClick={() => runDemo(demo.id)} 
                  disabled={running !== null}
                  size="sm"
                  className="gap-2"
                >
                  {running === demo.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Running...</>
                  ) : (
                    <><Play className="h-4 w-4" /> Trigger Trace</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-emerald-400 flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5" /> SigNoz Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-emerald-400/80">
            Traces are being sent to <strong>your configured SigNoz instance</strong>. Click a "Trigger Trace" 
            button above — the agent will run, emit OTel spans to SigNoz, then the Checker will 
            automatically pull them and populate the Conversations dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
