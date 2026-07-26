import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { trace, context } from "@opentelemetry/api";
import { randomUUID } from "crypto";

let tracerProvider: NodeTracerProvider | null = null;

function getTracer() {
  if (!tracerProvider) {
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "https://ingest.us2.signoz.cloud:443";
    const headersStr = process.env.OTEL_EXPORTER_OTLP_HEADERS || "";
    const headers: Record<string, string> = {};
    if (headersStr) {
      const [key, val] = headersStr.split("=");
      if (key && val) headers[key.trim()] = val.trim();
    }

    tracerProvider = new NodeTracerProvider({
      resource: new Resource({
        "service.name": process.env.OTEL_SERVICE_NAME || "agent-nemesis-demo",
      }),
    });

    const exporter = new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
      headers,
    });

    tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter));
    tracerProvider.register();
  }
  return trace.getTracer("agent-nemesis");
}

export async function runMockDemo(demoId: string): Promise<string> {
  const tracer = getTracer();
  const convId = randomUUID();

  return new Promise((resolve) => {
    if (demoId === "loop") {
      tracer.startActiveSpan("support_bot.session", (rootSpan) => {
        rootSpan.setAttribute("gen_ai.conversation.id", convId);
        rootSpan.setAttribute("agentnemesis.agent_role", "support_bot");

        for (let i = 0; i < 4; i++) {
          const ts = tracer.startSpan("execute_tool");
          ts.setAttribute("gen_ai.conversation.id", convId);
          ts.setAttribute("agentnemesis.agent_role", "support_bot");
          ts.setAttribute("gen_ai.operation.name", "execute_tool");
          ts.setAttribute("gen_ai.tool.name", "lookup_order");
          ts.setAttribute("agentnemesis.tool.input", JSON.stringify({ order_id: "ORD-001" }));
          ts.setAttribute("agentnemesis.tool.output", JSON.stringify({ status: "shipped", order_id: "ORD-001" }));
          ts.end();

          const ls = tracer.startSpan("chat");
          ls.setAttribute("gen_ai.conversation.id", convId);
          ls.setAttribute("agentnemesis.agent_role", "support_bot");
          ls.setAttribute("gen_ai.operation.name", "chat");
          ls.setAttribute("gen_ai.system", "google_genai");
          ls.setAttribute("gen_ai.request.model", "gemini-2.5-flash");
          ls.setAttribute("gen_ai.usage.input_tokens", 120 + i * 40);
          ls.setAttribute("gen_ai.usage.output_tokens", 15);
          ls.addEvent("gen_ai.content.completion", { "content": `[loop iteration ${i+1}] let me check the order again` });
          ls.end();
        }

        const final = "I keep getting the same result. Your order ORD-001 is shipped.";
        const fr = tracer.startSpan("agent.final_response");
        fr.setAttribute("gen_ai.conversation.id", convId);
        fr.setAttribute("agentnemesis.agent_role", "support_bot");
        fr.setAttribute("agentnemesis.final_response.text", final);
        fr.end();

        rootSpan.end();
        setTimeout(() => resolve(convId), 100);
      });
    } else if (demoId === "claim") {
      tracer.startActiveSpan("support_bot.session", (rootSpan) => {
        rootSpan.setAttribute("gen_ai.conversation.id", convId);
        rootSpan.setAttribute("agentnemesis.agent_role", "support_bot");

        const FAKE_RESPONSE = "I've looked into your account and can confirm that a refund of $149.99 has been processed for order ORD-002. You should see it in 3-5 business days.";

        const ls = tracer.startSpan("chat");
        ls.setAttribute("gen_ai.conversation.id", convId);
        ls.setAttribute("agentnemesis.agent_role", "support_bot");
        ls.setAttribute("gen_ai.operation.name", "chat");
        ls.setAttribute("gen_ai.system", "google_genai");
        ls.setAttribute("gen_ai.request.model", "gemini-2.5-flash");
        ls.setAttribute("gen_ai.usage.input_tokens", 95);
        ls.setAttribute("gen_ai.usage.output_tokens", 48);
        ls.addEvent("gen_ai.content.completion", { "content": FAKE_RESPONSE });
        ls.end();

        const fr = tracer.startSpan("agent.final_response");
        fr.setAttribute("gen_ai.conversation.id", convId);
        fr.setAttribute("agentnemesis.agent_role", "support_bot");
        fr.setAttribute("agentnemesis.final_response.text", FAKE_RESPONSE);
        fr.end();

        rootSpan.end();
        setTimeout(() => resolve(convId), 100);
      });
    } else if (demoId === "promise") {
      tracer.startActiveSpan("support_bot.session", (rootSpan) => {
        rootSpan.setAttribute("gen_ai.conversation.id", convId);
        rootSpan.setAttribute("agentnemesis.agent_role", "support_bot");

        const PROMISE_RESPONSE = "I've gone ahead and processed your refund of $34.50 for order ORD-002. It'll appear in your account within 5 business days!";

        const ts = tracer.startSpan("execute_tool");
        ts.setAttribute("gen_ai.conversation.id", convId);
        ts.setAttribute("agentnemesis.agent_role", "support_bot");
        ts.setAttribute("gen_ai.operation.name", "execute_tool");
        ts.setAttribute("gen_ai.tool.name", "lookup_order");
        ts.setAttribute("agentnemesis.tool.input", JSON.stringify({ order_id: "ORD-002" }));
        ts.setAttribute("agentnemesis.tool.output", JSON.stringify({ status: "delivered" }));
        ts.end();

        const ls = tracer.startSpan("chat");
        ls.setAttribute("gen_ai.conversation.id", convId);
        ls.setAttribute("agentnemesis.agent_role", "support_bot");
        ls.setAttribute("gen_ai.operation.name", "chat");
        ls.setAttribute("gen_ai.system", "google_genai");
        ls.setAttribute("gen_ai.request.model", "gemini-2.5-flash");
        ls.setAttribute("gen_ai.usage.input_tokens", 180);
        ls.setAttribute("gen_ai.usage.output_tokens", 52);
        ls.addEvent("gen_ai.content.completion", { "content": PROMISE_RESPONSE });
        ls.end();

        const fr = tracer.startSpan("agent.final_response");
        fr.setAttribute("gen_ai.conversation.id", convId);
        fr.setAttribute("agentnemesis.agent_role", "support_bot");
        fr.setAttribute("agentnemesis.final_response.text", PROMISE_RESPONSE);
        fr.end();

        rootSpan.end();
        setTimeout(() => resolve(convId), 100);
      });
    } else if (demoId === "handoff") {
      tracer.startActiveSpan("pipeline_run", (rootSpan) => {
        rootSpan.setAttribute("gen_ai.conversation.id", convId);
        rootSpan.setAttribute("agentnemesis.agent_role", "pipeline");

        tracer.startActiveSpan("invoke_agent", (planner) => {
          planner.setAttribute("gen_ai.conversation.id", convId);
          planner.setAttribute("gen_ai.operation.name", "invoke_agent");
          planner.setAttribute("gen_ai.agent.name", "Planner");
          planner.setAttribute("agentnemesis.agent_role", "planner");
          planner.setAttribute("agentnemesis.handoff.input", JSON.stringify({ task: "Write an article about OpenTelemetry" }));
          
          const ls = tracer.startSpan("chat");
          ls.setAttribute("gen_ai.conversation.id", convId);
          ls.setAttribute("agentnemesis.agent_role", "planner");
          ls.setAttribute("gen_ai.operation.name", "chat");
          ls.end();
          
          planner.setAttribute("agentnemesis.handoff.output", JSON.stringify({ brief: "Research OpenTelemetry best practices" }));
          planner.end();
        });

        tracer.startActiveSpan("invoke_agent", (researcher) => {
          researcher.setAttribute("gen_ai.conversation.id", convId);
          researcher.setAttribute("gen_ai.operation.name", "invoke_agent");
          researcher.setAttribute("gen_ai.agent.name", "Researcher");
          researcher.setAttribute("agentnemesis.agent_role", "researcher");
          researcher.setAttribute("agentnemesis.handoff.input", JSON.stringify({ brief: "Tell me about the history of the Roman Empire" })); // Broken handoff
          
          const ls = tracer.startSpan("chat");
          ls.setAttribute("gen_ai.conversation.id", convId);
          ls.setAttribute("agentnemesis.agent_role", "researcher");
          ls.setAttribute("gen_ai.operation.name", "chat");
          ls.end();
          
          researcher.setAttribute("agentnemesis.handoff.output", JSON.stringify({ findings: "The Roman Empire was founded in 27 BC." }));
          researcher.end();
        });

        tracer.startActiveSpan("invoke_agent", (writer) => {
          writer.setAttribute("gen_ai.conversation.id", convId);
          writer.setAttribute("gen_ai.operation.name", "invoke_agent");
          writer.setAttribute("gen_ai.agent.name", "Writer");
          writer.setAttribute("agentnemesis.agent_role", "writer");
          writer.setAttribute("agentnemesis.handoff.input", JSON.stringify({ findings: "The Roman Empire was founded in 27 BC." }));
          
          const ls = tracer.startSpan("chat");
          ls.setAttribute("gen_ai.conversation.id", convId);
          ls.setAttribute("agentnemesis.agent_role", "writer");
          ls.setAttribute("gen_ai.operation.name", "chat");
          
          const fr = tracer.startSpan("agent.final_response");
          fr.setAttribute("gen_ai.conversation.id", convId);
          fr.setAttribute("agentnemesis.agent_role", "writer");
          fr.setAttribute("agentnemesis.final_response.text", "The Roman Empire was huge.");
          fr.end();

          ls.end();
          
          writer.setAttribute("agentnemesis.handoff.output", JSON.stringify({ article: "The Roman Empire was huge." }));
          writer.end();
        });

        rootSpan.end();
        setTimeout(() => resolve(convId), 100);
      });
    } else {
      resolve("");
    }
  }).then(async (id) => {
    // Force flush the exporter so spans are immediately sent
    if (tracerProvider) {
      await tracerProvider.forceFlush();
    }
    return id as string;
  });
}
