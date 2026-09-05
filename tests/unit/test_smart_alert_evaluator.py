"""Unit tests for 6 Quantitative Smart Alert Triggers and AlertService (Ticket #20)."""

import pytest
from app.core.models import (
    AlertSeverity,
    MarketRegimeType,
    PortfolioHolding,
    PortfolioState,
    RiskPersona,
    SmartAlertType,
)
from app.ml.alerts.evaluator import (
    evaluate_regime_transition,
    evaluate_portfolio_drift,
    evaluate_rsi_extreme,
    evaluate_drawdown_breach,
    evaluate_52w_high_breakout,
    evaluate_factor_anomaly,
)
from app.ml.alerts.service import AlertService


def test_trigger_1_regime_transition():
    """Trigger 1: Detects structural transition across market regimes."""
    # Case A: Transition occurs
    alert = evaluate_regime_transition(
        current_regime=MarketRegimeType.HIGH_VOLATILITY_BEAR,
        previous_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
    )
    assert alert is not None
    assert alert.type == SmartAlertType.REGIME_TRANSITION
    assert alert.severity == AlertSeverity.HIGH
    assert "Bull" in alert.message and "Bear" in alert.message

    # Case B: No transition
    no_alert = evaluate_regime_transition(
        current_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        previous_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
    )
    assert no_alert is None


def test_trigger_2_portfolio_drift():
    """Trigger 2: Detects individual holding weight drift > +-5% against targets."""
    holdings = [
        PortfolioHolding(
            symbol="RELIANCE",
            name="Reliance Industries",
            sector="Energy",
            target_weight=0.20,
            weight=0.27,  # 7% drift (> 5%)
            shares=10,
            buy_price=2800.0,
            current_price=2950.0,
            invested_amount=28000.0,
            current_value=29500.0,
            unrealized_pnl=1500.0,
            unrealized_pnl_pct=0.053,
        ),
        PortfolioHolding(
            symbol="TCS",
            name="Tata Consultancy Services",
            sector="Technology",
            target_weight=0.20,
            weight=0.21,  # 1% drift (<= 5%)
            shares=10,
            buy_price=4000.0,
            current_price=4050.0,
            invested_amount=40000.0,
            current_value=40500.0,
            unrealized_pnl=500.0,
            unrealized_pnl_pct=0.0125,
        ),
    ]

    portfolio = PortfolioState(
        portfolio_id="port-123",
        name="Test Portfolio",
        created_at="2026-09-01T00:00:00Z",
        as_of_date="2026-09-03",
        initial_capital=50000.0,
        cash=0.0,
        invested_capital=68000.0,
        current_value=70000.0,
        total_pnl=2000.0,
        total_pnl_pct=0.029,
        pnl_1d=1000.0,
        pnl_1d_pct=0.014,
        max_drawdown_pct=0.04,
        risk_persona=RiskPersona.BALANCED,
        horizon="6M",
        initial_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        current_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        holdings=holdings,
    )

    alerts = evaluate_portfolio_drift(portfolio, drift_threshold=0.05)
    assert len(alerts) == 1
    assert alerts[0].symbol == "RELIANCE"
    assert alerts[0].type == SmartAlertType.PORTFOLIO_DRIFT
    assert alerts[0].severity == AlertSeverity.MEDIUM


def test_trigger_3_rsi_extremes():
    """Trigger 3: Flags RSI-14 oversold (< 28) and overbought (> 72)."""
    # Oversold
    alert_os = evaluate_rsi_extreme("INFY", rsi=24.5)
    assert alert_os is not None
    assert alert_os.type == SmartAlertType.RSI_EXTREME
    assert "Oversold" in alert_os.title or "Oversold" in alert_os.message

    # Overbought
    alert_ob = evaluate_rsi_extreme("TCS", rsi=76.8)
    assert alert_ob is not None
    assert alert_ob.type == SmartAlertType.RSI_EXTREME
    assert "Overbought" in alert_ob.title or "Overbought" in alert_ob.message

    # Normal range (e.g. 50.0)
    assert evaluate_rsi_extreme("HDFCBANK", rsi=52.0) is None


def test_trigger_4_drawdown_breach():
    """Trigger 4: Detects portfolio drawdown exceeding risk persona guardrail."""
    # Balanced portfolio with limit 12% breached by 15% drawdown
    portfolio = PortfolioState(
        portfolio_id="port-risk",
        name="High Drawdown Port",
        created_at="2026-09-01T00:00:00Z",
        as_of_date="2026-09-03",
        initial_capital=100000.0,
        cash=0.0,
        invested_capital=100000.0,
        current_value=85000.0,
        total_pnl=-15000.0,
        total_pnl_pct=-0.15,
        pnl_1d=-2000.0,
        pnl_1d_pct=-0.02,
        max_drawdown_pct=-0.15,  # -15% drawdown exceeds 12% limit
        risk_persona=RiskPersona.BALANCED,
        horizon="6M",
        initial_regime=MarketRegimeType.HIGH_VOLATILITY_BEAR,
        current_regime=MarketRegimeType.HIGH_VOLATILITY_BEAR,
        holdings=[],
    )

    alert = evaluate_drawdown_breach(portfolio)
    assert alert is not None
    assert alert.type == SmartAlertType.DRAWDOWN_BREACH
    assert alert.severity == AlertSeverity.CRITICAL


def test_trigger_5_52w_high_breakout():
    """Trigger 5: Detects price within 1% or exceeding 52-week high."""
    # Breakout or near high (e.g. 995 vs 1000 high)
    alert = evaluate_52w_high_breakout("BHARTIARTL", current_price=995.0, week_52_high=1000.0)
    assert alert is not None
    assert alert.type == SmartAlertType.WEEK_52_HIGH

    # Distant from high (e.g. 850 vs 1000 high)
    assert evaluate_52w_high_breakout("BHARTIARTL", current_price=850.0, week_52_high=1000.0) is None


def test_trigger_6_factor_score_anomaly():
    """Trigger 6: Flags extreme factor score deviations (|z| > 2.0)."""
    # Z-score > 2.0 anomaly
    alert = evaluate_factor_anomaly(
        symbol="ITC",
        factor_name="Momentum",
        factor_score=0.95,
        mean_score=0.50,
        std_score=0.15,
        z_threshold=2.0,
    )
    assert alert is not None
    assert alert.type == SmartAlertType.FACTOR_ANOMALY
    assert alert.symbol == "ITC"

    # Normal score
    assert evaluate_factor_anomaly("ITC", "Momentum", 0.55, 0.50, 0.15, 2.0) is None


def test_alert_service_deduplication():
    """AlertService should not duplicate identical alerts within cooldown window."""
    service = AlertService()
    alert1 = evaluate_rsi_extreme("RELIANCE", rsi=22.0)
    assert service.add_alert(alert1) is True

    # Immediate duplicate should be rejected
    alert2 = evaluate_rsi_extreme("RELIANCE", rsi=21.5)
    assert service.add_alert(alert2) is False

    assert len(service.get_alerts()) == 1
