"""Integration tests for Grow and Basket Recommendation API routes."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.core.config import settings
from app.data.service import MarketDataService
from app.ml.forecasting.service import ExploreService
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService


@pytest.fixture
def app_instance():
    """Create FastAPI application with services attached."""
    market_svc = MarketDataService()
    regime_svc = RegimeService(market_service=market_svc)
    explore_svc = ExploreService(market_service=market_svc, regime_service=regime_svc)
    grow_svc = GrowService(
        market_service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
    )
    app = create_app(
        service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
        grow_service=grow_svc,
    )
    return app


@pytest.mark.asyncio
async def test_post_grow_recommend_success(app_instance):
    """POST /api/v1/grow/recommend returns 200 with complete recommendation schema."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        payload = {
            "capital": 50000.0,
            "horizon": "6M",
            "risk_persona": "Balanced",
        }
        response = await client.post(f"{settings.api_v1_prefix}/grow/recommend", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["capital"] == 50000.0
        assert data["horizon"] == "6M"
        assert data["risk_persona"] == "Balanced"
        assert len(data["allocations"]) >= 4
        assert "growth_projections" in data
        assert "trust_card" in data
        assert "benchmark_comparisons" in data
        assert len(data["benchmark_comparisons"]) == 3


@pytest.mark.asyncio
async def test_get_grow_recommend_success(app_instance):
    """GET /api/v1/grow/recommend with query parameters returns 200."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        response = await client.get(
            f"{settings.api_v1_prefix}/grow/recommend?capital=30000&horizon=3M&risk_persona=Conservative"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["capital"] == 30000.0
        assert data["horizon"] == "3M"
        assert data["risk_persona"] == "Conservative"


@pytest.mark.asyncio
async def test_post_baskets_recommend_alias(app_instance):
    """POST /api/v1/baskets/recommend alias route returns 200."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        payload = {
            "capital": 75000.0,
            "horizon": "12M",
            "risk_persona": "Aggressive",
        }
        response = await client.post(f"{settings.api_v1_prefix}/baskets/recommend", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["risk_persona"] == "Aggressive"


@pytest.mark.asyncio
async def test_grow_recommend_validation_errors(app_instance):
    """Invalid capital, horizon, or persona returns 422 Unprocessable Entity."""
    async with AsyncClient(
        transport=ASGITransport(app=app_instance),
        base_url="http://test",
    ) as client:
        # Invalid capital < 1000
        resp1 = await client.post(
            f"{settings.api_v1_prefix}/grow/recommend",
            json={"capital": 100.0, "horizon": "6M", "risk_persona": "Balanced"},
        )
        assert resp1.status_code == 422

        # Invalid horizon
        resp2 = await client.post(
            f"{settings.api_v1_prefix}/grow/recommend",
            json={"capital": 50000.0, "horizon": "5Y", "risk_persona": "Balanced"},
        )
        assert resp2.status_code == 422

        # Invalid persona
        resp3 = await client.post(
            f"{settings.api_v1_prefix}/grow/recommend",
            json={"capital": 50000.0, "horizon": "6M", "risk_persona": "Gambler"},
        )
        assert resp3.status_code == 422
