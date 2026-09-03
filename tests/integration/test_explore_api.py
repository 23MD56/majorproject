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


@pytest.mark.asyncio
async def test_get_ticker_esg_endpoint(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test both /api/v1/explore/{ticker}/esg and /api/explore/{ticker}/esg
        for prefix in ("/api/v1/explore", "/api/explore"):
            response = await client.get(f"{prefix}/INFY/esg")
            assert response.status_code == 200, f"Failed on prefix {prefix}"
            data = response.json()
            assert data["symbol"] == "INFY"
            assert data["name"] == "Infosys Ltd."
            assert data["sector"] == "Information Technology"
            assert data["esg_composite"] == 88.0
            assert data["esg_environment"] == 89.0
            assert data["esg_social"] == 87.0
            assert data["esg_governance"] == 88.0
            assert "🟢" in data["badge"]
            assert "BRSR" in data["source"]

        # Invalid ticker returns 404
        res_404 = await client.get("/api/v1/explore/INVALIDTICKER/esg")
        assert res_404.status_code == 404


@pytest.mark.asyncio
async def test_stock_profile_contains_esg(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/explore/profile/TCS")
        assert response.status_code == 200
        data = response.json()
        assert "esg" in data and data["esg"] is not None
        assert data["esg"]["symbol"] == "TCS"
        assert data["esg"]["esg_composite"] == 86.0
        assert "🟢" in data["esg"]["badge"]


@pytest.mark.asyncio
async def test_explore_stocks_contain_esg_fields(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/explore/stocks")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 50
        first = data[0]
        assert "esg_composite" in first and first["esg_composite"] is not None
        assert "esg_badge" in first and first["esg_badge"] is not None
