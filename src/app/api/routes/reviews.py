"""REST API routes for AI Review Verification and Testimonials (Ticket #21)."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Request

from app.core.models import (
    ReviewsListResponse,
    ReviewSubmissionRequest,
    ReviewSubmissionResponse,
    ReviewTargetType,
    ReviewVerificationResult,
)
from app.ml.reviews.service import ReviewService

router = APIRouter(prefix="/reviews", tags=["Reviews & Testimonials"])


def get_review_service(request: Request) -> ReviewService:
    """Retrieve or lazily initialize ReviewService from application state."""
    if hasattr(request.app.state, "review_service") and request.app.state.review_service is not None:
        return request.app.state.review_service

    service = ReviewService()
    request.app.state.review_service = service
    return service


@router.post("/submit", response_model=ReviewSubmissionResponse)
def submit_review(payload: ReviewSubmissionRequest, request: Request):
    """Submit a user review for automated 3-tier AI fact-checking and publication."""
    service = get_review_service(request)
    return service.submit_review(payload)


@router.get("/{target_type}/{target_id}", response_model=ReviewsListResponse)
def get_target_reviews(
    target_type: str = Path(..., description="Target type: basket, portfolio, strategy, or platform"),
    target_id: str = Path(..., description="Target identifier (e.g. balanced_6m, port-123)"),
    request: Request = None,
):
    """Retrieve approved community reviews and rating summary for a specific target."""
    service = get_review_service(request)
    try:
        t_enum = ReviewTargetType(target_type)
    except ValueError:
        t_enum = ReviewTargetType.BASKET

    return service.get_reviews(target_type=t_enum, target_id=target_id)


@router.post("/verify-preview", response_model=ReviewVerificationResult)
def preview_verification(payload: ReviewSubmissionRequest, request: Request):
    """Run real-time fact-checking audit without persisting the review."""
    service = get_review_service(request)
    return service.agent.verify_review(payload)
