"""Virtual Paper Portfolio Simulator and Mark-to-Market Valuation Engine."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from app.core.models import (
    BenchmarkComparisonLive,
    MarketRegimeType,
    PortfolioHolding,
    PortfolioState,
    RiskPersona,
)
from app.ml.portfolio.allocation import DiscreteAllocationEngine


def create_portfolio_from_allocations(
    name: str,
    capital: float,
    allocations: List[Dict[str, Any]],
    risk_persona: RiskPersona = RiskPersona.BALANCED,
    horizon: str = "6M",
    active_regime: MarketRegimeType = MarketRegimeType.LOW_VOLATILITY_BULL,
    as_of_date: Optional[str] = None,
    portfolio_id: Optional[str] = None,
) -> PortfolioState:
    """Initialize a new Virtual Paper Portfolio from basket allocations with discrete integer shares."""
    pid = portfolio_id or f"port_{uuid.uuid4().hex[:8]}"
    date_str = as_of_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    holdings: List[PortfolioHolding] = []
    total_spent = 0.0

    # Determine if discrete allocation is needed
    has_explicit_shares = any(alloc.get("shares") is not None for alloc in allocations)
    if not has_explicit_shares:
        weights = {a["symbol"]: float(a.get("weight", 0.0)) for a in allocations}
        prices = {a["symbol"]: float(a.get("price") or a.get("current_price", 100.0)) for a in allocations}
        alloc_res = DiscreteAllocationEngine().allocate(weights=weights, prices=prices, capital=capital)
        discrete_shares_map = alloc_res.shares
    else:
        discrete_shares_map = {}

    for alloc in allocations:
        sym = alloc["symbol"]
        stock_name = alloc.get("name", sym)
        sector = alloc.get("sector", "Unknown")
        w = float(alloc["weight"])
        price = float(alloc.get("price") or alloc.get("current_price", 100.0))

        if has_explicit_shares:
            shares = int(alloc.get("shares") or alloc.get("shares_approx", 0))
        else:
            shares = discrete_shares_map.get(sym, 0)

        invested_amt = round(shares * price, 2)
        total_spent += invested_amt

        holdings.append(
            PortfolioHolding(
                symbol=sym,
                name=stock_name,
                sector=sector,
                shares=shares,
                buy_price=round(price, 2),
                current_price=round(price, 2),
                invested_amount=invested_amt,
                current_value=invested_amt,
                unrealized_pnl=0.0,
                unrealized_pnl_pct=0.0,
                weight=w,
            )
        )

    cash = max(0.0, round(capital - total_spent, 2))
    current_val = round(cash + sum(h.current_value for h in holdings), 2)

    # Re-normalize weights to exact current value
    for h in holdings:
        h.weight = round(h.current_value / current_val, 4) if current_val > 0 else 0.0

    benchmark_comp = BenchmarkComparisonLive(
        portfolio_return_pct=0.0,
        nifty_return_pct=0.0,
        bank_fd_return_pct=0.0,
        alpha_vs_nifty=0.0,
        alpha_vs_fd=0.0,
    )

    return PortfolioState(
        portfolio_id=pid,
        name=name,
        initial_capital=round(capital, 2),
        cash=cash,
        invested_capital=round(total_spent, 2),
        current_value=current_val,
        total_pnl=0.0,
        total_pnl_pct=0.0,
        holdings=holdings,
        benchmark_comparison=benchmark_comp,
        initial_regime=active_regime,
        current_regime=active_regime,
        risk_persona=risk_persona,
        horizon=horizon,
        created_at=date_str,
        as_of_date=date_str,
    )


def calculate_day_over_day_mtm(
    portfolio: PortfolioState,
    latest_prices: Dict[str, float],
    previous_close_prices: Optional[Dict[str, float]] = None,
    benchmark_index_price: Optional[float] = None,
    benchmark_initial_price: Optional[float] = None,
    elapsed_days: int = 0,
    as_of_date: Optional[str] = None,
    current_regime: Optional[MarketRegimeType] = None,
) -> PortfolioState:
    """Calculate Day-over-Day MTM: holding 1D P&L = N * (P_t - P_{t-1}) and aggregate portfolio 1D change."""
    date_str = as_of_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    prev_prices = previous_close_prices or {}

    updated_holdings: List[PortfolioHolding] = []
    holdings_value = 0.0
    agg_pnl_1d = 0.0

    for h in portfolio.holdings:
        curr_price = float(latest_prices.get(h.symbol, h.current_price))
        prev_price = float(prev_prices.get(h.symbol, h.prev_close_price if h.prev_close_price is not None else h.current_price))

        curr_val = round(h.shares * curr_price, 2)
        total_pnl = round(curr_val - h.invested_amount, 2)
        total_pnl_pct = round((curr_val / h.invested_amount - 1.0) * 100.0, 2) if h.invested_amount > 0 else 0.0

        # Holding 1D Day-over-Day calculation
        holding_1d_pnl = round(h.shares * (curr_price - prev_price), 2)
        prev_holding_val = h.shares * prev_price
        holding_1d_pnl_pct = (
            round((curr_price / prev_price - 1.0) * 100.0, 2)
            if prev_price > 0
            else 0.0
        )

        holdings_value += curr_val
        agg_pnl_1d += holding_1d_pnl

        updated_holdings.append(
            PortfolioHolding(
                symbol=h.symbol,
                name=h.name,
                sector=h.sector,
                shares=h.shares,
                buy_price=h.buy_price,
                current_price=round(curr_price, 2),
                prev_close_price=round(prev_price, 2),
                invested_amount=h.invested_amount,
                current_value=curr_val,
                unrealized_pnl=total_pnl,
                unrealized_pnl_pct=total_pnl_pct,
                pnl_1d=holding_1d_pnl,
                pnl_1d_pct=holding_1d_pnl_pct,
                weight=h.weight,
            )
        )

    total_current_val = round(portfolio.cash + holdings_value, 2)
    agg_pnl_1d = round(agg_pnl_1d, 2)

    # Start-of-day portfolio valuation
    start_of_day_val = total_current_val - agg_pnl_1d
    agg_pnl_1d_pct = (
        round((agg_pnl_1d / start_of_day_val) * 100.0, 2)
        if start_of_day_val > 0
        else 0.0
    )

    total_pnl = round(total_current_val - portfolio.initial_capital, 2)
    total_pnl_pct = (
        round((total_current_val / portfolio.initial_capital - 1.0) * 100.0, 2)
        if portfolio.initial_capital > 0
        else 0.0
    )

    # Re-normalize weights
    for h in updated_holdings:
        h.weight = round(h.current_value / total_current_val, 4) if total_current_val > 0 else 0.0

    # Benchmark comparison
    nifty_ret = 0.0
    if benchmark_index_price and benchmark_initial_price and benchmark_initial_price > 0:
        nifty_ret = round((benchmark_index_price / benchmark_initial_price - 1.0) * 100.0, 2)

    fd_ret = round(7.0 * (elapsed_days / 365.0), 2)
    alpha_nifty = round(total_pnl_pct - nifty_ret, 2)
    alpha_fd = round(total_pnl_pct - fd_ret, 2)

    benchmark_comp = BenchmarkComparisonLive(
        portfolio_return_pct=total_pnl_pct,
        nifty_return_pct=nifty_ret,
        bank_fd_return_pct=fd_ret,
        alpha_vs_nifty=alpha_nifty,
        alpha_vs_fd=alpha_fd,
    )

    active_reg = current_regime or portfolio.current_regime

    return PortfolioState(
        portfolio_id=portfolio.portfolio_id,
        name=portfolio.name,
        initial_capital=portfolio.initial_capital,
        cash=portfolio.cash,
        invested_capital=portfolio.invested_capital,
        current_value=total_current_val,
        total_pnl=total_pnl,
        total_pnl_pct=total_pnl_pct,
        pnl_1d=agg_pnl_1d,
        pnl_1d_pct=agg_pnl_1d_pct,
        holdings=updated_holdings,
        benchmark_comparison=benchmark_comp,
        initial_regime=portfolio.initial_regime,
        current_regime=active_reg,
        risk_persona=portfolio.risk_persona,
        horizon=portfolio.horizon,
        created_at=portfolio.created_at,
        as_of_date=date_str,
    )


def update_portfolio_mark_to_market(
    portfolio: PortfolioState,
    latest_prices: Dict[str, float],
    benchmark_index_price: Optional[float] = None,
    benchmark_initial_price: Optional[float] = None,
    elapsed_days: int = 0,
    as_of_date: Optional[str] = None,
    current_regime: Optional[MarketRegimeType] = None,
    previous_close_prices: Optional[Dict[str, float]] = None,
) -> PortfolioState:
    """Update portfolio valuation and P&L based on live prices."""
    return calculate_day_over_day_mtm(
        portfolio=portfolio,
        latest_prices=latest_prices,
        previous_close_prices=previous_close_prices,
        benchmark_index_price=benchmark_index_price,
        benchmark_initial_price=benchmark_initial_price,
        elapsed_days=elapsed_days,
        as_of_date=as_of_date,
        current_regime=current_regime,
    )


class PortfolioSimulator:
    """Portfolio simulation engine coordinating mark-to-market calculations."""

    def create(
        self,
        name: str,
        capital: float,
        allocations: List[Dict[str, Any]],
        risk_persona: RiskPersona = RiskPersona.BALANCED,
        horizon: str = "6M",
        active_regime: MarketRegimeType = MarketRegimeType.LOW_VOLATILITY_BULL,
        as_of_date: Optional[str] = None,
    ) -> PortfolioState:
        return create_portfolio_from_allocations(
            name=name,
            capital=capital,
            allocations=allocations,
            risk_persona=risk_persona,
            horizon=horizon,
            active_regime=active_regime,
            as_of_date=as_of_date,
        )

    def mark_to_market(
        self,
        portfolio: PortfolioState,
        latest_prices: Dict[str, float],
        benchmark_index_price: Optional[float] = None,
        benchmark_initial_price: Optional[float] = None,
        elapsed_days: int = 0,
        as_of_date: Optional[str] = None,
        current_regime: Optional[MarketRegimeType] = None,
    ) -> PortfolioState:
        return update_portfolio_mark_to_market(
            portfolio=portfolio,
            latest_prices=latest_prices,
            benchmark_index_price=benchmark_index_price,
            benchmark_initial_price=benchmark_initial_price,
            elapsed_days=elapsed_days,
            as_of_date=as_of_date,
            current_regime=current_regime,
        )
