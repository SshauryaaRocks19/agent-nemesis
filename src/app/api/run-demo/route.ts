import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { analyzeConversation } from "@/lib/checker";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { demoId } = await req.json();

    const fileMap: Record<string, string> = {
      loop: "loop_demo.py",
      claim: "unverified_claim_demo.py",
      promise: "broken_promise_demo.py",
      handoff: "broken_handoff_demo.py",
    };

    const fileName = fileMap[demoId];
    if (!fileName) {
      return NextResponse.json({ error: "Invalid demo ID" }, { status: 400 });
    }

    // Vercel serverless environments do not have python installed by default
    if (process.env.VERCEL) {
      return NextResponse.json({ 
        error: "Vercel cloud environment cannot run Python. Please run the python scripts directly in your local terminal (e.g. `python3 agents/broken/loop_demo.py`) for the live demo." 
      }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "agents", "broken", fileName);
    
    // We execute the python script. It'll send traces to SigNoz.
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);
    
    // Extract conv_id from python stdout
    const match = stdout.match(/conv_id=([a-f0-9\-]+)/);
    if (match && match[1]) {
      const conversationId = match[1];
      try {
        // Wait 4 seconds for SigNoz to index the traces before analyzing
        await new Promise(resolve => setTimeout(resolve, 4000));
        await analyzeConversation(conversationId);
      } catch (e) {
        console.error("Failed to trigger analyze:", e);
      }
    }

    return NextResponse.json({ success: true, output: stdout });
  } catch (error: any) {
    console.error("Failed to run demo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
