from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, generate_latest
from fastapi import Response
from app.core.config import get_settings

settings = get_settings()

REGISTRY = CollectorRegistry()

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
    registry=REGISTRY,
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
    registry=REGISTRY,
)

email_analyzed_total = Counter(
    "email_analyzed_total",
    "Total emails analyzed",
    ["verdict", "threat_type"],
    registry=REGISTRY,
)

fraud_score_histogram = Histogram(
    "fraud_score",
    "Fraud score distribution",
    buckets=(0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100),
    registry=REGISTRY,
)

active_cases_gauge = Gauge(
    "active_cases",
    "Number of active cases in database",
    registry=REGISTRY,
)

alert_gauge = Gauge(
    "alerts_total",
    "Total alerts generated",
    ["risk_level"],
    registry=REGISTRY,
)

kafka_messages_sent = Counter(
    "kafka_messages_sent_total",
    "Total Kafka messages sent",
    ["topic", "status"],
    registry=REGISTRY,
)

vector_db_operations = Counter(
    "vector_db_operations_total",
    "Vector DB operations",
    ["operation", "status"],
    registry=REGISTRY,
)

ml_model_predictions = Counter(
    "ml_model_predictions_total",
    "ML model predictions",
    ["model", "prediction"],
    registry=REGISTRY,
)

rate_limit_exceeded = Counter(
    "rate_limit_exceeded_total",
    "Rate limit exceeded count",
    ["endpoint"],
    registry=REGISTRY,
)


def metrics_endpoint() -> Response:
    return Response(
        content=generate_latest(REGISTRY),
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )


def record_http_request(method: str, endpoint: str, status_code: int, duration: float) -> None:
    http_requests_total.labels(method=method, endpoint=endpoint, status_code=str(status_code)).inc()
    http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)


def record_email_analysis(verdict: str, threat_type: str) -> None:
    email_analyzed_total.labels(verdict=verdict, threat_type=threat_type).inc()


def record_fraud_score(score: int) -> None:
    fraud_score_histogram.observe(score)


def record_alert(risk_level: str) -> None:
    alert_gauge.labels(risk_level=risk_level).inc()


def record_kafka_message(topic: str, success: bool) -> None:
    kafka_messages_sent.labels(topic=topic, status="success" if success else "failure").inc()


def record_vector_db_operation(operation: str, success: bool) -> None:
    vector_db_operations.labels(operation=operation, status="success" if success else "failure").inc()


def record_ml_prediction(model: str, prediction: str) -> None:
    ml_model_predictions.labels(model=model, prediction=prediction).inc()


def record_rate_limit_exceeded(endpoint: str) -> None:
    rate_limit_exceeded.labels(endpoint=endpoint).inc()