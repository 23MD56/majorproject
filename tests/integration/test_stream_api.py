"""Integration tests for Server-Sent Events (SSE) /api/v1/stream/ticks endpoint (Ticket #20)."""

import asyncio
import json
import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.core.config import settings
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.data.streaming import MarketTickGenerator


@pytest.fixture
def app_instance(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    service = MarketDataService(provider=provider, cache=cache)
    tick_gen = MarketTickGenerator(market_service=service, mode="synthetic")
    app = create_app(service=service)
    app.state.tick_generator = tick_gen
    return app


@pytest.mark.asyncio
async def test_stream_ticks_endpoint_headers_and_event(app_instance):
    """Verify GET /api/v1/stream/ticks returns text/event-stream with valid tick event chunk."""
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(f"{settings.api_v1_prefix}/stream/ticks?interval=0.01&max_ticks=2")
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

        text = response.text
        assert "event: tick\n" in text
        assert "data: " in text

        # Parse first data line
        for line in text.split("\n"):
            if line.startswith("data: "):
                payload = json.loads(line[6:])
                assert "symbol" in payload
                assert "price" in payload
                assert "change" in payload
                assert "volume" in payload
                break


@pytest.mark.asyncio
async def test_stream_ticks_symbol_filter(app_instance):
    """Verify symbols query parameter filters the ticks in the stream."""
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/stream/ticks?symbols=TCS,INFY&interval=0.01&max_ticks=4")
        assert response.status_code == 200

        received_symbols = set()
        for line in response.text.split("\n"):
            if line.startswith("data: "):
                payload = json.loads(line[6:])
                if "symbol" in payload:
                    received_symbols.add(payload["symbol"])

        assert received_symbols.issubset({"TCS", "INFY"})
        assert len(received_symbols) > 0


@pytest.mark.asyncio
async def test_stream_ticks_alias_route(app_instance):
    """Verify /api/stream/ticks is also reachable."""
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/stream/ticks?interval=0.01&max_ticks=2")
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        assert "event: tick\n" in response.text
