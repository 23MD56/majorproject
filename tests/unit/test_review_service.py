"""Unit tests for ReviewService and ReviewRepository (Ticket #21)."""

import pytest
from app.core.models import (
    ReviewStatus,
    ReviewSubmissionRequest,
    ReviewTargetType,
)
from app.data.reviews_repo import ReviewRepository
from app.ml.reviews.agent import ReviewVerificationAgent
from app.ml.reviews.service import ReviewService


@pytest.fixture
def review_service(tmp_path):
    db_path = tmp_path / "test_reviews.db"
    repo = ReviewRepository(database_url=f"sqlite:///{db_path}")
    agent = ReviewVerificationAgent(default_basket_return=12.8)
    return ReviewService(repository=repo, agent=agent)


def test_service_submits_and_stores_verified_review(review_service):
    """Verify approved review is persisted and retrievable via get_reviews."""
    req = ReviewSubmissionRequest(
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        user_name="Kavita Rao",
        rating=5,
        review_text="Steady gains: returned +13.0% over 6 months with great downside control.",
    )
    resp = review_service.submit_review(req)
    assert resp.is_approved is True
    assert resp.status == ReviewStatus.VERIFIED
    assert "✅ Verified" in resp.verification_badge

    # Check retrieval
    res_list = review_service.get_reviews(ReviewTargetType.BASKET, "balanced_6m")
    assert res_list.summary.total_reviews >= 1
    assert any(r.user_name == "Kavita Rao" for r in res_list.reviews)


def test_service_rejects_and_does_not_publish_exaggerated_review(review_service):
    """Verify exaggerated review is not published to community list."""
    initial_cnt = review_service.get_reviews(ReviewTargetType.BASKET, "balanced_6m").summary.total_reviews

    req = ReviewSubmissionRequest(
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        user_name="ScamGuy",
        rating=5,
        review_text="This basket made me +80% in 1 month! Buy now!",
    )
    resp = review_service.submit_review(req)
    assert resp.is_approved is False
    assert resp.status == ReviewStatus.REJECTED

    # Total published reviews count should NOT increase
    after_cnt = review_service.get_reviews(ReviewTargetType.BASKET, "balanced_6m").summary.total_reviews
    assert after_cnt == initial_cnt
