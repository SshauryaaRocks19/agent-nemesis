from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

# Import the individual demo scripts
# We assume this is run from the 'agents' directory so imports resolve correctly.
from broken.loop_demo import run as run_loop
from broken.unverified_claim_demo import run as run_claim
from broken.broken_promise_demo import run as run_promise
from broken.broken_handoff_demo import run as run_handoff

app = FastAPI(title="AgentNemesis Demo Backend")

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post("/run-demo/{demo_id}")
def run_demo(demo_id: str):
    try:
        if demo_id == "loop":
            conv_id = run_loop()
        elif demo_id == "claim":
            conv_id = run_claim()
        elif demo_id == "promise":
            conv_id = run_promise()
        elif demo_id == "handoff":
            conv_id = run_handoff()
        else:
            raise HTTPException(status_code=400, detail="Invalid demo ID")
            
        return {"success": True, "conv_id": conv_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
