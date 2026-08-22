from fastapi import FastAPI, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.analyze import router as analyze_router

app = FastAPI(
    title="Email Threat Intelligence Platform",
    description="Enterprise API for email forensics, AI/ML threat classification, relay tracing, and attribution.",
    version="1.0.0"
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the API endpoints
app.include_router(analyze_router)

@app.get("/")
async def root():
    """
    Landing page directing users to Swagger Docs and Frontend Dashboard.
    """
    return {
        "status": "online",
        "service": "Email Threat Intelligence & Forensic Platform",
        "version": "1.0.0",
        "endpoints": {
            "swagger_docs": "/docs",
            "redoc": "/redoc",
            "health": "/health",
            "analyze_email_post": "/api/parse (POST multipart/form-data with 'file')",
            "cases_get": "/api/cases",
            "campaigns_get": "/api/campaigns"
        },
        "frontend_dashboard": "http://localhost:5173"
    }

@app.get("/api/parse")
async def get_parse_info():
    """
    Friendly informational response for accidental browser GET requests to /api/parse.
    """
    return {
        "detail": "/api/parse requires a POST request with a multipart/form-data .eml file upload.",
        "usage": "To analyze an email interactively, open the frontend dashboard at http://localhost:5173 or test via Swagger docs at /docs",
        "curl_example": "curl -X POST http://localhost:8003/api/parse -F 'file=@sample.eml'"
    }

@app.get("/favicon.ico", include_in_schema=False)
@app.get("/apple-touch-icon.png", include_in_schema=False)
@app.get("/apple-touch-icon-precomposed.png", include_in_schema=False)
async def favicon():
    """Quietly handle browser icon requests."""
    return Response(status_code=204)

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the service is running.
    """
    return {"status": "ok", "message": "Email Threat Platform is running!"}

