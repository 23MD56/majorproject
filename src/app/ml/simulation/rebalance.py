"""Regime-Shift Rebalance Diff Engine and Broker Order Sheet Generator."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.models import (
    BrokerOrderItem,
    BrokerOrderSheet,
    MarketRegimeType,
    PortfolioHolding,
    PortfolioState,
    RebalanceAlert,
    RebalanceItemDiff,
)
from app.ml.portfolio.allocation import DiscreteAllocationEngine


def compute_rebalance_diff(
    portfolio: PortfolioState,
    target_allocations: List[Dict[str, Any]],
    current_regime: MarketRegimeType,
    latest_prices: Optional[Dict[str, float]] = None,
) -> RebalanceAlert:
    """Compute before/after allocation diff when market regime shifts using discrete integer shares."""
    is_shift = current_regime != portfolio.current_regime
    
    current_holdings_map = {h.symbol: h for h in portfolio.holdings}
    target_map = {a["symbol"]: a for a in target_allocations}
    
    all_symbols = sorted(set(list(current_holdings_map.keys()) + list(target_map.keys())))
    total_val = portfolio.current_value
    prices = latest_prices or {}

    # Calculate discrete target shares if not explicitly supplied
    has_explicit_target_shares = any(
        a.get("shares") is not None or a.get("target_shares") is not None
        for a in target_allocations
    )
    if not has_explicit_target_shares and target_allocations:
        t_weights = {a["symbol"]: float(a.get("weight", 0.0)) for a in target_allocations}
        t_prices = {
            a["symbol"]: float(prices.get(a["symbol"], current_holdings_map[a["symbol"]].current_price if a["symbol"] in current_holdings_map else 100.0))
            for a in target_allocations
        }
        discrete_target = DiscreteAllocationEngine().allocate(weights=t_weights, prices=t_prices, capital=total_val)
        discrete_target_map = discrete_target.shares
    else:
        discrete_target_map = {}

    diff_items: List[RebalanceItemDiff] = []

    for sym in all_symbols:
        curr_h = current_holdings_map.get(sym)
        target_a = target_map.get(sym)

        curr_w = curr_h.weight if curr_h else 0.0
        target_w = float(target_a["weight"]) if target_a else 0.0
        w_diff = round(target_w - curr_w, 4)

        name = (target_a.get("name") if target_a else None) or (curr_h.name if curr_h else sym)
        sector = (target_a.get("sector") if target_a else None) or (curr_h.sector if curr_h else "Unknown")
        curr_price = float(prices.get(sym, curr_h.current_price if curr_h else 100.0))

        curr_shares = curr_h.shares if curr_h else 0
        if has_explicit_target_shares and target_a:
            target_shares = int(target_a.get("target_shares") or target_a.get("shares", 0))
        elif target_a:
            target_shares = discrete_target_map.get(sym, 0)
        else:
            target_shares = 0

        shares_diff = target_shares - curr_shares

        if shares_diff > 0:
            action = "BUY"
            est_amt = round(shares_diff * curr_price, 2)
            if current_regime == MarketRegimeType.LOW_VOLATILITY_BULL:
                rationale = f"Increase high-alpha momentum exposure in {sector} for Bull market expansion."
            elif current_regime == MarketRegimeType.HIGH_VOLATILITY_BEAR:
                rationale = f"Add defensive low-beta holding in {sector} to protect capital in Bear regime."
            else:
                rationale = f"Accumulate quality value stock in {sector} for Sideways consolidation."
        elif shares_diff < 0:
            action = "SELL"
            est_amt = round(abs(shares_diff) * curr_price, 2)
            if current_regime == MarketRegimeType.HIGH_VOLATILITY_BEAR:
                rationale = f"Trim high-beta volatility in {sector} to reduce downside drawdown."
            else:
                rationale = f"Reallocate capital from {sector} to higher conviction regime-aligned assets."
        else:
            action = "HOLD"
            est_amt = 0.0
            rationale = "Maintain existing weight aligned with target risk profile."

        diff_items.append(
            RebalanceItemDiff(
                symbol=sym,
                name=name,
                sector=sector,
                current_weight=round(curr_w, 4),
                target_weight=round(target_w, 4),
                weight_diff=w_diff,
                current_shares=curr_shares,
                target_shares=target_shares,
                shares_diff=shares_diff,
                action=action,
                current_price=round(curr_price, 2),
                estimated_amount=est_amt,
                rationale=rationale,
            )
        )

    # Sort diffs: SELL first, then BUY, then HOLD
    action_priority = {"SELL": 0, "BUY": 1, "HOLD": 2}
    diff_items.sort(key=lambda x: (action_priority[x.action], -abs(x.weight_diff)))

    if is_shift:
        trigger_reason = f"Macro regime shifted from '{portfolio.current_regime.value}' to '{current_regime.value}'."
        summary = (
            f"Market transition detected. Rebalancing shifts portfolio allocations to optimize for "
            f"the new '{current_regime.value}' environment."
        )
    else:
        trigger_reason = "Periodic portfolio risk re-alignment."
        summary = "Portfolio weights aligned with target risk persona."

    return RebalanceAlert(
        portfolio_id=portfolio.portfolio_id,
        is_rebalance_recommended=is_shift or any(abs(item.shares_diff) > 0 for item in diff_items),
        previous_regime=portfolio.current_regime,
        new_regime=current_regime,
        trigger_reason=trigger_reason,
        summary=summary,
        items=diff_items,
    )


def execute_rebalance(
    portfolio: PortfolioState,
    rebalance_alert: RebalanceAlert,
    as_of_date: Optional[str] = None,
) -> PortfolioState:
    """Apply rebalance diff and update portfolio holdings and cash."""
    date_str = as_of_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    new_holdings: List[PortfolioHolding] = []
    total_spent = 0.0

    for item in rebalance_alert.items:
        if item.target_shares > 0:
            invested = round(item.target_shares * item.current_price, 2)
            total_spent += invested
            new_holdings.append(
                PortfolioHolding(
                    symbol=item.symbol,
                    name=item.name,
                    sector=item.sector,
                    shares=item.target_shares,
                    buy_price=item.current_price,
                    current_price=item.current_price,
                    invested_amount=invested,
                    current_value=invested,
                    unrealized_pnl=0.0,
                    unrealized_pnl_pct=0.0,
                    weight=item.target_weight,
                )
            )

    cash = max(0.0, round(portfolio.current_value - total_spent, 2))
    current_val = round(cash + sum(h.current_value for h in new_holdings), 2)

    for h in new_holdings:
        h.weight = round(h.current_value / current_val, 4) if current_val > 0 else 0.0

    return PortfolioState(
        portfolio_id=portfolio.portfolio_id,
        name=portfolio.name,
        initial_capital=portfolio.initial_capital,
        cash=cash,
        invested_capital=round(total_spent, 2),
        current_value=current_val,
        total_pnl=portfolio.total_pnl,
        total_pnl_pct=portfolio.total_pnl_pct,
        holdings=new_holdings,
        benchmark_comparison=portfolio.benchmark_comparison,
        initial_regime=portfolio.initial_regime,
        current_regime=rebalance_alert.new_regime,
        risk_persona=portfolio.risk_persona,
        horizon=portfolio.horizon,
        created_at=portfolio.created_at,
        as_of_date=date_str,
    )


def generate_broker_order_sheet(
    portfolio: PortfolioState,
    rebalance_alert: Optional[RebalanceAlert] = None,
) -> BrokerOrderSheet:
    """Generate 1-Click Broker Order Sheet formatted for Zerodha CSV and Groww."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    orders: List[BrokerOrderItem] = []
    
    if rebalance_alert:
        for item in rebalance_alert.items:
            if item.action in ("BUY", "SELL") and abs(item.shares_diff) > 0:
                orders.append(
                    BrokerOrderItem(
                        symbol=item.symbol,
                        exchange="NSE",
                        action=item.action,
                        quantity=abs(item.shares_diff),
                        price=item.current_price,
                        order_type="MARKET",
                        product_type="CNC",
                        estimated_total=round(abs(item.shares_diff) * item.current_price, 2),
                    )
                )
    else:
        # Initial portfolio allocation orders
        for h in portfolio.holdings:
            if h.shares > 0:
                orders.append(
                    BrokerOrderItem(
                        symbol=h.symbol,
                        exchange="NSE",
                        action="BUY",
                        quantity=h.shares,
                        price=h.current_price,
                        order_type="MARKET",
                        product_type="CNC",
                        estimated_total=round(h.shares * h.current_price, 2),
                    )
                )

    total_amt = round(sum(o.estimated_total for o in orders), 2)

    # 1. Zerodha Basket CSV text format:
    # Instrument,Exchange,Action,Order Type,Quantity,Price,Product Type
    csv_lines = ["Instrument,Exchange,Action,Order Type,Quantity,Price,Product Type"]
    for o in orders:
        csv_lines.append(f"{o.symbol},{o.exchange},{o.action},{o.order_type},{o.quantity},{o.price:.2f},{o.product_type}")
    zerodha_csv = "\n".join(csv_lines)

    # 2. Groww Clean Clipboard text format:
    cash_buffer = getattr(portfolio, "cash", 0.0)
    groww_lines = [
        f"QuantNiti Order Sheet - {portfolio.name}",
        f"Total Orders: {len(orders)} | Total Invested: ₹{total_amt:,.2f} | Cash Buffer: ₹{cash_buffer:,.2f}",
        "----------------------------------------",
    ]
    for o in orders:
        groww_lines.append(f"• {o.action} {o.quantity} shares of {o.symbol} @ ₹{o.price:,.2f} (₹{o.estimated_total:,.2f})")
    groww_lines.append("----------------------------------------")
    groww_lines.append(f"Generated at: {now_str}")
    groww_text = "\n".join(groww_lines)

    return BrokerOrderSheet(
        portfolio_id=portfolio.portfolio_id,
        total_orders=len(orders),
        total_estimated_amount=total_amt,
        orders=orders,
        zerodha_csv_text=zerodha_csv,
        groww_clipboard_text=groww_text,
        generated_at=now_str,
        total_invested=total_amt,
        unallocated_cash=cash_buffer,
    )
