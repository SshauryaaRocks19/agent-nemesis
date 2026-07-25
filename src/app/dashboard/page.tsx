"use client";

import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell } from "recharts";
import { KpiData, TrustTrendData, FlagBreakdownData, RecentConversations } from "@/lib/mock-data";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

const STAGGER = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function DashboardOverview() {
  return (
    <motion.div 
      className="space-y-8 pb-12"
      initial="hidden"
      animate="show"
      variants={STAGGER}
    >
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">High-level metrics for all monitored agents.</p>
        </div>
      </div>

      {/* KPI Row */}
      <motion.div variants={FADE_UP} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Conversations", value: KpiData.totalConversations.toLocaleString() },
          { label: "Avg Trust Score", value: KpiData.averageTrustScore.toFixed(2), isScore: true },
          { label: "Total Flags", value: KpiData.totalFlags.toLocaleString() },
          { label: "Est. Cost Wasted", value: `$${KpiData.estimatedCostWasted.toFixed(2)}` }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-lg border border-border bg-card flex flex-col justify-between">
            <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            <span className={cn(
              "text-3xl font-mono mt-2", 
              stat.isScore && Number(stat.value) > 0.8 ? "text-trust-healthy" : 
              stat.isScore && Number(stat.value) > 0.5 ? "text-trust-warning" : 
              stat.isScore ? "text-trust-flagged" : "text-foreground"
            )}>
              {stat.value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={FADE_UP} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Trust Score Trend</h3>
          </div>
          <div className="h-[300px] w-full border border-border rounded-lg bg-card p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TrustTrendData}>
                <XAxis dataKey="date" stroke="#888884" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888884" fontSize={12} tickLine={false} axisLine={false} domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', borderColor: 'rgba(255,255,255,0.07)', borderRadius: '8px' }}
                  itemStyle={{ color: '#F2F2F0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#F2F2F0" 
                  strokeWidth={2} 
                  dot={{ fill: '#0B0B0B', stroke: '#F2F2F0', strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: '#4ADE80', stroke: '#0B0B0B' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Flag Breakdown</h3>
          </div>
          <div className="h-[300px] w-full border border-border rounded-lg bg-card p-4 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FlagBreakdownData} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} stroke="#888884" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#111111', borderColor: 'rgba(255,255,255,0.07)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {FlagBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Recent Conversations Table */}
      <motion.div variants={FADE_UP} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Recent Anomalies</h3>
          <Link href="/dashboard/conversations" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center transition-colors">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 border-b border-border/40">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Agent</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Trust Score</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Flags</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {RecentConversations.map((row) => (
                <tr key={row.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                  <td className="px-4 py-3">{row.agent}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium",
                      row.score > 0.8 ? "bg-trust-healthy/10 text-trust-healthy" :
                      row.score > 0.5 ? "bg-trust-warning/10 text-trust-warning" :
                      "bg-trust-flagged/10 text-trust-flagged"
                    )}>
                      {row.score.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.flags > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-trust-flagged/10 text-trust-flagged">
                        {row.flags} Flags
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.time}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/conversations/${row.id}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
