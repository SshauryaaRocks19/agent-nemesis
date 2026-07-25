import { NextResponse } from "next/server";
import { analyzeConversation } from "@/lib/checker";

export async function POST(req: Request) {
  try {
    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const result = await analyzeConversation(conversationId);

    if (!result) {
      return NextResponse.json({ error: "No telemetry found for this conversation ID" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
