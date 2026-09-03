"""Integration tests for GrowService (AI Portfolio Basket Recommendation Engine)."""

import pytest
from app.core.models import (
    BasketRecommendationResponse,
    MarketRegimeType,
    RiskPersona,
)
from app.data.service import MarketDataService
from app.ml.forecasting.service import ExploreService
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService


@pytest.fixture
def grow_service():
    """Construct a real GrowService instance with market, regime, and explore services."""
    market_svc = MarketDataService()
    regime_svc = RegimeService(market_service=market_svc)
    explore_svc = ExploreService(market_service=market_svc, regime_service=regime_svc)
    return GrowService(
        market_service=market_svc,
        regime_service=regime_svc,
        explore_service=explore_svc,
    )


def test_grow_service_recommend_basket_balanced(grow_service: GrowService):
    """GrowService generates valid basket recommendations for Balanced persona."""
    capital = 50000.0
    horizon = "6M"
    resp = grow_service.recommend_basket(
        capital=capital,
        horizon=horizon,
        risk_persona=RiskPersona.BALANCED,
    )

    assert isinstance(resp, BasketRecommendationResponse)
    assert resp.capital == capital
    assert resp.horizon == horizon
    assert resp.risk_persona == RiskPersona.BALANCED
    assert isinstance(resp.active_regime, MarketRegimeType)
    
    # Check Allocations
    assert len(resp.allocations) >= 4, "Basket must contain at least 4 diversified stocks"
    total_weight = sum(a.weight for a in resp.allocations)
    assert pytest.approx(total_weight, rel=1e-3) == 1.0
    
    # Check target amounts
    total_target_amount = sum(a.target_amount for a in resp.allocations)
    assert pytest.approx(total_target_amount, rel=1e-2) == capital

    # Check Discrete Integer Allocation & Cash Buffer (Ticket 08)
    assert resp.total_invested <= capital
    assert resp.unallocated_cash >= 0.0
    assert round(resp.total_invested + resp.unallocated_cash, 2) == round(capital, 2)
    assert resp.cash_buffer_pct >= 0.0
    for a in resp.allocations:
        assert isinstance(a.shares, int)
        assert a.shares >= 0
        assert a.allocated_amount == round(a.shares * a.current_price, 2)

    # Check 3-Tier Rupee Growth Scenarios
    projections = resp.growth_projections
    assert projections.pessimistic.expected_return_pct <= projections.base.expected_return_pct
    assert projections.base.expected_return_pct <= projections.optimistic.expected_return_pct
    assert projections.pessimistic.projected_value <= projections.base.projected_value
    assert projections.base.projected_value <= projections.optimistic.projected_value

    # Check 4-Pillar Trust Card
    trust_card = resp.trust_card
    assert trust_card.regime_context.regime == resp.active_regime
    assert trust_card.model_reliability.backtested_hit_rate_pct >= 70.0
    assert trust_card.drawdown_guardrail.max_drawdown_limit_pct <= 0.0
    assert trust_card.disintermediation_savings.estimated_annual_savings_rupees > 0.0

    # Check Side-by-Side Comparisons (Basket, NIFTY 50, 7% Bank FD)
    assert len(resp.benchmark_comparisons) == 3
    names = [c.name for c in resp.benchmark_comparisons]
    assert "AI Optimized Basket" in names
    assert "NIFTY 50 Benchmark" in names
    assert "7% Bank Fixed Deposit" in names


def test_grow_service_different_risk_personas(grow_service: GrowService):
    """Test Conservative and Aggressive personas generate valid constrained allocations."""
    cons_resp = grow_service.recommend_basket(
        capital=25000.0,
        horizon="3M",
        risk_persona=RiskPersona.CONSERVATIVE,
    )
    assert cons_resp.risk_persona == RiskPersona.CONSERVATIVE
    assert sum(a.weight for a in cons_resp.allocations) == pytest.approx(1.0, rel=1e-3)

    aggr_resp = grow_service.recommend_basket(
        capital=100000.0,
        horizon="12M",
        risk_persona=RiskPersona.AGGRESSIVE,
    )
    assert aggr_resp.risk_persona == RiskPersona.AGGRESSIVE
    assert sum(a.weight for a in aggr_resp.allocations) == pytest.approx(1.0, rel=1e-3)


def test_grow_service_invalid_inputs_raise_error(grow_service: GrowService):
    """Invalid capital or horizon must raise ValueError."""
    with pytest.raises(ValueError):
        grow_service.recommend_basket(capital=-100.0, horizon="6M", risk_persona=RiskPersona.BALANCED)

    with pytest.raises(ValueError):
        grow_service.recommend_basket(capital=50000.0, horizon="24M", risk_persona=RiskPersona.BALANCED)


def test_grow_service_esg_portfolio_score_and_persona(grow_service: GrowService):
    """Basket results include mathematically correct weighted ESG score, and ESG-Conscious persona tilts to high ESG stocks."""
    capital = 50000.0
    horizon = "6M"

    balanced_resp = grow_service.recommend_basket(
        capital=capital,
        horizon=horizon,
        risk_persona=RiskPersona.BALANCED,
    )
    esg_resp = grow_service.recommend_basket(
        capital=capital,
        horizon=horizon,
        risk_persona=RiskPersona.ESG_CONSCIOUS,
    )

    # 1. Verify ESG fields exist on allocations and response
    for a in balanced_resp.allocations:
        assert a.esg_composite is not None
        assert 0.0 <= a.esg_composite <= 100.0

    assert balanced_resp.portfolio_esg_score > 0.0
    assert balanced_resp.portfolio_esg_badge is not None
    assert "esg_environment" in balanced_resp.portfolio_esg_breakdown
    assert "esg_social" in balanced_resp.portfolio_esg_breakdown
    assert "esg_governance" in balanced_resp.portfolio_esg_breakdown

    # 2. Verify mathematical correctness: sum(w_i * ESG_i)
    expected_weighted_esg = sum(a.weight * a.esg_composite for a in balanced_resp.allocations)
    assert pytest.approx(balanced_resp.portfolio_esg_score, rel=1e-2) == expected_weighted_esg

    # 3. Verify ESG-Conscious persona produces weights that demonstrably favor high-ESG stocks
    assert esg_resp.risk_persona == RiskPersona.ESG_CONSCIOUS
    assert sum(a.weight for a in esg_resp.allocations) == pytest.approx(1.0, rel=1e-3)

    # Sum of weights of high-ESG stocks (>= 70) should be higher in ESG-Conscious vs Balanced
    high_esg_stocks_conscious = sum(a.weight for a in esg_resp.allocations if a.esg_composite >= 70.0)
    high_esg_stocks_balanced = sum(a.weight for a in balanced_resp.allocations if a.esg_composite >= 70.0)
    assert high_esg_stocks_conscious >= high_esg_stocks_balanced
    assert esg_resp.portfolio_esg_score >= balanced_resp.portfolio_esg_score
