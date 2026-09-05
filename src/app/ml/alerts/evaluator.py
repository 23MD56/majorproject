"""Quantitative Smart Alert Trigger Evaluators.

Follows QuantNiti domain rules (CONTEXT.md):
All alerts are framed strictly as objective signals with Trust Card context,
never as speculative buy/sell tips or trading alerts.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.core.models import (
    AlertSeverity,
    MarketRegimeType,
    PortfolioState,
    RiskPersona,
    SmartAlert,
    SmartAlertType,
)


def evaluate_regime_transition(
    current_regime: MarketRegimeType,
    previous_regime: Optional[MarketRegimeType],
) -> Optional[SmartAlert]:
    """Trigger 1: Detects structural transition across macro market regimes."""
    if previous_regime is None or previous_regime == current_regime:
        return None

    prev_name = previous_regime.value.replace("_", " ").title()
    curr_name = current_regime.value.replace("_", " ").title()

    return SmartAlert(
        id=f"alert-regime-{uuid.uuid4().hex[:8]}",
        type=SmartAlertType.REGIME_TRANSITION,
        severity=AlertSeverity.HIGH,
        title="Market Regime Transition Detected",
        message=f"Macro environment transitioned from {prev_name} to {curr_name}. Portfolio factor targets and volatility bounds have adapted.",
        timestamp=datetime.now(timezone.utc).isoformat(),
        trust_card_context="Objective regime shift identified by Gaussian Mixture Model and rolling volatility features. Review rebalance diff.",
    )


def evaluate_portfolio_drift(
    portfolio: PortfolioState,
    drift_threshold: float = 0.05,
) -> List[SmartAlert]:
    """Trigger 2: Scans portfolio holdings for allocation drift exceeding +-5%."""
    alerts: List[SmartAlert] = []

    for holding in portfolio.holdings:
        curr_w = getattr(holding, "current_weight", None)
        if curr_w is None:
            curr_w = holding.weight

        target_w = getattr(holding, "target_weight", None)
        if target_w is None:
            if portfolio.initial_capital > 0 and holding.invested_amount > 0:
                target_w = round(holding.invested_amount / portfolio.initial_capital, 4)
            else:
                target_w = curr_w

        drift = abs(curr_w - target_w)
        if drift > drift_threshold:
            dir_str = "overweight" if curr_w > target_w else "underweight"
            drift_pct_str = f"{drift * 100:.1f}%"
            curr_pct_str = f"{curr_w * 100:.1f}%"
            tgt_pct_str = f"{target_w * 100:.1f}%"

            alerts.append(
                SmartAlert(
                    id=f"alert-drift-{portfolio.portfolio_id}-{holding.symbol}-{uuid.uuid4().hex[:6]}",
                    type=SmartAlertType.PORTFOLIO_DRIFT,
                    severity=AlertSeverity.MEDIUM,
                    title=f"Portfolio Drift Alert: {holding.symbol}",
                    message=f"{holding.symbol} is {dir_str} by {drift_pct_str} (current: {curr_pct_str}, target: {tgt_pct_str}).",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    symbol=holding.symbol,
                    portfolio_id=portfolio.portfolio_id,
                    metric_value=round(curr_w, 4),
                    threshold_value=round(target_w, 4),
                    trust_card_context="Hierarchical Risk Parity allocation bounds recommend reviewing portfolio rebalancing to restore risk parity.",
                )
            )

    return alerts


def evaluate_rsi_extreme(
    symbol: str,
    rsi: float,
    oversold: float = 28.0,
    overbought: float = 72.0,
) -> Optional[SmartAlert]:
    """Trigger 3: Flags RSI-14 oversold (< 28) and overbought (> 72) extremes."""
    if rsi < oversold:
        return SmartAlert(
            id=f"alert-rsi-os-{symbol}-{uuid.uuid4().hex[:6]}",
            type=SmartAlertType.RSI_EXTREME,
            severity=AlertSeverity.MEDIUM,
            title=f"RSI-14 Oversold: {symbol}",
            message=f"{symbol} 14-day RSI reached {rsi:.1f} (<{oversold:.0f}), signaling statistically oversold momentum.",
            timestamp=datetime.now(timezone.utc).isoformat(),
            symbol=symbol,
            metric_value=round(rsi, 2),
            threshold_value=oversold,
            trust_card_context="Wilder's 14-day Relative Strength Index. Purely statistical observation, not a speculative trading tip.",
        )
    elif rsi > overbought:
        return SmartAlert(
            id=f"alert-rsi-ob-{symbol}-{uuid.uuid4().hex[:6]}",
            type=SmartAlertType.RSI_EXTREME,
            severity=AlertSeverity.MEDIUM,
            title=f"RSI-14 Overbought: {symbol}",
            message=f"{symbol} 14-day RSI reached {rsi:.1f} (>{overbought:.0f}), signaling elevated short-term momentum.",
            timestamp=datetime.now(timezone.utc).isoformat(),
            symbol=symbol,
            metric_value=round(rsi, 2),
            threshold_value=overbought,
            trust_card_context="Wilder's 14-day Relative Strength Index. Purely statistical observation, not a speculative trading tip.",
        )
    return None


def evaluate_drawdown_breach(
    portfolio: PortfolioState,
    max_dd_override: Optional[float] = None,
) -> Optional[SmartAlert]:
    """Trigger 4: Detects portfolio drawdown exceeding calibrated persona limits."""
    # Persona thresholds
    persona_limits = {
        RiskPersona.CONSERVATIVE: 0.08,
        RiskPersona.BALANCED: 0.12,
        RiskPersona.AGGRESSIVE: 0.18,
        RiskPersona.ESG_CONSCIOUS: 0.12,
    }

    limit = max_dd_override or persona_limits.get(portfolio.risk_persona, 0.10)
    current_dd = abs(portfolio.max_drawdown_pct)

    if current_dd > limit:
        return SmartAlert(
            id=f"alert-dd-{portfolio.portfolio_id}-{uuid.uuid4().hex[:6]}",
            type=SmartAlertType.DRAWDOWN_BREACH,
            severity=AlertSeverity.CRITICAL,
            title=f"Drawdown Limit Breach: {portfolio.name}",
            message=f"Portfolio drawdown has breached risk guardrail at {current_dd * 100:.1f}% (limit: {limit * 100:.1f}%). Capital preservation guardrail active.",
            timestamp=datetime.now(timezone.utc).isoformat(),
            portfolio_id=portfolio.portfolio_id,
            metric_value=round(current_dd, 4),
            threshold_value=round(limit, 4),
            trust_card_context="Dynamic risk guardrail tied to your calibrated risk persona and historical stress testing.",
        )
    return None


def evaluate_52w_high_breakout(
    symbol: str,
    current_price: float,
    week_52_high: float,
    proximity_ratio: float = 0.99,
) -> Optional[SmartAlert]:
    """Trigger 5: Detects price within 1% or exceeding 52-week high."""
    if week_52_high <= 0:
        return None

    if current_price >= week_52_high * proximity_ratio:
        is_breakout = current_price >= week_52_high
        verb = "breaking" if is_breakout else "approaching"
        return SmartAlert(
            id=f"alert-52w-{symbol}-{uuid.uuid4().hex[:6]}",
            type=SmartAlertType.WEEK_52_HIGH,
            severity=AlertSeverity.LOW,
            title=f"52-Week High Milestone: {symbol}",
            message=f"{symbol} is trading at ₹{current_price:,.2f}, {verb} its 52-week high of ₹{week_52_high:,.2f}.",
            timestamp=datetime.now(timezone.utc).isoformat(),
            symbol=symbol,
            metric_value=round(current_price, 2),
            threshold_value=round(week_52_high, 2),
            trust_card_context="Calculated from 252 trading days price range across the NIFTY 50 investment universe.",
        )
    return None


def evaluate_factor_anomaly(
    symbol: str,
    factor_name: str,
    factor_score: float,
    mean_score: float = 0.50,
    std_score: float = 0.15,
    z_threshold: float = 2.0,
) -> Optional[SmartAlert]:
    """Trigger 6: Identifies extreme factor score anomalies (|z| > 2.0)."""
    z_score = abs(factor_score - mean_score) / (std_score + 1e-9)

    if z_score >= z_threshold:
        return SmartAlert(
            id=f"alert-factor-{symbol}-{factor_name}-{uuid.uuid4().hex[:6]}",
            type=SmartAlertType.FACTOR_ANOMALY,
            severity=AlertSeverity.MEDIUM,
            title=f"Factor Score Anomaly: {symbol}",
            message=f"{symbol} exhibits unusual regime-adjusted {factor_name} score ({factor_score:.2f}, divergence {z_score:.1f}σ).",
            timestamp=datetime.now(timezone.utc).isoformat(),
            symbol=symbol,
            metric_value=round(factor_score, 4),
            threshold_value=round(z_threshold, 2),
            trust_card_context="Multi-factor quantile model assessing Quality, Value, Momentum, and Low Volatility dimensions.",
        )
    return None
