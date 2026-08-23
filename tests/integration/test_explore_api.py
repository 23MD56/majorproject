import pytest
from httpx import ASGITransport, AsyncClient
from app.api.app import create_app
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.ml.forecasting.service import ExploreService
from app.ml.regime.service import RegimeService


@pytest.fixture
def app(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    market_service = MarketDataService(provider=provider, cache=cache)
    regime_service = RegimeService(market_service=market_service)
    explore_service = ExploreService(
        market_service=market_service, regime_service=regime_service
    )
    return create_app(
        service=market_service,
        regime_service=regime_service,
        explore_service=explore_service,
    )


@pytest.mark.asyncio
async def test_get_explore_stocks_route(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/explore/stocks")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 50
        first = data[0]
        assert "symbol" in first
        assert "growth_6m_base_pct" in first
        assert "regime_suitability_score" in first
        assert "regime_badge" in first


@pytest.mark.asyncio
async def test_get_explore_stocks_filtered(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/explore/stocks?sector=Financial Services")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 8
        assert all(s["sector"] == "Financial Services" for s in data)


@pytest.mark.asyncio
async def test_get_stock_profile_route(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/explore/profile/RELIANCE")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "RELIANCE"
        assert "forecast" in data
        assert "suitability" in data
        assert "factors" in data
        assert "benchmark_comparison" in data
        assert "peers" in data


@pytest.mark.asyncio
async def test_get_growth_forecast_route(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/explore/forecast/TCS")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "TCS"
        assert "m1" in data
        assert "m3" in data
        assert "m6" in data
        assert "m12" in data
        assert data["m6"]["pessimistic_pct"] <= data["m6"]["base_pct"] <= data["m6"]["optimistic_pct"]
