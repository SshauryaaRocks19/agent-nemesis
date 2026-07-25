import { fetchSpansForConversation } from "./signoz-client";
import { runAllChecks } from "./checks";
import { saveConversationResult, ConversationResult } from "./supabase-client";

export async function analyzeConversation(conversationId: string) {
  try {
    // 1. Fetch from SigNoz with retry logic to handle ingestion delay
    let rawSpans = [];
    let attempts = 0;
    while (attempts < 6) {
      rawSpans = await fetchSpansForConversation(conversationId);
      if (rawSpans && rawSpans.length > 0) break;
      attempts++;
      console.log(`No spans found for ${conversationId}, retrying... (${attempts}/6)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!rawSpans || rawSpans.length === 0) {
      console.log(`Failed to find spans for conversation ${conversationId} after retries.`);
      return null;
    }

    // Normalize v5 span shape: each item is {data: {...attributes, trace_id, ...}, timestamp}
    const spans = rawSpans.map((s: any) => ({
      ...(s.data || s),
      attributes: s.data?.attributes || s.attributes || {},
      traceID: s.data?.trace_id || s.traceID,
      timestamp: s.data?.timestamp || s.timestamp,
    }));

    // Determine agent type
    const isPipeline = spans.some((s: any) => s.attributes?.["gen_ai.agent.name"] === "Planner");
    const agentType = isPipeline ? "pipeline" : "support_bot";

    // 2. Run checks
    const flags = runAllChecks(spans);

    // 3. Compute trust score (1.0 = perfect, subtract 0.3 per flag)
    let trustScore = 1.0 - (flags.length * 0.3);
    if (trustScore < 0) trustScore = 0;

    // 4. Calculate rough cost based on token attributes
    let inputTokens = 0;
    let outputTokens = 0;
    spans.forEach((s: any) => {
      inputTokens += Number(s.attributes?.["gen_ai.usage.input_tokens"] || 0);
      outputTokens += Number(s.attributes?.["gen_ai.usage.output_tokens"] || 0);
    });
    // Rough estimate for gemini-2.5-flash ($0.075 per 1M input, $0.30 per 1M output)
    const tokenCostUsd = (inputTokens / 1_000_000 * 0.075) + (outputTokens / 1_000_000 * 0.30);

    const minTimestamp = Math.min(...spans.map((s: any) => s.timestamp));
    const maxTimestamp = Math.max(...spans.map((s: any) => s.timestamp));
    const durationMs = (maxTimestamp - minTimestamp) / 1000; // Assuming SigNoz timestamps are in microseconds

    // 5. Construct result
    const result: ConversationResult = {
      conversation_id: conversationId,
      trace_id: spans[0]?.traceID || null,
      agent_type: agentType,
      trust_score: trustScore,
      token_cost_usd: tokenCostUsd,
      flags,
      raw_span_count: spans.length,
      duration_ms: durationMs
    };

    // 6. Save to DB
    await saveConversationResult(result);

    return result;
  } catch (error) {
    console.error(`Error analyzing conversation ${conversationId}:`, error);
    throw error;
  }
}
