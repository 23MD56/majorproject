"""Unit tests for ReviewVerificationAgent full 3-tier pipeline (Ticket #21)."""

import pytest
from app.core.models import ReviewStatus, ReviewSubmissionRequest, ReviewTargetType
from app.ml.reviews.agent import ReviewVerificationAgent


@pytest.fixture
def agent():
    return ReviewVerificationAgent(default_basket_return=12.5)


def test_agent_approves_and_verifies_authentic_review(agent):
    """Verify authentic review within tolerance receives VERIFIED status and badge."""
    req = ReviewSubmissionRequest(
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        user_name="Aarav Sharma",
        rating=5,
        review_text="Disciplined allocation. Gained +13.5% over 6 months with minimal drawdown.",
    )
    res = agent.verify_review(req)
    assert res.is_approved is True
    assert res.status == ReviewStatus.VERIFIED
    assert "✅ Verified" in res.verification_badge
    assert res.tier1_passed is True
    assert res.tier2_passed is True


def test_agent_blocks_tier1_spam_immediately(agent):
    """Verify spam with phone number is blocked at Tier 1 before checking ground truth."""
    req = ReviewSubmissionRequest(
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        user_name="Spammer",
        rating=5,
        review_text="Call +91 9876543210 for guaranteed 50% returns every week!",
    )
    res = agent.verify_review(req)
    assert res.is_approved is False
    assert res.status == ReviewStatus.REJECTED
    assert res.tier1_passed is False
    assert "contact" in res.rejection_reason.lower() or "phone" in res.rejection_reason.lower()


def test_agent_rejects_exaggerated_returns_at_tier2(agent):
    """Verify exaggerated claims (+45% in 1 month vs 12.5% actual) are rejected at Tier 2."""
    req = ReviewSubmissionRequest(
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        user_name="MoonTrader",
        rating=5,
        review_text="This basket grew by +45% in just 1 month, unbelievable!",
    )
    res = agent.verify_review(req)
    assert res.is_approved is False
    assert res.status == ReviewStatus.REJECTED
    assert res.tier1_passed is True
    assert res.tier2_passed is False
    assert "exaggerated" in res.rejection_reason.lower() or "tolerance" in res.rejection_reason.lower()


def test_agent_approves_qualitative_review(agent):
    """Verify reviews discussing user experience without returns receive qualitative badge."""
    req = ReviewSubmissionRequest(
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        user_name="Priya Patel",
        rating=4,
        review_text="Really appreciate the transparency of the Trust Card and regime rebalancing alerts.",
    )
    res = agent.verify_review(req)
    assert res.is_approved is True
    assert res.status == ReviewStatus.APPROVED
    assert "Qualitative Review" in res.verification_badge
