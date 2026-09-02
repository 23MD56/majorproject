"""Integration tests for Financial Literacy Microlearning REST API endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService


@pytest.fixture
def app(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    service = MarketDataService(provider=provider, cache=cache)
    return create_app(service=service)


@pytest.mark.asyncio
async def test_get_all_literacy_cards_v1(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/literacy/all")
        assert response.status_code == 200
        data = response.json()
        assert "cards" in data
        assert "total" in data
        assert data["total"] >= 30
        assert len(data["cards"]) == data["total"]
        assert "categories" in data
        assert set(data["categories"]) == {"basics", "regimes", "risk", "quant"}


@pytest.mark.asyncio
async def test_get_all_literacy_cards_category_filter(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/literacy/all?category=quant")
        assert response.status_code == 200
        data = response.json()
        assert len(data["cards"]) > 0
        assert all(c["category"] == "quant" for c in data["cards"])


@pytest.mark.asyncio
async def test_get_literacy_card_by_valid_key(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/literacy/hrp_diversification")
        assert response.status_code == 200
        data = response.json()
        assert data["key"] == "hrp_diversification"
        assert data["title"] == "Hierarchical Risk Parity (HRP)"
        assert "cricket" in data["analogy"].lower()
        assert data["category"] == "quant"
        assert "video" in data
        assert data["video"]["video_id"] == "hrp_explained"


@pytest.mark.asyncio
async def test_get_literacy_card_by_unknown_key_returns_404(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/literacy/non_existent_concept_xyz")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "non_existent_concept_xyz" in data["detail"]


@pytest.mark.asyncio
async def test_dual_routing_api_prefix(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check standard /api/literacy/all as well as /api/v1/literacy/all
        response = await client.get("/api/literacy/all")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 30

        # Check /api/literacy/{key}
        key_resp = await client.get("/api/literacy/compounding_sip")
        assert key_resp.status_code == 200
        assert key_resp.json()["key"] == "compounding_sip"
