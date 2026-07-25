import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

_initialized = False


def init_tracer():
    global _initialized
    if _initialized:
        return trace.get_tracer("agent-nemesis")

    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    service = os.getenv("OTEL_SERVICE_NAME", "agent-nemesis-demo")

    resource = Resource({"service.name": service})
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    _initialized = True
    return trace.get_tracer("agent-nemesis")


def get_tracer():
    return trace.get_tracer("agent-nemesis")
