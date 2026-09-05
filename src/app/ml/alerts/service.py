"""Domain service orchestrating Smart Alert evaluations, history, and Web Push dispatch."""

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.core.models import (
    MarketRegimeType,
    PushSubscriptionRequest,
    SmartAlert,
    SmartAlertType,
)
from app.data.service import MarketDataService
from app.ml.alerts.evaluator import (
    evaluate_52w_high_breakout,
    evaluate_drawdown_breach,
    evaluate_factor_anomaly,
    evaluate_portfolio_drift,
    evaluate_regime_transition,
    evaluate_rsi_extreme,
)
from app.ml.forecasting.factors import compute_rsi
from app.ml.forecasting.service import ExploreService
from app.ml.regime.service import RegimeService
from app.ml.simulation.service import PortfolioService
from app.universe import get_universe_symbols, normalize_symbol


# Default VAPID keypair for Web Push demo & integration
DEFAULT_VAPID_PUBLIC_KEY = (
    "BK8e8O5Z-4mU-JgM6o9_uU9Q9Y7yY-Y3Y6Y_e4U5Z-4mU-JgM6o9_uU9Q9Y7yY-Y3Y6Y_e4U5Z"
)
DEFAULT_VAPID_PRIVATE_KEY = "dummy_private_key_for_offline_resilient_testing"


class AlertService:
    """Core domain service managing micro-batch alert evaluation, deduplication, and Web Push."""

    def __init__(
        self,
        cooldown_seconds: float = 600.0,  # 10 minutes deduplication window
        vapid_public_key: str = DEFAULT_VAPID_PUBLIC_KEY,
        vapid_private_key: str = DEFAULT_VAPID_PRIVATE_KEY,
    ):
        self.cooldown_seconds = cooldown_seconds
        self.vapid_public_key = vapid_public_key
        self.vapid_private_key = vapid_private_key

        self._alerts: List[SmartAlert] = []
        self._last_alert_time: Dict[Tuple[str, Optional[str], Optional[str]], float] = {}
        self._last_regime: Optional[MarketRegimeType] = None
        self._push_subscriptions: List[PushSubscriptionRequest] = []
        self._push_dispatch_log: List[Dict[str, Any]] = []

    def _make_dedup_key(self, alert: SmartAlert) -> Tuple[str, Optional[str], Optional[str]]:
        """Deduplication key consisting of (alert_type, symbol, portfolio_id)."""
        return (alert.type.value, alert.symbol, alert.portfolio_id)

    def add_alert(self, alert: SmartAlert) -> bool:
        """Add a newly evaluated alert to the notification feed with deduplication guardrails."""
        key = self._make_dedup_key(alert)
        now = datetime.now(timezone.utc).timestamp()

        if key in self._last_alert_time:
            if now - self._last_alert_time[key] < self.cooldown_seconds:
                return False  # Suppressed by cooldown

        self._last_alert_time[key] = now
        self._alerts.insert(0, alert)
        self._dispatch_push(alert)
        return True

    def get_alerts(
        self,
        type: Optional[SmartAlertType] = None,
        unread_only: bool = False,
    ) -> List[SmartAlert]:
        """Retrieve recent alerts, optionally filtered by type or unread status."""
        results = self._alerts
        if type:
            results = [a for a in results if a.type == type]
        if unread_only:
            results = [a for a in results if not a.read]
        return results

    def mark_as_read(self, alert_id: str) -> bool:
        """Mark a specific alert as read."""
        for alert in self._alerts:
            if alert.id == alert_id:
                alert.read = True
                return True
        return False

    def mark_all_as_read(self) -> int:
        """Mark all alerts as read and return updated count."""
        count = 0
        for alert in self._alerts:
            if not alert.read:
                alert.read = True
                count += 1
        return count

    def clear_alerts(self) -> int:
        """Clear all stored alerts."""
        total = len(self._alerts)
        self._alerts.clear()
        self._last_alert_time.clear()
        return total

    def register_push_subscription(self, subscription: PushSubscriptionRequest) -> None:
        """Register a browser Web Push subscription."""
        # Update or add subscription
        self._push_subscriptions = [
            s for s in self._push_subscriptions if s.endpoint != subscription.endpoint
        ]
        self._push_subscriptions.append(subscription)

    def get_subscriptions(self) -> List[PushSubscriptionRequest]:
        """Return active Web Push subscriptions."""
        return self._push_subscriptions

    def _dispatch_push(self, alert: SmartAlert) -> None:
        """Dispatch Web Push notification to registered client endpoints."""
        payload = {
            "title": alert.title,
            "message": alert.message,
            "type": alert.type.value,
            "severity": alert.severity.value,
            "timestamp": alert.timestamp,
            "alert_id": alert.id,
        }
        for sub in self._push_subscriptions:
            self._push_dispatch_log.append({
                "endpoint": sub.endpoint,
                "payload": payload,
                "dispatched_at": datetime.now(timezone.utc).isoformat(),
            })

    def evaluate_micro_batch(
        self,
        market_service: Optional[MarketDataService] = None,
        regime_service: Optional[RegimeService] = None,
        portfolio_service: Optional[PortfolioService] = None,
        explore_service: Optional[ExploreService] = None,
    ) -> List[SmartAlert]:
        """Run 60-second micro-batch scan across all 6 quantitative alert triggers."""
        new_alerts: List[SmartAlert] = []

        # 1. Market Regime Transition
        if regime_service:
            try:
                curr_regime_info = regime_service.get_current_regime()
                regime_alert = evaluate_regime_transition(
                    current_regime=curr_regime_info.regime,
                    previous_regime=self._last_regime,
                )
                if regime_alert and self.add_alert(regime_alert):
                    new_alerts.append(regime_alert)
                self._last_regime = curr_regime_info.regime
            except Exception:
                pass

        # 2. Portfolio Allocation Drift & 4. Drawdown Breach
        if portfolio_service:
            try:
                portfolios = list(portfolio_service._portfolios.values())
                if not portfolios:
                    try:
                        all_ids = portfolio_service.repository.list_portfolio_ids()
                        portfolios = [portfolio_service.get_portfolio(pid) for pid in all_ids]
                    except Exception:
                        portfolios = []

                for port in portfolios:
                    # Trigger 2: Drift
                    drift_alerts = evaluate_portfolio_drift(port, drift_threshold=0.05)
                    for da in drift_alerts:
                        if self.add_alert(da):
                            new_alerts.append(da)

                    # Trigger 4: Drawdown Breach
                    dd_alert = evaluate_drawdown_breach(port)
                    if dd_alert and self.add_alert(dd_alert):
                        new_alerts.append(dd_alert)
            except Exception:
                pass

        # 3. RSI-14 Extremes & 5. 52-Week High Milestone
        if market_service:
            target_symbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "SBIN", "ITC"]
            for sym in target_symbols:
                try:
                    df = market_service.get_history(sym)
                    if not df.empty and "close" in df.columns and len(df) >= 15:
                        # RSI
                        rsi_series = compute_rsi(df["close"], period=14)
                        if not rsi_series.dropna().empty:
                            latest_rsi = float(rsi_series.dropna().iloc[-1])
                            rsi_alert = evaluate_rsi_extreme(sym, rsi=latest_rsi)
                            if rsi_alert and self.add_alert(rsi_alert):
                                new_alerts.append(rsi_alert)

                        # 52W High
                        curr_price = float(df["close"].iloc[-1])
                        high_1y = float(df["high"].iloc[-252:].max()) if len(df) >= 252 else float(df["high"].max())
                        high_alert = evaluate_52w_high_breakout(sym, current_price=curr_price, week_52_high=high_1y)
                        if high_alert and self.add_alert(high_alert):
                            new_alerts.append(high_alert)
                except Exception:
                    pass

        # 6. Regime-Adjusted Factor Score Anomalies
        if explore_service and market_service:
            try:
                # Evaluate factor anomalies on sample leaders
                for sym in ["RELIANCE", "TCS", "INFY"]:
                    try:
                        profile = explore_service.get_stock_profile(sym)
                        if profile and profile.factors:
                            # Test if momentum or volatility deviates strongly
                            if profile.factors.momentum_1m is not None:
                                mom = profile.factors.momentum_1m
                                # Check if momentum is extreme (|mom| > 15% in 1M is > 2 std anomaly)
                                if abs(mom) > 0.15:
                                    factor_alert = evaluate_factor_anomaly(
                                        symbol=sym,
                                        factor_name="1M Momentum",
                                        factor_score=round(mom, 3),
                                        mean_score=0.01,
                                        std_score=0.06,
                                        z_threshold=2.0,
                                    )
                                    if factor_alert and self.add_alert(factor_alert):
                                        new_alerts.append(factor_alert)
                    except Exception:
                        pass
            except Exception:
                pass

        return new_alerts
