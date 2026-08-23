import pytest
from httpx import ASGITransport, AsyncClient
from app.api.app import create_app
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.ml.regime.service import RegimeService


@pytest.fixture
def app(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    market_service = MarketDataService(provider=provider, cache=cache)
    regime_service = RegimeService(market_service=market_service)
    return create_app(service=market_service, regime_service=regime_service)


@pytest.mark.asyncio
async def test_get_current_regime_route(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/regime/current")
        assert response.status_code == 200
        data = response.json()
        assert "regime" in data
        assert "probabilities" in data
        assert "confidence" in data
        assert "metrics" in data
        total_p = data["probabilities"]["bull"] + data["probabilities"]["bear"] + data["probabilities"]["sideways"]
        assert pytest.approx(total_p, 1e-4) == 1.0


@pytest.mark.asyncio
async def test_get_regime_history_route(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/regime/history?start_date=2024-01-01&end_date=2024-06-01")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] > 0
        assert "regime_distribution" in data
        assert len(data["data"]) == data["count"]
        point = data["data"][0]
        assert "regime" in point
        assert "close_price" in point


@pytest.mark.asyncio
async def test_train_regime_model_route(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"start_date": "2023-01-01", "end_date": "2024-01-01"}
        response = await client.post("/api/regime/train", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["samples_trained"] > 50
        assert data["converged"] is True
