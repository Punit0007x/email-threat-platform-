import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


def read_secret(name: str, default: str = "") -> str:
    """Read secret from Docker secrets directory or environment variable."""
    secret_path = Path(f"/run/secrets/{name}")
    if secret_path.exists():
        return secret_path.read_text().strip()
    env_var = name.upper().replace("-", "_")
    return os.getenv(env_var, default)


class Settings(BaseSettings):
    app_name: str = "Email Threat Intelligence Platform"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    secret_key: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    kafka_bootstrap_servers: str = "localhost:9092"

    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""

    database_url: str = "sqlite+aiosqlite:///./data/cases.db"
    redis_url: str = "redis://localhost:6379/0"

    chroma_persist_dir: str = "./data/chroma_db"

    maxmind_license_key: Optional[str] = None

    gemini_api_key: Optional[str] = None

    # Forensics Config
    protected_brands: List[str] = ["paypal.com", "microsoft.com", "apple.com", "amazon.com", "google.com"]
    trusted_relays: List[str] = ["google.com", "outlook.com", "sendgrid.net", "amazonses.com", "protection.outlook.com"]
    intel_feed_refresh_interval_seconds: int = 3600
    whois_timeout_seconds: float = 2.0
    dns_timeout_seconds: float = 2.0

    log_level: str = "INFO"
    log_format: str = "json"

    sentry_dsn: Optional[str] = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.secret_key = read_secret("secret_key", self.secret_key or "CHANGE_ME_IN_PRODUCTION_USE_STRONG_RANDOM_KEY")
        self.neo4j_password = read_secret("neo4j_password", self.neo4j_password or "CHANGE_ME_IN_PRODUCTION")
        self.gemini_api_key = read_secret("gemini_api_key", self.gemini_api_key)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()