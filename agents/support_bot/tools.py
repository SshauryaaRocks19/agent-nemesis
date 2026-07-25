import json

# fake order db
ORDERS = {
    "ORD-001": {"status": "shipped", "item": "Wireless Headphones", "total": 79.99, "eta": "2 days"},
    "ORD-002": {"status": "delivered", "item": "USB-C Hub", "total": 34.50},
    "ORD-003": {"status": "processing", "item": "Mechanical Keyboard", "total": 129.00},
    "ORD-404": {"status": "not_found"},
}

REFUNDS = {}

KB = [
    {"id": "kb-1", "title": "Return Policy", "content": "Items can be returned within 30 days of delivery for a full refund. Items must be unused and in original packaging."},
    {"id": "kb-2", "title": "Shipping Info", "content": "Standard shipping takes 3-5 business days. Express shipping (2-day) is available for $9.99."},
    {"id": "kb-3", "title": "Warranty", "content": "All electronics come with a 1-year manufacturer warranty. Contact support@example.com for claims."},
    {"id": "kb-4", "title": "Payment Methods", "content": "We accept Visa, Mastercard, PayPal, and Apple Pay. No cash on delivery."},
]


def lookup_order(order_id: str) -> dict:
    order = ORDERS.get(order_id)
    if not order or order.get("status") == "not_found":
        return {"error": f"order {order_id} not found"}
    return {"order_id": order_id, **order}


def process_refund(order_id: str, amount: float) -> dict:
    order = ORDERS.get(order_id)
    if not order or order.get("status") == "not_found":
        return {"error": f"order {order_id} not found"}
    if order.get("status") == "processing":
        return {"error": "cannot refund — order still processing"}
    REFUNDS[order_id] = amount
    return {"success": True, "order_id": order_id, "refunded": amount}


def search_kb(query: str) -> dict:
    q = query.lower()
    matches = [a for a in KB if any(w in a["content"].lower() or w in a["title"].lower() for w in q.split())]
    if not matches:
        return {"results": [], "message": "no relevant articles found"}
    return {"results": [{"id": m["id"], "title": m["title"], "snippet": m["content"][:120]} for m in matches[:2]]}


TOOL_MAP = {
    "lookup_order": lookup_order,
    "process_refund": process_refund,
    "search_kb": search_kb,
}

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "lookup_order",
            "description": "Look up order status and details by order ID",
            "parameters": {
                "type": "object",
                "properties": {"order_id": {"type": "string", "description": "The order ID, e.g. ORD-001"}},
                "required": ["order_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "process_refund",
            "description": "Process a refund for an order",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string"},
                    "amount": {"type": "number", "description": "Amount to refund in USD"},
                },
                "required": ["order_id", "amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_kb",
            "description": "Search the knowledge base for policy or shipping information",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
]
