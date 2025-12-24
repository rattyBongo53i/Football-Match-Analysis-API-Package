from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from typing import Dict, Any

from app.core.config import settings
from app.utils.logger import setup_logging
from app.api.endpoints import analysis, health, validation
from app.api.middleware import RequestLoggingMiddleware

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager for startup/shutdown events"""
    # Startup
    logger.info("Starting Football Analysis API")
    
    # Load ML models
    from app.ml_models.predictor import load_models
    await load_models()
    
    yield
    
    # Shutdown
    logger.info("Shutting down Football Analysis API")

def create_application() -> FastAPI:
    """Create and configure FastAPI application"""
    app = FastAPI(
        title="Football Match Analysis API",
        description="Intelligent football match prediction and slip generation system",
        version="1.0.0",
        lifespan=lifespan,
    )
    
    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)
    
    # Include routers
    app.include_router(health.router, prefix="/api", tags=["Health"])
    app.include_router(validation.router, prefix="/api", tags=["Validation"])
    app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
    
    return app

app = create_application()

@app.get("/")
async def root():
    return {
        "service": "Football Match Analysis API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/api/health",
            "validate": "/api/validate",
            "analyze": "/api/analyze",
        }
    }