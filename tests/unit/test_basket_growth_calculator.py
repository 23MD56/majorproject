"""Unit tests for Basket Growth, Drawdown & Trust Card Calculator."""

import pytest
from app.core.models import (
    HorizonForecastCone,
    MarketRegimeType,
    MultiHorizonGrowthForecast,
    RiskPersona,
)
from app.ml.portfolio.growth_calculator import (
    build_benchmark_comparisons,
    build_trust_card_pillars,
    calculate_basket_growth_projections,
)


@pytest.fixture
def mock_stock_forecasts():
    """Create deterministic forecast cones for test stocks."""
    def _create_forecast(sym: str, base_6m: float):
        cone = HorizonForecastCone(
            horizon="6M",
            days=180,
            pessimistic_pct=base_6m - 6.0,
            base_pct=base_6m,
            optimistic_pct=base_6m + 8.0,
            pessimistic_price=100.0 * (1 + (base_6m - 6.0) / 100),
            base_price=100.0 * (1 + base_6m / 100),
            optimistic_price=100.0 * (1 + (base_6m + 8.0) / 100),
        )
        return MultiHorizonGrowthForecast(
            symbol=sym,
            current_price=100.0,
            as_of_date="2026-08-23",
            m1=cone,
            m3=cone,
            m6=cone,
            m12=cone,
        )

    return {
        "RELIANCE": _create_forecast("RELIANCE", 14.0),
        "TCS": _create_forecast("TCS", 10.0),
        "HDFCBANK": _create_forecast("HDFCBANK", 12.0),
    }


def test_calculate_basket_growth_projections_monotonicity(mock_stock_forecasts):
    """Growth projections must satisfy Pessimistic <= Base <= Optimistic."""
    allocations = {"RELIANCE": 0.4, "TCS": 0.3, "HDFCBANK": 0.3}
    capital = 50000.0
    
    projections = calculate_basket_growth_projections(
        allocations=allocations,
        stock_forecasts=mock_stock_forecasts,
        capital=capital,
        horizon="6M",
        risk_persona=RiskPersona.BALANCED,
    )
    
    assert projections.capital == capital
    assert projections.horizon == "6M"
    
    # Monotonicity check
    assert projections.pessimistic.expected_return_pct <= projections.base.expected_return_pct
    assert projections.base.expected_return_pct <= projections.optimistic.expected_return_pct
    
    assert projections.pessimistic.projected_value <= projections.base.projected_value
    assert projections.base.projected_value <= projections.optimistic.projected_value
    
    # Rupee calculations accuracy
    expected_base_val = capital * (1 + projections.base.expected_return_pct / 100.0)
    assert pytest.approx(projections.base.projected_value, rel=1e-4) == expected_base_val
    assert pytest.approx(projections.base.projected_gain_rupees, rel=1e-4) == expected_base_val - capital
    
    # Drawdown must be negative or zero
    assert projections.max_stress_drawdown_pct <= 0.0
    assert projections.max_stress_drawdown_rupees <= 0.0


def test_build_trust_card_pillars(mock_stock_forecasts):
    """Trust Card must contain all 4 explainability pillars."""
    capital = 100000.0
    trust_card = build_trust_card_pillars(
        regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        regime_confidence=0.82,
        allocations={"RELIANCE": 0.5, "TCS": 0.5},
        capital=capital,
        horizon="6M",
        risk_persona=RiskPersona.BALANCED,
        stress_drawdown_pct=-6.5,
    )
    
    # Pillar 1: Regime Context
    assert trust_card.regime_context.regime == MarketRegimeType.LOW_VOLATILITY_BULL
    assert trust_card.regime_context.confidence == 0.82
    assert "Low-Volatility Bull" in trust_card.regime_context.summary
    
    # Pillar 2: Model Reliability / Hit Rate
    assert trust_card.model_reliability.backtested_hit_rate_pct >= 70.0
    assert trust_card.model_reliability.lookback_years >= 3
    
    # Pillar 3: Drawdown Guardrail
    assert trust_card.drawdown_guardrail.max_drawdown_limit_pct == -6.5
    assert trust_card.drawdown_guardrail.stress_loss_rupees == pytest.approx(-6500.0, rel=1e-4)
    
    # Pillar 4: Disintermediation Savings (0% commission vs 2.0% traditional wealth fee)
    assert trust_card.disintermediation_savings.commission_fee_pct == 0.0
    assert trust_card.disintermediation_savings.traditional_fee_pct >= 1.5
    assert trust_card.disintermediation_savings.estimated_annual_savings_rupees > 0.0


def test_build_benchmark_comparisons():
    """Benchmark comparisons must compare AI Basket, NIFTY 50, and 7% Bank FD."""
    capital = 50000.0
    horizon = "6M"
    comparisons = build_benchmark_comparisons(
        basket_base_return_pct=12.5,
        nifty_base_return_pct=7.5,
        capital=capital,
        horizon=horizon,
        stress_drawdown_pct=-5.5,
    )
    
    assert len(comparisons) == 3
    names = [c.name for c in comparisons]
    assert "AI Optimized Basket" in names
    assert "NIFTY 50 Benchmark" in names
    assert "7% Bank Fixed Deposit" in names
    
    # Check 7% FD exact return calculation (for 6M = ~3.5%)
    fd_comp = next(c for c in comparisons if "Fixed Deposit" in c.name)
    assert fd_comp.projected_return_pct == pytest.approx(3.5, rel=0.1)
    assert fd_comp.projected_value > capital
    assert fd_comp.projected_gain_rupees > 0.0
