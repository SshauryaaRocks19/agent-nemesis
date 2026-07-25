import { getRecentConversations } from "@/lib/checker/supabase-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRight, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ConversationsPage() {
  const conversations = await getRecentConversations(100);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversations Log</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Complete history of all monitored agent interactions.
          </p>
        </div>
        <Link href="/dashboard/conversations" className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </span>
        </Link>
      </div>

      <div className="border border-border bg-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Trace ID</TableHead>
              <TableHead>Agent Role</TableHead>
              <TableHead>Trust Score</TableHead>
              <TableHead>Issues Detected</TableHead>
              <TableHead className="hidden md:table-cell">Duration</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  No conversations analyzed yet. Wait for the Checker to process data.
                </TableCell>
              </TableRow>
            ) : conversations.map((row) => (
              <TableRow key={row.conversation_id}>
                <TableCell className="font-mono text-xs">{row.conversation_id.substring(0, 8)}</TableCell>
                <TableCell className="font-medium">{row.agent_type}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    row.trust_score > 0.8 ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" :
                    row.trust_score > 0.5 ? "text-amber-500 border-amber-500/20 bg-amber-500/10" :
                    "text-rose-500 border-rose-500/20 bg-rose-500/10"
                  )}>
                    {row.trust_score.toFixed(2)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.flags && row.flags.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-sm text-rose-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{row.flags.length} Flags</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-500">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Clean</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {row.duration_ms ? `${row.duration_ms}ms` : '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm" suppressHydrationWarning>
                  {new Date(row.analyzed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/conversations/${row.conversation_id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
