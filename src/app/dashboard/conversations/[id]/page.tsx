import { getConversation } from "@/lib/checker/supabase-client";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, ShieldCheck, Clock, Coins, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <h2 className="text-xl font-medium text-muted-foreground">Conversation Not Found</h2>
        <Link href="/dashboard/conversations" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log
        </Link>
      </div>
    );
  }

  const flags = conversation.flags || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/conversations" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trace: {conversation.conversation_id.substring(0, 8)}</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Full conversation ID: {conversation.conversation_id}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              Trust Score <ShieldCheck className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conversation.trust_score.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              Cost <Coins className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${conversation.token_cost_usd?.toFixed(4) || "0.0000"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              Agent Type <Activity className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold capitalize mt-1">{conversation.agent_type.replace("_", " ")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              Duration <Clock className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conversation.duration_ms || "- "}ms</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identified Issues</CardTitle>
              <CardDescription>
                Failures caught by the monitoring checker.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flags.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-emerald-500 gap-2 border border-emerald-500/20 bg-emerald-500/5 rounded-md">
                  <ShieldCheck className="h-8 w-8" />
                  <p className="font-medium">No issues detected. Perfect score.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flags.map((flag: any, i: number) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-md bg-rose-500/5 border-rose-500/20">
                      <div className="mt-0.5">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-rose-500">{flag.type.replace("_", " ")}</h4>
                          <Badge variant="outline" className="border-rose-500/30 text-rose-500">{flag.severity}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          <p className="font-semibold mb-1">Evidence:</p>
                          <div className="bg-background/50 rounded p-2 text-xs font-mono border border-border/50">
                            {Object.entries(flag.evidence || {}).map(([key, value]) => (
                              <div key={key} className="flex gap-2 py-0.5">
                                <span className="font-semibold text-rose-500/80 capitalize">{key.replace("_", " ")}:</span>
                                <span className="text-foreground/80 break-all">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Analyzed At</p>
                <p className="font-medium" suppressHydrationWarning>{new Date(conversation.analyzed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spans Scanned</p>
                <p className="font-medium">{conversation.raw_span_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trace ID (SigNoz)</p>
                <p className="font-mono text-xs mt-1 truncate" title={conversation.trace_id}>{conversation.trace_id || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
