import sys
import asyncio
import time
from contextlib import asynccontextmanager

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, Request, Response, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger, request_logger
from app.core.metrics import (
    metrics_endpoint,
    record_http_request,
    record_email_analysis,
    record_fraud_score,
)
from app.core.rate_limit import setup_rate_limiting, get_limiter
from app.core.auth import (
    create_access_token,
    create_refresh_token,
    authenticate_user,
    get_current_active_user,
    User,
    Token,
    init_default_user,
)
from app.api.analyze import router as analyze_router
from app.api.advanced_soc import router as advanced_soc_router
from app.core.events import event_bus

settings = get_settings()

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("application_startup", version=settings.app_version, environment=settings.environment)
    init_default_user()

    from app.forensics.geo_intel import refresh_feeds_task
    import asyncio
    feed_task = asyncio.create_task(refresh_feeds_task(settings.intel_feed_refresh_interval_seconds))
    
    yield
    
    feed_task.cancel()
    logger.info("application_shutdown")
    event_bus.flush()


app = FastAPI(
    title="Email Threat Intelligence Platform",
    description="Enterprise API for email forensics, AI/ML threat classification, relay tracing, and attribution.",
    version=settings.app_version,
    lifespan=lifespan,
)

setup_rate_limiting(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    try:
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000

        request_logger.log_request(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            client_ip=client_ip,
            user_agent=user_agent,
        )

        record_http_request(request.method, request.url.path, response.status_code, duration_ms / 1000)

        response.headers["X-Request-ID"] = request.headers.get("X-Request-ID", "")
        return response
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        request_logger.log_error(
            method=request.method,
            path=request.url.path,
            error=e,
            client_ip=client_ip,
        )
        record_http_request(request.method, request.url.path, 500, duration_ms / 1000)
        raise


app.include_router(analyze_router)
app.include_router(advanced_soc_router)


@app.post("/api/auth/login", response_model=Token, tags=["Authentication"])
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        logger.warning("login_failed", username=form_data.username)
        return JSONResponse(
            status_code=401,
            content={"detail": "Incorrect username or password"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username, "scopes": user.scopes})
    refresh_token = create_refresh_token(data={"sub": user.username, "scopes": user.scopes})

    logger.info("login_success", username=user.username)
    return Token(access_token=access_token, refresh_token=refresh_token)


@app.post("/api/auth/refresh", response_model=Token, tags=["Authentication"])
async def refresh_token(refresh_token: str):
    from app.core.auth import decode_token, create_access_token, create_refresh_token, get_user
    from jose import JWTError

    try:
        payload = decode_token(refresh_token)
        if payload is None:
            raise JWTError("Invalid token type")
        user = get_user(__import__("app.core.auth", fromlist=["FAKE_USERS_DB"]).FAKE_USERS_DB, payload.username)
        if not user:
            raise JWTError("User not found")

        new_access = create_access_token(data={"sub": user.username, "scopes": user.scopes})
        new_refresh = create_refresh_token(data={"sub": user.username, "scopes": user.scopes})
        return Token(access_token=new_access, refresh_token=new_refresh)
    except JWTError:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid refresh token"},
        )


@app.get("/api/auth/me", response_model=User, tags=["Authentication"])
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@app.get("/metrics", tags=["Monitoring"])
async def prometheus_metrics():
    return metrics_endpoint()


@app.get("/", tags=["Root"])
async def root():
    return {
        "status": "online",
        "service": "Email Threat Intelligence & Forensic Platform",
        "version": settings.app_version,
        "environment": settings.environment,
        "endpoints": {
            "swagger_docs": "/docs",
            "redoc": "/redoc",
            "health": "/health",
            "metrics": "/metrics",
            "login": "/api/auth/login",
            "analyze_email_post": "/api/parse (POST multipart/form-data with 'file')",
            "cases_get": "/api/cases",
            "campaigns_get": "/api/campaigns",
            "alerts_get": "/api/alerts",
        },
        "frontend_dashboard": "http://localhost:5173",
    }


@app.get("/api/parse", tags=["Email Analysis"])
async def get_parse_info():
    return {
        "detail": "/api/parse requires a POST request with a multipart/form-data .eml file upload.",
        "usage": "To analyze an email interactively, open the frontend dashboard at http://localhost:5173 or test via Swagger docs at /docs",
        "curl_example": "curl -X POST http://localhost:8000/api/parse -F 'file=@sample.eml' -H 'Authorization: Bearer <token>'",
    }


@app.get("/favicon.ico", include_in_schema=False)
@app.get("/apple-touch-icon.png", include_in_schema=False)
@app.get("/apple-touch-icon-precomposed.png", include_in_schema=False)
async def favicon():
    return Response(status_code=204)


@app.get("/health", tags=["Monitoring"])
async def health_check():
    return {
        "status": "ok",
        "message": "Email Threat Platform is running!",
        "version": settings.app_version,
        "environment": settings.environment,
    }


@app.get("/health/ready", tags=["Monitoring"])
async def readiness_check():
    checks = {
        "database": "ok",
        "vector_db": "ok",
        "kafka": "ok" if event_bus.producer else "unavailable",
    }
    all_healthy = all(v == "ok" for v in checks.values())
    return {
        "status": "ready" if all_healthy else "degraded",
        "checks": checks,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_config=None,
    )