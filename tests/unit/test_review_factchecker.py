"""Unit tests for Review Verification Tier 2 NLP Claim Extraction & Ground-Truth Fact-Checking (Ticket #21)."""

import pytest
from app.core.models import ReviewStatus, ReviewTargetType
from app.ml.reviews.tier2_factchecker import (
    extract_duration_claim,
    extract_return_claim,
    verify_tier2_fact_check,
)


def test_extract_return_claim():
    """Verify regex extraction of return percentages from natural text."""
    test_cases = [
        ("I saw +14% growth in my capital.", 14.0),
        ("Made about 12.8% return over the holding period.", 12.8),
        ("Portfolio is up by 8.5% so far.", 8.5),
        ("Experienced a -3.2% drawdown during correction.", -3.2),
        ("Gained 15 percent in the last quarter.", 15.0),
        ("Just a clean interface with clear trust cards.", None),
    ]
    for text, expected in test_cases:
        claimed = extract_return_claim(text)
        if expected is None:
            assert claimed is None, f"Expected None for: {text}"
        else:
            assert claimed is not None, f"Failed to extract for: {text}"
            assert pytest.approx(claimed, 0.1) == expected


def test_extract_duration_claim():
    """Verify regex extraction of duration horizons from natural text."""
    test_cases = [
        ("Held this basket for 6 months.", "6M"),
        ("Over 3 months of disciplined investing.", "3M"),
        ("Gained 5% in 1 month.", "1M"),
        ("Invested for 1 year so far.", "12M"),
        ("In just 1 week I saw results.", "1W"),
        ("Great visualizer!", None),
    ]
    for text, expected in test_cases:
        duration = extract_duration_claim(text)
        assert duration == expected, f"Failed for text: '{text}' (got {duration}, expected {expected})"


def test_tier2_approves_verified_claim_within_tolerance():
    """Verify review with claimed return within +-3% of ground truth is VERIFIED with badge."""
    text = "Great portfolio allocation, I made +14% over 6 months."
    # Ground truth actual return is 12.8% (|14.0 - 12.8| = 1.2% <= 3%)
    result = verify_tier2_fact_check(
        review_text=text,
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        actual_return_pct=12.8,
    )

    assert result.is_approved is True
    assert result.status == ReviewStatus.VERIFIED
    assert result.claimed_return_pct == 14.0
    assert result.actual_return_pct == 12.8
    assert pytest.approx(result.return_discrepancy_pct, 0.01) == 1.2
    assert "✅ Verified: Actual Return +12.8% vs Claimed +14.0%" in result.verification_badge


def test_tier2_rejects_exaggerated_return_claims():
    """Verify fraudulent/exaggerated claims (e.g. +50% in 1 week vs +1.5% actual) are REJECTED."""
    text = "I made +50% return in 1 week with this magic basket!"
    result = verify_tier2_fact_check(
        review_text=text,
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        actual_return_pct=1.5,
    )

    assert result.is_approved is False
    assert result.status == ReviewStatus.REJECTED
    assert result.claimed_return_pct == 50.0
    assert result.actual_return_pct == 1.5
    assert "exaggerated" in result.rejection_reason.lower() or "tolerance" in result.rejection_reason.lower()


def test_tier2_flags_borderline_discrepancy():
    """Verify claims with moderate discrepancy (3% < delta <= 8%) are FLAGGED with discrepancy note."""
    text = "Got about +18% return over the 6 months."
    # Ground truth is 12.0% (|18.0 - 12.0| = 6.0%, which is in the 3%-8% zone)
    result = verify_tier2_fact_check(
        review_text=text,
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        actual_return_pct=12.0,
    )

    assert result.is_approved is True
    assert result.status == ReviewStatus.FLAGGED
    assert "⚠️ Discrepancy Noted" in result.verification_badge


def test_tier2_approves_pure_qualitative_reviews():
    """Verify reviews with no numerical claims are APPROVED as qualitative reviews."""
    text = "The Trust Card and regime suitability indicators provide incredible peace of mind."
    result = verify_tier2_fact_check(
        review_text=text,
        target_type=ReviewTargetType.BASKET,
        target_id="balanced_6m",
        actual_return_pct=12.8,
    )

    assert result.is_approved is True
    assert result.status == ReviewStatus.APPROVED
    assert result.claimed_return_pct is None
    assert "Qualitative Review" in result.verification_badge
