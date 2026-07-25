"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell } from "recharts";
import { KpiData, TrustTrendData, FlagBreakdownData, RecentConversations } from "@/lib/mock-data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowRight, ShieldAlert, AlertTriangle, CheckCircle2, Activity, Users, ShieldCheck, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import NumberTicker from "@/components/ui/number-ticker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardOverview({ initialData = [] }: { initialData: any[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // If we have real data, calculate stats from it, else fallback to mock data
  const realKpis = initialData.length > 0 ? {
    averageTrustScore: initialData.reduce((acc, curr) => acc + curr.trust_score, 0) / initialData.length,
    activeAgents: new Set(initialData.map(d => d.agent_type)).size,
    totalFlags: initialData.reduce((acc, curr) => acc + curr.flags.length, 0),
    estimatedCostWasted: initialData.reduce((acc, curr) => acc + (curr.flags.length > 0 ? curr.token_cost_usd : 0), 0)
  } : null;

  const displayRecent = initialData.length > 0 
    ? initialData.slice(0, 5).map(d => ({
        id: d.conversation_id.substring(0, 8),
        agent: d.agent_type,
        score: d.trust_score,
        flags: d.flags.length,
        time: new Date(d.analyzed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      }))
    : RecentConversations;

  // Compute Trend Data
  const trendMap = new Map<string, { total: number, count: number }>();
  if (initialData.length > 0) {
    initialData.forEach(d => {
      const date = new Date(d.analyzed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' });
      const current = trendMap.get(date) || { total: 0, count: 0 };
      trendMap.set(date, { total: current.total + d.trust_score, count: current.count + 1 });
    });
  }
  const realTrendData = initialData.length > 0
    ? Array.from(trendMap.entries()).map(([date, { total, count }]) => ({
        date,
        score: total / count
      })).reverse()
    : TrustTrendData;

  // Compute Flag Breakdown Data
  const flagCounts: Record<string, number> = { "LOOP": 0, "UNVERIFIED_CLAIM": 0, "BROKEN_PROMISE": 0, "BROKEN_HANDOFF": 0 };
  if (initialData.length > 0) {
    initialData.forEach(d => {
      d.flags?.forEach((f: any) => {
        if (flagCounts[f.type] !== undefined) flagCounts[f.type]++;
      });
    });
  }
  const realFlagBreakdown = initialData.length > 0
    ? [
        { name: "Loops", count: flagCounts["LOOP"], fill: "var(--color-trust-warning)" },
        { name: "Unverified Claims", count: flagCounts["UNVERIFIED_CLAIM"], fill: "var(--color-trust-flagged)" },
        { name: "Broken Promises", count: flagCounts["BROKEN_PROMISE"], fill: "var(--color-trust-flagged)" },
        { name: "Broken Handoffs", count: flagCounts["BROKEN_HANDOFF"], fill: "var(--color-trust-warning)" },
      ]
    : FlagBreakdownData;


  if (!mounted) {
    return <div className="h-screen w-full flex items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            High-level metrics for all monitored agents in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex" 
            onClick={() => {
              toast.info("Generating report...");
              const headers = ["ID", "Agent", "Trust Score", "Flags", "Time"];
              const csvContent = [
                headers.join(","),
                ...displayRecent.map(row => `${row.id},${row.agent},${row.score.toFixed(2)},${row.flags},"${row.time}"`)
              ].join("\n");

              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `agent-nemesis-report.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success("Report downloaded.");
            }}
          >
            Download Report
          </Button>
          <Button size="sm" onClick={() => toast.success("New alert configured successfully.")}>Create Alert</Button>
        </div>
      </div>

      {/* Bento Grid KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Trust Score Average", value: realKpis?.averageTrustScore ?? KpiData.averageTrustScore, isCurrency: false, isScore: true, icon: ShieldCheck, change: "+2.1%" },
          { label: "Active Monitored Agents", value: realKpis?.activeAgents ?? KpiData.activeAgents, isCurrency: false, isScore: false, icon: Users, change: "+12" },
          { label: "Total Flags", value: realKpis?.totalFlags ?? KpiData.totalFlags, isCurrency: false, isScore: false, icon: AlertTriangle, change: "-4" },
          { label: "Est. Cost Wasted", value: realKpis?.estimatedCostWasted ?? KpiData.estimatedCostWasted, isCurrency: true, isScore: false, icon: DollarSign, change: "-$430" }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <NumberTicker 
                    value={stat.value} 
                    isCurrency={stat.isCurrency} 
                    isScore={stat.isScore} 
                    className={cn(
                      "text-2xl font-bold",
                      stat.isScore && stat.value > 0.8 ? "text-emerald-500" : 
                      stat.isScore && stat.value > 0.5 ? "text-amber-500" : 
                      stat.isScore ? "text-rose-500" : ""
                    )} 
                  />
                  {stat.isScore && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                      HEALTHY
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={stat.change.startsWith("+") && !stat.isScore ? "text-emerald-500" : "text-muted-foreground"}>
                    {stat.change}
                  </span> from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Trust Score Trend</CardTitle>
            <CardDescription>Daily average trust score across all active agents.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 1]} 
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6366F1" 
                    strokeWidth={3} 
                    dot={{ fill: 'hsl(var(--background))', stroke: '#6366F1', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6, fill: '#6366F1', stroke: 'hsl(var(--background))', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Flag Breakdown</CardTitle>
            <CardDescription>Categorized issues raised by the monitoring system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={realFlagBreakdown} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={130} 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                    {realFlagBreakdown.map((entry, index) => {
                      const colors = ["#6366F1", "#F43F5E", "#F59E0B", "#10B981", "#8B5CF6"];
                      return (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} className="opacity-80 hover:opacity-100 transition-opacity" />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Anomalies Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Recent Anomalies</CardTitle>
            <CardDescription>Recent agent executions that triggered warning flags.</CardDescription>
          </div>
          <Link href="/dashboard/conversations" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <span className="text-sm flex items-center">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="hidden md:table-cell">Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRecent.map((row) => (
                <TableRow 
                  key={row.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/dashboard/conversations/${row.id}`)}
                >
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell className="font-medium">{row.agent}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      row.score > 0.8 ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" :
                      row.score > 0.5 ? "text-amber-500 border-amber-500/20 bg-amber-500/10" :
                      "text-rose-500 border-rose-500/20 bg-rose-500/10"
                    )}>
                      {row.score.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.flags > 0 ? (
                      <div className="flex items-center gap-1.5 text-sm text-rose-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{row.flags} Flags</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {row.time}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/conversations/${row.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
