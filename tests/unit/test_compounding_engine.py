"""Unit tests for Compounding Visualizer & Wealth Growth Engine (Ticket #18)."""

import pytest
import math

from app.ml.portfolio.compounding_engine import (
    calculate_lump_sum,
    calculate_monthly_sip,
    calculate_step_up_sip,
    compute_gbm_quantile_cones,
    find_compounding_tipping_point,
    generate_compounding_projection,
)
from app.core.models import CompoundingRequest


def test_monthly_sip_formula_mathematical_accuracy_12_pct():
    """SIP outputs must match standard financial formula within ₹1.00 tolerance.
    
    Benchmark:
    P = 5000, annual return = 12% (i = 0.01 per month), 10 years (120 months)
    Formula: FV = P * ((1 + i)^n - 1) / i * (1 + i)
    FV = 5000 * ((1.01)^120 - 1) / 0.01 * 1.01 = 1,161,695.38
    Invested = 5000 * 120 = 600,000.00
    Gain = 561,695.38
    """
    res = calculate_monthly_sip(monthly_amount=5000.0, annual_return_pct=12.0, tenure_years=10)
    
    expected_invested = 600000.0
    expected_fv = 1161695.38
    expected_gain = 561695.38

    assert abs(res.total_invested - expected_invested) <= 1.0
    assert abs(res.future_value - expected_fv) <= 1.0
    assert abs(res.wealth_gain - expected_gain) <= 1.0


def test_monthly_sip_formula_mathematical_accuracy_15_pct():
    """SIP outputs must match standard financial formula within ₹1.00 tolerance for 5 years at 15%."""
    res = calculate_monthly_sip(monthly_amount=10000.0, annual_return_pct=15.0, tenure_years=5)
    
    # i = 0.15 / 12 = 0.0125, n = 60
    # FV = 10000 * ((1.0125)^60 - 1) / 0.0125 * 1.0125 = 896,816.89
    expected_invested = 600000.0
    expected_fv = 896816.89
    expected_gain = 296816.89

    assert abs(res.total_invested - expected_invested) <= 1.0
    assert abs(res.future_value - expected_fv) <= 1.0
    assert abs(res.wealth_gain - expected_gain) <= 1.0


def test_lump_sum_compounding_accuracy():
    """Lump sum compounding matching P0 * (1 + r)^t within ₹1.00."""
    res = calculate_lump_sum(principal=100000.0, annual_return_pct=12.0, tenure_years=10)
    
    # 100000 * (1.12)^10 = 310,584.82
    expected_fv = 310584.82
    assert abs(res.future_value - expected_fv) <= 1.0
    assert abs(res.total_invested - 100000.0) <= 0.01
    assert abs(res.wealth_gain - (expected_fv - 100000.0)) <= 1.0


def test_step_up_sip_g10_produces_higher_wealth_and_matches_series():
    """Annual Step-Up SIP (g=10%) invests more each year and compounds strictly higher than regular SIP."""
    reg = calculate_monthly_sip(monthly_amount=5000.0, annual_return_pct=12.0, tenure_years=10)
    step = calculate_step_up_sip(
        initial_monthly=5000.0,
        annual_step_up_pct=10.0,
        annual_return_pct=12.0,
        tenure_years=10,
    )

    assert step.total_invested > reg.total_invested
    assert step.future_value > reg.future_value
    assert step.wealth_gain > reg.wealth_gain

    # Check analytical invested principal: sum_{y=0..9} 60000 * 1.1^y = 60000 * (1.1^10 - 1) / 0.1 = 956,245.48
    expected_step_invested = 956245.48
    assert abs(step.total_invested - expected_step_invested) <= 1.0


def test_compounding_tipping_point_exact_month():
    """Tipping point detects the exact first month where cumulative wealth gain exceeds invested principal."""
    # At 15% return and 10Y horizon, tipping point is reached within 120 months
    proj = generate_compounding_projection(
        CompoundingRequest(
            monthly_sip=5000.0,
            tenure_years=10,
            expected_return_pct=15.0,
            step_up_pct=0.0,
        )
    )
    tp = proj.tipping_point
    assert tp.is_reached is True
    assert tp.month is not None
    assert 1 <= tp.month <= 120
    
    # In month of tipping point, gain > invested
    month_idx = tp.month - 1
    point = proj.monthly_trajectories[month_idx]
    assert point.gain_sip > point.invested_sip

    if month_idx > 0:
        prev_point = proj.monthly_trajectories[month_idx - 1]
        assert prev_point.gain_sip <= prev_point.invested_sip


def test_gbm_quantile_growth_cones_monotonicity():
    """GBM quantile growth cones must satisfy 10th percentile <= 50th percentile <= 90th percentile."""
    cones = compute_gbm_quantile_cones(
        initial_value=100000.0,
        annual_drift=0.12,
        annual_vol=0.15,
        years=10,
    )
    assert len(cones) == 10

    for pt in cones:
        assert pt["year"] >= 1
        assert pt["pessimistic_10th"] <= pt["base_50th"]
        assert pt["base_50th"] <= pt["optimistic_90th"]
        # In a positive drift market with low vol, base is growing
        assert pt["base_50th"] > 100000.0


def test_full_compounding_projection_includes_bank_fd_hurdle():
    """Projection response includes 7% Bank Fixed Deposit comparison."""
    req = CompoundingRequest(
        initial_lump_sum=50000.0,
        monthly_sip=5000.0,
        tenure_years=5,
        expected_return_pct=12.0,
        step_up_pct=10.0,
    )
    res = generate_compounding_projection(req)

    assert res.tenure_years == 5
    assert res.bank_fd_hurdle_value > 50000.0
    # 12% expected return should generate positive alpha vs 7% Bank FD
    assert res.alpha_vs_bank_fd > 0.0
    assert len(res.yearly_trajectories) == 5
    assert len(res.monthly_trajectories) == 60
