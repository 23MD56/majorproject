"""Relational Database Repository for Reviews & Fact-Checking Audit Records (Ticket #21)."""

from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
import uuid

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.models import (
    ReviewItem,
    ReviewStatus,
    ReviewSummary,
    ReviewTargetType,
)
from app.data.storage import Base, ReviewRecord


class ReviewRepository:
    """SQLAlchemy persistence manager for User Reviews and AI Fact-Checking Audit Trails."""

    def __init__(self, database_url: Optional[str] = None):
        if not database_url:
            db_dir = Path(settings.data_dir)
            db_dir.mkdir(parents=True, exist_ok=True)
            db_path = db_dir / "quantniti.db"
            database_url = f"sqlite:///{db_path}"

        self.database_url = database_url
        self.engine = create_engine(
            self.database_url,
            connect_args={"check_same_thread": False} if "sqlite" in self.database_url else {},
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.seed_default_reviews_if_empty()

    def save_review(self, item: ReviewItem) -> ReviewItem:
        """Persist review item or audit log."""
        with self.SessionLocal() as session:
            record = ReviewRecord(
                id=item.id,
                target_type=item.target_type.value if hasattr(item.target_type, "value") else str(item.target_type),
                target_id=str(item.target_id),
                user_name=item.user_name,
                rating=item.rating,
                review_text=item.review_text,
                claimed_return_pct=item.claimed_return_pct,
                claimed_duration=item.claimed_duration,
                actual_return_pct=item.actual_return_pct,
                return_discrepancy_pct=item.return_discrepancy_pct,
                status=item.status.value if hasattr(item.status, "value") else str(item.status),
                verification_badge=item.verification_badge,
                rejection_reason=item.rejection_reason,
                created_at=item.created_at,
            )
            session.add(record)
            session.commit()
            return item

    def list_reviews(
        self,
        target_type: str,
        target_id: str,
        include_rejected: bool = False,
    ) -> List[ReviewItem]:
        """Retrieve reviews for a specific target basket/portfolio/strategy."""
        with self.SessionLocal() as session:
            stmt = select(ReviewRecord).where(
                ReviewRecord.target_type == target_type,
                ReviewRecord.target_id == target_id,
            )
            if not include_rejected:
                stmt = stmt.where(ReviewRecord.status != ReviewStatus.REJECTED.value)

            stmt = stmt.order_by(ReviewRecord.created_at.desc())
            records = session.execute(stmt).scalars().all()

            results: List[ReviewItem] = []
            for r in records:
                results.append(
                    ReviewItem(
                        id=r.id,
                        target_type=ReviewTargetType(r.target_type) if r.target_type in [e.value for e in ReviewTargetType] else ReviewTargetType.BASKET,
                        target_id=r.target_id,
                        user_name=r.user_name,
                        rating=r.rating,
                        review_text=r.review_text,
                        claimed_return_pct=r.claimed_return_pct,
                        claimed_duration=r.claimed_duration,
                        actual_return_pct=r.actual_return_pct,
                        return_discrepancy_pct=r.return_discrepancy_pct,
                        status=ReviewStatus(r.status) if r.status in [e.value for e in ReviewStatus] else ReviewStatus.APPROVED,
                        verification_badge=r.verification_badge,
                        rejection_reason=r.rejection_reason,
                        created_at=r.created_at,
                    )
                )
            return results

    def get_summary(self, target_type: str, target_id: str) -> ReviewSummary:
        """Calculate aggregate community rating summary and verified counts."""
        reviews = self.list_reviews(target_type=target_type, target_id=target_id, include_rejected=False)
        total = len(reviews)
        if total == 0:
            return ReviewSummary(
                average_rating=0.0,
                total_reviews=0,
                verified_reviews_count=0,
                rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            )

        avg_rating = round(sum(r.rating for r in reviews) / total, 1)
        verified_cnt = sum(1 for r in reviews if r.status == ReviewStatus.VERIFIED)
        dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r in reviews:
            r_int = max(1, min(5, int(r.rating)))
            dist[r_int] += 1

        return ReviewSummary(
            average_rating=avg_rating,
            total_reviews=total,
            verified_reviews_count=verified_cnt,
            rating_distribution=dist,
        )

    def seed_default_reviews_if_empty(self):
        """Seed representative verified and qualitative reviews for NIFTY basket preview."""
        with self.SessionLocal() as session:
            count = session.execute(select(ReviewRecord)).scalars().first()
            if count is not None:
                return

            seed_items = [
                ReviewRecord(
                    id="seed-rev-1",
                    target_type=ReviewTargetType.BASKET.value,
                    target_id="balanced_6m",
                    user_name="Aarav Sharma",
                    rating=5,
                    review_text="Disciplined allocation across defensive and quality large-caps. Gained +13.5% over 6 months with minimal drawdown during market chop.",
                    claimed_return_pct=13.5,
                    claimed_duration="6M",
                    actual_return_pct=12.8,
                    return_discrepancy_pct=0.7,
                    status=ReviewStatus.VERIFIED.value,
                    verification_badge="[✅ Verified: Actual Return +12.8% vs Claimed +13.5%]",
                    created_at="2026-08-28T10:15:00Z",
                ),
                ReviewRecord(
                    id="seed-rev-2",
                    target_type=ReviewTargetType.BASKET.value,
                    target_id="balanced_6m",
                    user_name="Meera Kapoor",
                    rating=5,
                    review_text="The Trust Card and stress drawdown limits gave me confidence to stay invested rather than panic selling during corrections.",
                    claimed_return_pct=None,
                    claimed_duration=None,
                    actual_return_pct=12.8,
                    return_discrepancy_pct=None,
                    status=ReviewStatus.APPROVED.value,
                    verification_badge="[ℹ️ Qualitative Review - Platform Experience]",
                    created_at="2026-08-30T14:22:00Z",
                ),
                ReviewRecord(
                    id="seed-rev-3",
                    target_type=ReviewTargetType.BASKET.value,
                    target_id="balanced_6m",
                    user_name="Rohan Varma",
                    rating=4,
                    review_text="Solid steady compounder. Recorded +18.2% over the 1 year holding horizon, very close to backtested projections.",
                    claimed_return_pct=18.2,
                    claimed_duration="12M",
                    actual_return_pct=19.5,
                    return_discrepancy_pct=1.3,
                    status=ReviewStatus.VERIFIED.value,
                    verification_badge="[✅ Verified: Actual Return +19.5% vs Claimed +18.2%]",
                    created_at="2026-09-02T09:40:00Z",
                ),
            ]
            for s in seed_items:
                session.add(s)
            session.commit()
