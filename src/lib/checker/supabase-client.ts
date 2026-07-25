import { createClient } from "@supabase/supabase-js";

// Uses the dashboard's environment variables (or local variables if run via script)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Throw a more helpful error early if environment variables are missing
if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase credentials missing. Checker will not save to DB.");
}

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type Flag = {
  type: "LOOP" | "UNVERIFIED_CLAIM" | "BROKEN_PROMISE" | "BROKEN_HANDOFF";
  severity: "HIGH" | "MEDIUM" | "LOW";
  evidence: any;
  span_ids: string[];
};

export type ConversationResult = {
  conversation_id: string;
  trace_id: string | null;
  agent_type: "support_bot" | "pipeline";
  trust_score: number;
  token_cost_usd: number;
  flags: Flag[];
  raw_span_count: number;
  duration_ms: number;
};

export async function saveConversationResult(result: ConversationResult) {
  if (!supabase) return;
  const { error } = await supabase.from("conversations").upsert({
    ...result,
    analyzed_at: new Date().toISOString(),
  }, { onConflict: "conversation_id" });

  if (error) {
    console.error("Failed to save to Supabase:", error);
    throw error;
  }
}

export async function getConversation(convId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("conversation_id", convId)
    .single();

  if (error) return null;
  return data;
}

export async function getRecentConversations(limit = 50) {
  console.log('SUPABASE URL:', !!supabaseUrl, 'SUPABASE KEY:', !!supabaseKey, 'CLIENT:', !!supabase);
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("analyzed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }
  return data;
}
