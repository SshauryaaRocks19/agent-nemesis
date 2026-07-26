import { NextResponse } from "next/server";
import { analyzeConversation } from "@/lib/checker";

export async function POST(req: Request) {
  try {
    const { demoId } = await req.json();

    if (!["loop", "claim", "promise", "handoff"].includes(demoId)) {
      return NextResponse.json({ error: "Invalid demo ID" }, { status: 400 });
    }

    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
    
    // Call the Python FastAPI microservice
    const response = await fetch(`${backendUrl}/run-demo/${demoId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python backend error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const conversationId = data.conv_id;

    if (conversationId) {
      try {
        // Wait 4 seconds for SigNoz to index the traces before analyzing
        await new Promise(resolve => setTimeout(resolve, 4000));
        await analyzeConversation(conversationId);
      } catch (e) {
        console.error("Failed to trigger analyze:", e);
      }
    }

    return NextResponse.json({ success: true, output: `[DEMO] conv_id=${conversationId}\nExecution triggered via Python backend.` });
  } catch (error: any) {
    console.error("Failed to run demo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
