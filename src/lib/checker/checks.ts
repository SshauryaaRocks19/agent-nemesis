import { Flag } from "./supabase-client";

export function detectLoops(spans: any[]): Flag | null {
  const toolSpans = spans
    .filter(s => s.name === "execute_tool" && s.attributes?.["gen_ai.tool.name"])
    .sort((a, b) => a.timestamp - b.timestamp);

  let consecutiveCount = 1;
  let lastTool = null;
  let lastInput = null;

  for (const span of toolSpans) {
    const toolName = span.attributes["gen_ai.tool.name"];
    const toolInput = span.attributes["agentnemesis.tool.input"];
    
    if (toolName === lastTool && toolInput === lastInput) {
      consecutiveCount++;
      if (consecutiveCount >= 3) {
        return {
          type: "LOOP",
          severity: "HIGH",
          evidence: { tool: toolName, input: toolInput, count: consecutiveCount },
          span_ids: [span.spanID || ""]
        };
      }
    } else {
      consecutiveCount = 1;
      lastTool = toolName;
      lastInput = toolInput;
    }
  }

  return null;
}

export function detectUnverifiedClaims(spans: any[]): Flag | null {
  const finalResponse = spans.find(s => s.name === "agent.final_response");
  if (!finalResponse) return null;
  
  const text = finalResponse.attributes?.["agentnemesis.final_response.text"] || "";
  
  const toolOutputs = spans
    .filter(s => s.name === "execute_tool" && s.attributes?.["agentnemesis.tool.output"])
    .map(s => s.attributes["agentnemesis.tool.output"])
    .join(" ");

  // If they claim a specific dollar amount or refund status, but the tools never returned that amount
  const dollarMatch = text.match(/\$\d+(\.\d{2})?/);
  if (dollarMatch) {
    const amount = dollarMatch[0].replace("$", "");
    if (!toolOutputs.includes(amount)) {
      return {
        type: "UNVERIFIED_CLAIM",
        severity: "HIGH",
        evidence: { claim: `Claimed amount ${dollarMatch[0]}`, supported_by_tools: false },
        span_ids: [finalResponse.spanID || ""]
      };
    }
  }

  return null;
}

export function detectBrokenPromises(spans: any[]): Flag | null {
  const finalResponse = spans.find(s => s.name === "agent.final_response");
  if (!finalResponse) return null;
  
  const text = finalResponse.attributes?.["agentnemesis.final_response.text"] || "";
  
  const toolNames = spans
    .filter(s => s.name === "execute_tool")
    .map(s => s.attributes?.["gen_ai.tool.name"]);

  // If they say they processed a refund but didn't call the process_refund tool
  if (text.toLowerCase().includes("refund") && text.toLowerCase().includes("processed") && !toolNames.includes("process_refund")) {
    return {
      type: "BROKEN_PROMISE",
      severity: "HIGH",
      evidence: { claim: "processed a refund", expected_tool: "process_refund", actually_called: false },
      span_ids: [finalResponse.spanID || ""]
    };
  }

  return null;
}

export function detectBrokenHandoffs(spans: any[]): Flag | null {
  const agentSpans = spans
    .filter(s => s.name === "invoke_agent")
    .sort((a, b) => a.timestamp - b.timestamp);

  if (agentSpans.length < 2) return null;

  for (let i = 0; i < agentSpans.length - 1; i++) {
    const fromAgent = agentSpans[i];
    const toAgent = agentSpans[i + 1];

    const outTopic = fromAgent.attributes?.["agentnemesis.handoff.output"];
    const inTopic = toAgent.attributes?.["agentnemesis.handoff.input"];

    if (outTopic && inTopic) {
      try {
        const outData = JSON.parse(outTopic);
        const inData = JSON.parse(inTopic);
        
        // In our pipeline, Planner outputs {"brief": "..."} and Researcher expects {"brief": "..."}
        // If the brief strings don't match, it's a broken handoff.
        if (outData.brief && inData.brief && outData.brief !== inData.brief) {
           return {
            type: "BROKEN_HANDOFF",
            severity: "HIGH",
            evidence: { from: fromAgent.attributes["gen_ai.agent.name"], to: toAgent.attributes["gen_ai.agent.name"], drift: "Context mismatch between agents" },
            span_ids: [toAgent.spanID || ""]
          };
        }
      } catch (e) {
        // Not JSON or parse error, ignore
      }
    }
  }

  return null;
}

export function runAllChecks(spans: any[]): Flag[] {
  const flags: Flag[] = [];
  
  const loop = detectLoops(spans);
  if (loop) flags.push(loop);

  const claim = detectUnverifiedClaims(spans);
  if (claim) flags.push(claim);

  const promise = detectBrokenPromises(spans);
  if (promise) flags.push(promise);

  const handoff = detectBrokenHandoffs(spans);
  if (handoff) flags.push(handoff);

  return flags;
}
