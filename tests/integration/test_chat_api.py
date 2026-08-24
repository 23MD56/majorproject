"""Integration tests for NitiBot Chat API endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.core.models import ChatMessageResponse, ChatStatusResponse
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.ml.assistant.service import NitiBotService


class MockGeminiAdapter:
    def __init__(self, reply_text: str = "Based on your Low-Volatility Bull regime, your portfolio has 25% Reliance."):
        self.reply_text = reply_text

    def generate(self, contents: list, system_instruction: str) -> str:
        return self.reply_text


@pytest.fixture
def configured_app(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    market_svc = MarketDataService(provider=provider, cache=cache)
    nitibot_svc = NitiBotService(
        api_key="test_api_key_123",
        client_adapter=MockGeminiAdapter(),
    )
    return create_app(service=market_svc, nitibot_service=nitibot_svc)


@pytest.fixture
def unconfigured_app(tmp_path, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    market_svc = MarketDataService(provider=provider, cache=cache)
    nitibot_svc = NitiBotService(api_key="", client_adapter=None)
    return create_app(service=market_svc, nitibot_service=nitibot_svc)


@pytest.mark.asyncio
async def test_chat_status_endpoint(configured_app):
    transport = ASGITransport(app=configured_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check both /api/chat/status and /api/v1/chat/status
        resp_v1 = await client.get("/api/v1/chat/status")
        assert resp_v1.status_code == 200
        data_v1 = resp_v1.json()
        assert data_v1["available"] is True
        assert data_v1["model"] == "gemini-2.5-flash"

        resp_api = await client.get("/api/chat/status")
        assert resp_api.status_code == 200
        assert resp_api.json()["available"] is True


@pytest.mark.asyncio
async def test_chat_status_endpoint_when_disabled(unconfigured_app):
    transport = ASGITransport(app=unconfigured_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/chat/status")
        assert response.status_code == 200
        data = response.json()
        assert data["available"] is False
        assert "GEMINI_API_KEY" in data["message"]


@pytest.mark.asyncio
async def test_chat_endpoint_success(configured_app):
    transport = ASGITransport(app=configured_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "message": "Explain my portfolio allocation",
            "context": {"custom_tag": "test"},
            "session_id": "session_integ_1",
        }
        # Test /api/v1/chat
        response = await client.post("/api/v1/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert "Low-Volatility Bull" in data["reply"]
        assert "sources" in data
        assert isinstance(data["sources"], list)
        assert data["session_id"] == "session_integ_1"

        # Test /api/chat alias
        resp_alias = await client.post("/api/chat", json=payload)
        assert resp_alias.status_code == 200


@pytest.mark.asyncio
async def test_chat_endpoint_graceful_degradation_503(unconfigured_app):
    transport = ASGITransport(app=unconfigured_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"message": "Explain my portfolio"}
        response = await client.post("/api/v1/chat", json=payload)
        assert response.status_code == 503
        data = response.json()
        assert "detail" in data
        assert "GEMINI_API_KEY" in data["detail"] or "unavailable" in data["detail"].lower()
