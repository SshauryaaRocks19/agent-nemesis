import json

ORDERS = {
    "ORD-001": {"status": "shipped", "item": "Wireless Headphones", "total": 79.99, "eta": "2 days"},
    "ORD-002": {"status": "delivered", "item": "USB-C Hub", "total": 34.50},
    "ORD-003": {"status": "processing", "item": "Mechanical Keyboard", "total": 129.00},
    "ORD-404": {"status": "not_found"},
}


def lookup_order(order_id: str) -> dict:
    order = ORDERS.get(order_id)
    if not order or order.get("status") == "not_found":
        return {"error": f"order {order_id} not found"}
    return {"order_id": order_id, **order}


TOOL_MAP = {
    "lookup_order": lookup_order,
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
]
