export const KpiData = {
  totalConversations: 142,
  averageTrustScore: 0.84,
  totalFlags: 23,
  estimatedCostWasted: 14.50,
  activeAgents: 24,
};

export const TrustTrendData = [
  { date: "Jul 18", score: 0.92 },
  { date: "Jul 19", score: 0.88 },
  { date: "Jul 20", score: 0.95 },
  { date: "Jul 21", score: 0.81 },
  { date: "Jul 22", score: 0.72 },
  { date: "Jul 23", score: 0.65 },
  { date: "Jul 24", score: 0.85 },
  { date: "Jul 25", score: 0.84 },
];

export const FlagBreakdownData = [
  { name: "Loops", count: 8, fill: "var(--color-trust-warning)" },
  { name: "Unverified Claims", count: 12, fill: "var(--color-trust-flagged)" },
  { name: "Broken Promises", count: 3, fill: "var(--color-trust-flagged)" },
  { name: "Broken Handoffs", count: 0, fill: "var(--color-trust-warning)" },
];

export const RecentConversations = [
  { id: "trace-9f82a1", agent: "Customer Support Bot", score: 0.95, flags: 0, duration: "45s", cost: "$0.02", time: "10 mins ago" },
  { id: "trace-3b71c4", agent: "Sales Research Agent", score: 0.62, flags: 2, duration: "2m 12s", cost: "$0.15", time: "1 hr ago" },
  { id: "trace-e24a90", agent: "Data Analyst Copilot", score: 0.35, flags: 5, duration: "8m 40s", cost: "$1.20", time: "2 hrs ago" },
  { id: "trace-1a8c5f", agent: "Customer Support Bot", score: 1.0, flags: 0, duration: "12s", cost: "$0.01", time: "4 hrs ago" },
  { id: "trace-7d92e1", agent: "Sales Research Agent", score: 0.88, flags: 0, duration: "1m 05s", cost: "$0.08", time: "5 hrs ago" },
];
