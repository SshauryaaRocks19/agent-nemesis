import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { analyzeConversation } from "@/lib/checker";
import { runMockDemo } from "@/lib/checker/mock-traces";

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
    // We will generate identical traces purely in Node.js for the live demo!
    let stdout = "";
    let conversationId = "";
    
    if (process.env.VERCEL) {
      console.log("Running in Vercel - executing Node OTel mocks instead of Python");
      conversationId = await runMockDemo(demoId);
      stdout = `[MOCK DEMO] conv_id=${conversationId}\nResponse: Demo ran on Vercel successfully.`;
    } else {
      const scriptPath = path.join(process.cwd(), "agents", "broken", fileName);
      // We execute the python script locally. It'll send traces to SigNoz.
      const result = await execAsync(`python3 ${scriptPath}`);
      stdout = result.stdout;
      
      // Extract conv_id from python stdout
      const match = stdout.match(/conv_id=([a-f0-9\-]+)/);
      if (match && match[1]) {
        conversationId = match[1];
      }
    }

    if (conversationId) {
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
