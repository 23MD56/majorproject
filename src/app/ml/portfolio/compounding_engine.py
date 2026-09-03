"""Compounding Visualizer & Wealth Growth Engine (Ticket #18).

Calculates long-horizon wealth accumulation trajectories, Geometric Brownian Motion (GBM)
quantile uncertainty cones, and the psychological Compounding Tipping Point.
"""

import math
from typing import Any, Dict, List, Optional

from app.core.models import (
    CompoundingMonthlyPoint,
    CompoundingRequest,
    CompoundingResponse,
    CompoundingSummary,
    CompoundingTippingPoint,
    CompoundingYearlyPoint,
)

# Standard Normal Quantiles
Z_10 = -1.2815515655446004  # 10th percentile (Pessimistic)
Z_50 = 0.0                  # 50th percentile (Median / Base Case)
Z_90 = 1.2815515655446004   # 90th percentile (Optimistic)
BANK_FD_ANNUAL_RATE = 0.07   # 7.0% Bank Fixed Deposit baseline


def calculate_monthly_sip(
    monthly_amount: float,
    annual_return_pct: float,
    tenure_years: int,
) -> CompoundingSummary:
    """Calculate future value of a regular monthly SIP using annuity due formula.
    
    Formula:
        i = r / 12
        n = years * 12
        FV = P * ((1 + i)^n - 1) / i * (1 + i)
    """
    p = float(monthly_amount)
    n = int(tenure_years) * 12

    if n <= 0:
        return CompoundingSummary(
            total_invested=0.0,
            future_value=0.0,
            wealth_gain=0.0,
            cagr_pct=annual_return_pct,
        )

    i = (annual_return_pct / 100.0) / 12.0
    total_invested = round(p * n, 2)

    if i <= 0.0:
        return CompoundingSummary(
            total_invested=total_invested,
            future_value=total_invested,
            wealth_gain=0.0,
            cagr_pct=annual_return_pct,
        )

    fv = p * (((1.0 + i) ** n - 1.0) / i) * (1.0 + i)
    fv_rounded = round(fv, 2)
    gain_rounded = round(fv_rounded - total_invested, 2)

    return CompoundingSummary(
        total_invested=total_invested,
        future_value=fv_rounded,
        wealth_gain=gain_rounded,
        cagr_pct=round(annual_return_pct, 2),
    )


def calculate_lump_sum(
    principal: float,
    annual_return_pct: float,
    tenure_years: int,
) -> CompoundingSummary:
    """Calculate future value of a one-time lump sum investment.
    
    Formula:
        FV = P0 * (1 + r)^t
    """
    p0 = float(principal)
    t = int(tenure_years)

    if p0 <= 0.0 or t <= 0:
        return CompoundingSummary(
            total_invested=round(p0, 2),
            future_value=round(p0, 2),
            wealth_gain=0.0,
            cagr_pct=round(annual_return_pct, 2),
        )

    r = annual_return_pct / 100.0
    fv = p0 * ((1.0 + r) ** t)
    fv_rounded = round(fv, 2)
    gain_rounded = round(fv_rounded - p0, 2)

    return CompoundingSummary(
        total_invested=round(p0, 2),
        future_value=fv_rounded,
        wealth_gain=gain_rounded,
        cagr_pct=round(annual_return_pct, 2),
    )


def calculate_step_up_sip(
    initial_monthly: float,
    annual_step_up_pct: float,
    annual_return_pct: float,
    tenure_years: int,
) -> CompoundingSummary:
    """Calculate future value of an annual Step-Up SIP.
    
    In year y (1-indexed), monthly deposit is P * (1 + g)^(y - 1).
    Compounded monthly at i = r / 12.
    """
    p0 = float(initial_monthly)
    g = annual_step_up_pct / 100.0
    i = (annual_return_pct / 100.0) / 12.0
    total_months = int(tenure_years) * 12

    if total_months <= 0 or p0 <= 0.0:
        return CompoundingSummary(
            total_invested=0.0,
            future_value=0.0,
            wealth_gain=0.0,
            cagr_pct=round(annual_return_pct, 2),
        )

    curr_value = 0.0
    total_invested = 0.0

    for m in range(1, total_months + 1):
        year_idx = (m - 1) // 12
        installment = p0 * ((1.0 + g) ** year_idx)
        total_invested += installment
        curr_value = (curr_value + installment) * (1.0 + i)

    total_invested = round(total_invested, 2)
    fv_rounded = round(curr_value, 2)
    gain_rounded = round(fv_rounded - total_invested, 2)

    return CompoundingSummary(
        total_invested=total_invested,
        future_value=fv_rounded,
        wealth_gain=gain_rounded,
        cagr_pct=round(annual_return_pct, 2),
    )


def compute_gbm_quantile_cones(
    initial_value: float,
    annual_drift: float,
    annual_vol: float,
    years: int = 10,
) -> List[Dict[str, float]]:
    """Compute Geometric Brownian Motion (GBM) quantile growth cones for horizons 1..years.
    
    Formula:
        V(t; Z) = V0 * exp((mu - 0.5 * sigma^2) * t + sigma * sqrt(t) * Z)
    """
    v0 = max(float(initial_value), 1000.0)
    mu = float(annual_drift)
    sigma = max(float(annual_vol), 0.01)

    points = []
    for y in range(1, years + 1):
        t = float(y)
        drift_term = (mu - 0.5 * (sigma ** 2)) * t
        diff_term = sigma * math.sqrt(t)

        pess_val = v0 * math.exp(drift_term + diff_term * Z_10)
        base_val = v0 * math.exp(drift_term + diff_term * Z_50)
        opt_val = v0 * math.exp(drift_term + diff_term * Z_90)

        points.append({
            "year": y,
            "pessimistic_10th": round(pess_val, 2),
            "base_50th": round(base_val, 2),
            "optimistic_90th": round(opt_val, 2),
        })

    return points


def find_compounding_tipping_point(
    monthly_trajectories: List[CompoundingMonthlyPoint],
    use_step_up: bool = False,
) -> CompoundingTippingPoint:
    """Find the exact month where total interest earned (wealth gain) surpasses cumulative principal invested."""
    for pt in monthly_trajectories:
        gain = pt.gain_step_up if use_step_up else pt.gain_sip
        invested = pt.invested_step_up if use_step_up else pt.invested_sip

        if gain > invested and invested > 0:
            pt.tipping_point_active = True
            year_val = round(pt.month / 12.0, 1)
            desc = (
                f"Compounding Tipping Point reached in Month {pt.month} (Year {year_val}): "
                f"Total wealth earnings (₹{gain:,.0f}) exceed your total invested capital (₹{invested:,.0f})!"
            )
            return CompoundingTippingPoint(
                is_reached=True,
                month=pt.month,
                year=year_val,
                description=desc,
            )

    return CompoundingTippingPoint(
        is_reached=False,
        month=None,
        year=None,
        description="Compounding Tipping Point occurs beyond the selected horizon. Increase tenure or expected return to cross the inflection point.",
    )


def generate_compounding_projection(request: CompoundingRequest) -> CompoundingResponse:
    """Generate complete long-horizon compounding wealth projection response."""
    tenure_years = max(min(int(request.tenure_years), 10), 1)
    monthly_sip = float(request.monthly_sip)
    initial_lump = float(request.initial_lump_sum)
    annual_return = float(request.expected_return_pct)
    step_up_pct = float(request.step_up_pct)
    annual_vol = float(request.annual_volatility_pct)

    # 1. Summaries
    lump_summary = calculate_lump_sum(
        principal=initial_lump,
        annual_return_pct=annual_return,
        tenure_years=tenure_years,
    )
    sip_summary = calculate_monthly_sip(
        monthly_amount=monthly_sip,
        annual_return_pct=annual_return,
        tenure_years=tenure_years,
    )
    step_up_summary = calculate_step_up_sip(
        initial_monthly=monthly_sip,
        annual_step_up_pct=step_up_pct,
        annual_return_pct=annual_return,
        tenure_years=tenure_years,
    )

    # 2. Monthly Trajectories (1 to tenure_years * 12)
    i = (annual_return / 100.0) / 12.0
    g = step_up_pct / 100.0
    total_months = tenure_years * 12

    monthly_pts: List[CompoundingMonthlyPoint] = []
    curr_sip_val = 0.0
    curr_step_val = 0.0
    cum_sip_inv = 0.0
    cum_step_inv = 0.0

    for m in range(1, total_months + 1):
        # Regular SIP
        cum_sip_inv += monthly_sip
        curr_sip_val = (curr_sip_val + monthly_sip) * (1.0 + i)

        # Step-Up SIP
        y_idx = (m - 1) // 12
        step_inst = monthly_sip * ((1.0 + g) ** y_idx)
        cum_step_inv += step_inst
        curr_step_val = (curr_step_val + step_inst) * (1.0 + i)

        gain_sip = curr_sip_val - cum_sip_inv
        gain_step = curr_step_val - cum_step_inv

        monthly_pts.append(
            CompoundingMonthlyPoint(
                month=m,
                year=round(m / 12.0, 2),
                invested_sip=round(cum_sip_inv, 2),
                value_sip=round(curr_sip_val, 2),
                invested_step_up=round(cum_step_inv, 2),
                value_step_up=round(curr_step_val, 2),
                gain_sip=round(gain_sip, 2),
                gain_step_up=round(gain_step, 2),
                tipping_point_active=False,
            )
        )

    # 3. Tipping Point Detection (default evaluates regular SIP, or step-up if configured)
    use_step = step_up_pct > 0.0
    tipping_point = find_compounding_tipping_point(monthly_pts, use_step_up=use_step)

    # 4. Yearly Trajectories & GBM Quantile Cones
    # Reference capital for GBM cone:
    # If initial lump sum > 0, use lump sum; else use 1-year total SIP capital (or 100,000 baseline)
    gbm_base_capital = initial_lump if initial_lump > 0.0 else max(monthly_sip * 12.0, 10000.0)
    drift = annual_return / 100.0
    vol = annual_vol / 100.0
    gbm_cones = compute_gbm_quantile_cones(
        initial_value=gbm_base_capital,
        annual_drift=drift,
        annual_vol=vol,
        years=tenure_years,
    )

    yearly_pts: List[CompoundingYearlyPoint] = []
    for y in range(1, tenure_years + 1):
        # Month index for end of year y
        end_m_idx = (y * 12) - 1
        m_pt = monthly_pts[end_m_idx]

        # Lump sum at year y
        lump_y = calculate_lump_sum(
            principal=initial_lump,
            annual_return_pct=annual_return,
            tenure_years=y,
        )

        # 7% Bank FD Hurdle at year y
        # Combines lump sum at 7% and SIP at 7%
        fd_lump_fv = initial_lump * ((1.0 + BANK_FD_ANNUAL_RATE) ** y)
        fd_i = BANK_FD_ANNUAL_RATE / 12.0
        fd_n = y * 12
        fd_sip_fv = monthly_sip * (((1.0 + fd_i) ** fd_n - 1.0) / fd_i) * (1.0 + fd_i) if monthly_sip > 0 else 0.0
        fd_val = round(fd_lump_fv + fd_sip_fv, 2)

        cone = gbm_cones[y - 1]

        yearly_pts.append(
            CompoundingYearlyPoint(
                year=y,
                invested_lump_sum=lump_y.total_invested,
                value_lump_sum=lump_y.future_value,
                invested_sip=m_pt.invested_sip,
                value_sip=m_pt.value_sip,
                invested_step_up=m_pt.invested_step_up,
                value_step_up=m_pt.value_step_up,
                bank_fd_value=fd_val,
                gbm_pessimistic_10th=cone["pessimistic_10th"],
                gbm_base_50th=cone["base_50th"],
                gbm_optimistic_90th=cone["optimistic_90th"],
            )
        )

    # 5. Bank FD Hurdle value at total tenure & Alpha vs FD
    final_yearly = yearly_pts[-1]
    final_portfolio_val = (
        final_yearly.value_lump_sum + (final_yearly.value_step_up if use_step else final_yearly.value_sip)
    )
    bank_fd_hurdle_value = final_yearly.bank_fd_value
    alpha_vs_bank_fd = round(final_portfolio_val - bank_fd_hurdle_value, 2)

    return CompoundingResponse(
        initial_lump_sum=initial_lump,
        monthly_sip=monthly_sip,
        tenure_years=tenure_years,
        expected_return_pct=annual_return,
        step_up_pct=step_up_pct,
        annual_volatility_pct=annual_vol,
        lump_sum_summary=lump_summary,
        regular_sip_summary=sip_summary,
        step_up_sip_summary=step_up_summary,
        tipping_point=tipping_point,
        yearly_trajectories=yearly_pts,
        monthly_trajectories=monthly_pts,
        bank_fd_hurdle_value=bank_fd_hurdle_value,
        alpha_vs_bank_fd=alpha_vs_bank_fd,
    )
