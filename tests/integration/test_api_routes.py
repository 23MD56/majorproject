import pytest
from httpx import ASGITransport, AsyncClient
from quantniti.api.app import create_app
from quantniti.data.cache import ParquetMarketCache
from quantniti.data.provider import MockDataProvider
from quantniti.data.service import MarketDataService


@pytest.fixture
def app(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    service = MarketDataService(provider=provider, cache=cache)
    return create_app(service=service)


@pytest.mark.asyncio
async def test_health_endpoint(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_get_universe_endpoint(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/market/universe")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 52  # 50 + 2 benchmarks
        symbols = [s["symbol"] for s in data]
        assert "RELIANCE" in symbols
        assert "^NSEI" in symbols


@pytest.mark.asyncio
async def test_get_universe_filtered_by_sector(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/market/universe?sector=Information Technology")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 4
        assert all(s["sector"] == "Information Technology" for s in data)


@pytest.mark.asyncio
async def test_get_history_endpoint(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/market/history?symbol=INFY&start_date=2025-01-01&end_date=2025-02-01")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "INFY"
        assert data["name"] == "Infosys Ltd."
        assert data["count"] > 0
        assert len(data["data"]) == data["count"]
        first_bar = data["data"][0]
        assert "open" in first_bar
        assert "close" in first_bar
        assert "volume" in first_bar
        assert "return_pct" in first_bar


@pytest.mark.asyncio
async def test_get_quote_endpoint(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/market/quote/TCS")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "TCS"
        assert data["current_price"] > 0
        assert data["sector"] == "Information Technology"


@pytest.mark.asyncio
async def test_get_returns_matrix_endpoint(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/market/returns?symbols=RELIANCE,TCS,INFY&start_date=2025-01-01&end_date=2025-02-01"
        )
        assert response.status_code == 200
        data = response.json()
        assert "RELIANCE" in data["symbols"]
        assert "TCS" in data["symbols"]
        assert "INFY" in data["symbols"]
        assert len(data["dates"]) > 0
        assert len(data["returns"]["RELIANCE"]) == len(data["dates"])


@pytest.mark.asyncio
async def test_sync_endpoint(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "symbols": ["RELIANCE", "INFY"],
            "start_date": "2025-01-01",
            "end_date": "2025-01-10",
        }
        response = await client.post("/api/market/sync", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["total_symbols"] == 2
        assert data["successful_symbols"] == 2
