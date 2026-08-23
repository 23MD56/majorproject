"""FastAPI Application Factory for QuantNiti."""

from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from quantniti.api.routes.health import router as health_router
from quantniti.api.routes.market import router as market_router
from quantniti.core.config import settings
from quantniti.data.service import MarketDataService


def create_app(service: Optional[MarketDataService] = None) -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title="QuantNiti Core API",
        description="AI-Driven Regime-Adaptive Portfolio & Stock Growth Intelligence Platform",
        version="0.1.0",
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Attach MarketDataService to state
    app.state.market_service = service or MarketDataService()

    # Register routers under prefix
    app.include_router(health_router, prefix=settings.api_v1_prefix)
    app.include_router(market_router, prefix=settings.api_v1_prefix)

    return app


# Default app instance for uvicorn
app = create_app()
