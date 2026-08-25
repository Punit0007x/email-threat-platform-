import structlog
import logging
import sys
from typing import Any, Dict
from app.core.config import get_settings

settings = get_settings()


def configure_logging() -> None:
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if settings.log_format == "json":
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]
    else:
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.error").handlers = []


def get_logger(name: str = None) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)


class RequestLogger:
    def __init__(self):
        self.logger = get_logger("request")

    def log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        client_ip: str,
        user_agent: str = None,
        user_id: str = None,
        **kwargs: Any,
    ) -> None:
        self.logger.info(
            "http_request",
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=duration_ms,
            client_ip=client_ip,
            user_agent=user_agent,
            user_id=user_id,
            **kwargs,
        )

    def log_error(
        self,
        method: str,
        path: str,
        error: Exception,
        client_ip: str,
        user_id: str = None,
        **kwargs: Any,
    ) -> None:
        self.logger.error(
            "http_error",
            method=method,
            path=path,
            error_type=type(error).__name__,
            error_message=str(error),
            client_ip=client_ip,
            user_id=user_id,
            **kwargs,
        )


request_logger = RequestLogger()