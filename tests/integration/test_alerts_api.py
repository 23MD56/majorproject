"""Integration tests for Smart Alerts and Web Push API routes (Ticket #20)."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.core.config import settings
from app.core.models import (
    AlertSeverity,
    MarketRegimeType,
    PortfolioState,
    PushSubscriptionKeys,
    PushSubscriptionRequest,
    RiskPersona,
    SmartAlert,
    SmartAlertType,
)
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.ml.alerts.service import AlertService


@pytest.fixture
def test_app(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    service = MarketDataService(provider=provider, cache=cache)
    alert_svc = AlertService()
    app = create_app(service=service)
    app.state.alert_service = alert_svc
    return app


@pytest.mark.asyncio
async def test_get_alerts_empty_and_populated(test_app):
    """Verify GET /api/v1/alerts retrieves active alerts."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Initially empty
        resp = await client.get(f"{settings.api_v1_prefix}/alerts")
        assert resp.status_code == 200
        data = resp.json()
        assert "alerts" in data
        assert data["total"] == 0
        assert data["unread_count"] == 0

        # Inject an alert into app.state.alert_service
        test_alert = SmartAlert(
            id="test-alert-1",
            type=SmartAlertType.REGIME_TRANSITION,
            severity=AlertSeverity.HIGH,
            title="Test Regime Shift",
            message="Shifted to Bear",
            timestamp="2026-09-03T12:00:00Z",
            read=False,
        )
        test_app.state.alert_service.add_alert(test_alert)

        # Retrieve populated alerts
        resp2 = await client.get(f"{settings.api_v1_prefix}/alerts")
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["total"] == 1
        assert data2["unread_count"] == 1
        assert data2["alerts"][0]["id"] == "test-alert-1"


@pytest.mark.asyncio
async def test_mark_alert_read_and_clear(test_app):
    """Verify PATCH /api/v1/alerts/{id}/read and DELETE /api/v1/alerts."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        test_alert = SmartAlert(
            id="test-alert-read",
            type=SmartAlertType.RSI_EXTREME,
            severity=AlertSeverity.MEDIUM,
            title="RSI Oversold",
            message="RSI < 28",
            timestamp="2026-09-03T12:00:00Z",
            read=False,
        )
        test_app.state.alert_service.add_alert(test_alert)

        # Mark read
        resp_read = await client.patch(f"{settings.api_v1_prefix}/alerts/test-alert-read/read")
        assert resp_read.status_code == 200

        # Verify unread_count is 0
        resp_check = await client.get(f"{settings.api_v1_prefix}/alerts")
        assert resp_check.json()["unread_count"] == 0

        # Clear alerts
        resp_del = await client.delete(f"{settings.api_v1_prefix}/alerts")
        assert resp_del.status_code == 200
        assert resp_del.json()["cleared"] == 1


@pytest.mark.asyncio
async def test_evaluate_endpoint(test_app):
    """Verify POST /api/v1/alerts/evaluate runs micro-batch evaluation."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(f"{settings.api_v1_prefix}/alerts/evaluate")
        assert resp.status_code == 200
        data = resp.json()
        assert "evaluated_at" in data
        assert "new_alerts_count" in data
        assert "alerts" in data


@pytest.mark.asyncio
async def test_web_push_subscription_and_vapid_key(test_app):
    """Verify VAPID public key and browser push subscription endpoints."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Get VAPID public key
        key_resp = await client.get(f"{settings.api_v1_prefix}/notifications/vapid-public-key")
        assert key_resp.status_code == 200
        key_data = key_resp.json()
        assert "public_key" in key_data
        assert len(key_data["public_key"]) > 20

        # 2. Subscribe endpoint
        sub_payload = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/sample-subscription-token",
            "keys": {
                "p256dh": "BDkJ42kLmN...",
                "auth": "AbC123XyZ...",
            },
            "user_id": "test_user_1",
        }
        sub_resp = await client.post(f"{settings.api_v1_prefix}/notifications/subscribe", json=sub_payload)
        assert sub_resp.status_code == 200
        assert sub_resp.json()["status"] == "subscribed"

        # 3. Test Push dispatch
        test_push = await client.post(f"{settings.api_v1_prefix}/notifications/test-push")
        assert test_push.status_code == 200
        assert test_push.json()["dispatched"] is True
