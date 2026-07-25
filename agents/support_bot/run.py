import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env.local"))

from agents.support_bot.telemetry import init_tracer
from agents.support_bot.bot import run_conversation

if __name__ == "__main__":
    init_tracer()
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What's the status of order ORD-001?"
    result = run_conversation(query)
    print(f"\nConversation ID: {result['conv_id']}")
    print(f"Response: {result['response']}")
