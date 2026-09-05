"""Integration tests for Reviews & Fact-Checking REST API endpoints (Ticket #21)."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.app import create_app
from app.core.config import settings
from app.core.models import ReviewStatus, ReviewTargetType
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.reviews_repo import ReviewRepository
from app.data.service import MarketDataService
from app.ml.reviews.agent import ReviewVerificationAgent
from app.ml.reviews.service import ReviewService


@pytest.fixture
def test_app(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    service = MarketDataService(provider=provider, cache=cache)
    db_path = tmp_path / "test_api_reviews.db"
    repo = ReviewRepository(database_url=f"sqlite:///{db_path}")
    agent = ReviewVerificationAgent(default_basket_return=12.8)
    review_svc = ReviewService(repository=repo, agent=agent)

    app = create_app(service=service)
    app.state.review_service = review_svc
    return app


@pytest.mark.asyncio
async def test_get_reviews_endpoint(test_app):
    """Verify GET /api/v1/reviews/{target_type}/{target_id} returns review list and summary."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(f"{settings.api_v1_prefix}/reviews/basket/balanced_6m")
        assert resp.status_code == 200
        data = resp.json()
        assert data["target_type"] == "basket"
        assert data["target_id"] == "balanced_6m"
        assert "summary" in data
        assert "reviews" in data
        assert data["summary"]["total_reviews"] >= 1
        assert "average_rating" in data["summary"]


@pytest.mark.asyncio
async def test_submit_verified_review(test_app):
    """Verify POST /api/v1/reviews/submit approves authentic return claim within tolerance."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "target_type": "basket",
            "target_id": "balanced_6m",
            "user_name": "Divya N.",
            "rating": 5,
            "review_text": "Great portfolio resilience! Gained +13.2% over 6 months with minimal volatility.",
        }
        resp = await client.post(f"{settings.api_v1_prefix}/reviews/submit", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_approved"] is True
        assert data["status"] == "VERIFIED"
        assert "✅ Verified" in data["verification_badge"]
        assert data["review"]["user_name"] == "Divya N."


@pytest.mark.asyncio
async def test_submit_exaggerated_review_rejected(test_app):
    """Verify POST /api/v1/reviews/submit rejects exaggerated return claim."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "target_type": "basket",
            "target_id": "balanced_6m",
            "user_name": "GetRichQuick",
            "rating": 5,
            "review_text": "I made +75% return in 2 weeks! Unstoppable algorithm!",
        }
        resp = await client.post(f"{settings.api_v1_prefix}/reviews/submit", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_approved"] is False
        assert data["status"] == "REJECTED"
        assert "exaggerated" in data["rejection_reason"].lower() or "tolerance" in data["rejection_reason"].lower()


@pytest.mark.asyncio
async def test_submit_prohibited_spam_rejected(test_app):
    """Verify POST /api/v1/reviews/submit blocks prohibited contact solicitations."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "target_type": "basket",
            "target_id": "balanced_6m",
            "user_name": "SpamBot",
            "rating": 1,
            "review_text": "Join our VIP WhatsApp group 9876543210 for daily stock tips!",
        }
        resp = await client.post(f"{settings.api_v1_prefix}/reviews/submit", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_approved"] is False
        assert data["status"] == "REJECTED"
        assert "contact" in data["rejection_reason"].lower() or "phone" in data["rejection_reason"].lower()
