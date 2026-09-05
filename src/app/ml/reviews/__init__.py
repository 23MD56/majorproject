"""AI Review Legitimacy Verification and Fact-Checking Engine (Ticket #21)."""

from app.ml.reviews.agent import ReviewVerificationAgent
from app.ml.reviews.service import ReviewService
from app.ml.reviews.tier1_filters import filter_tier1_content
from app.ml.reviews.tier2_factchecker import (
    extract_duration_claim,
    extract_return_claim,
    verify_tier2_fact_check,
)
from app.ml.reviews.tier3_llm import audit_tier3_llm

__all__ = [
    "ReviewVerificationAgent",
    "ReviewService",
    "filter_tier1_content",
    "extract_return_claim",
    "extract_duration_claim",
    "verify_tier2_fact_check",
    "audit_tier3_llm",
]
