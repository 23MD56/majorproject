"""ReviewService orchestrator (Ticket #21).

Manages review lifecycle, AI fact-checking verification,
and persistent relational storage.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid

from app.core.models import (
    ReviewItem,
    ReviewsListResponse,
    ReviewSubmissionRequest,
    ReviewSubmissionResponse,
    ReviewTargetType,
)
from app.data.reviews_repo import ReviewRepository
from app.ml.reviews.agent import ReviewVerificationAgent


class ReviewService:
    """Core domain service for User Reviews and AI Fact-Checking Moderation."""

    def __init__(
        self,
        repository: Optional[ReviewRepository] = None,
        agent: Optional[ReviewVerificationAgent] = None,
    ):
        self.repository = repository or ReviewRepository()
        self.agent = agent or ReviewVerificationAgent()

    def submit_review(self, request: ReviewSubmissionRequest) -> ReviewSubmissionResponse:
        """Process review submission through the 3-tier fact-checking agent."""
        verification = self.agent.verify_review(request)

        review_item = ReviewItem(
            id=f"rev-{uuid.uuid4().hex[:8]}",
            target_type=request.target_type,
            target_id=request.target_id,
            user_name=request.user_name,
            rating=request.rating,
            review_text=request.review_text,
            claimed_return_pct=verification.claimed_return_pct,
            claimed_duration=verification.claimed_duration,
            actual_return_pct=verification.actual_return_pct,
            return_discrepancy_pct=verification.return_discrepancy_pct,
            status=verification.status,
            verification_badge=verification.verification_badge,
            rejection_reason=verification.rejection_reason,
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        if verification.is_approved:
            self.repository.save_review(review_item)

        audit_dict = {
            "tier1_passed": verification.tier1_passed,
            "tier2_passed": verification.tier2_passed,
            "tier3_passed": verification.tier3_passed,
            "audit_notes": verification.audit_notes,
            "actual_return_pct": verification.actual_return_pct,
            "return_discrepancy_pct": verification.return_discrepancy_pct,
        }

        return ReviewSubmissionResponse(
            is_approved=verification.is_approved,
            status=verification.status,
            review=review_item if verification.is_approved else None,
            verification_badge=verification.verification_badge,
            rejection_reason=verification.rejection_reason,
            audit_details=audit_dict,
        )

    def get_reviews(self, target_type: ReviewTargetType, target_id: str) -> ReviewsListResponse:
        """Fetch approved community reviews and aggregate statistics for a target."""
        t_type = target_type.value if hasattr(target_type, "value") else str(target_type)
        reviews = self.repository.list_reviews(target_type=t_type, target_id=target_id)
        summary = self.repository.get_summary(target_type=t_type, target_id=target_id)

        return ReviewsListResponse(
            target_type=target_type,
            target_id=target_id,
            summary=summary,
            reviews=reviews,
        )
