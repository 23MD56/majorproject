"""Multi-Horizon Probabilistic Stock Growth Forecaster."""

from datetime import datetime, timezone
from typing import Dict, Optional, Tuple
import numpy as np
import pandas as pd

from app.core.models import HorizonForecastCone, MultiHorizonGrowthForecast
from app.ml.forecasting.factors import extract_stock_factors


HORIZON_CONFIGS = [
    {"name": "1M", "days": 21, "tau": 21 / 252.0},
    {"name": "3M", "days": 63, "tau": 63 / 252.0},
    {"name": "6M", "days": 126, "tau": 126 / 252.0},
    {"name": "12M", "days": 252, "tau": 252 / 252.0},
]


class MultiHorizonForecaster:
    """Generates probabilistic return cones (10th, 50th, 90th percentiles) across multiple horizons."""

    def __init__(self, risk_free_rate: float = 0.065, benchmark_market_return: float = 0.12):
        self.risk_free_rate = risk_free_rate
        self.benchmark_market_return = benchmark_market_return
        self.z_score_90 = 1.28155  # Standard normal 90th percentile

    def _estimate_annualized_drift_and_vol(
        self, stock_df: pd.DataFrame, index_df: Optional[pd.DataFrame] = None
    ) -> Tuple[float, float]:
        """Estimate combined multi-factor annualized drift and realized volatility."""
        factors = extract_stock_factors(stock_df, index_df)

        beta = factors.get("beta", 1.0)
        alpha = factors.get("alpha_annualized", 0.0)
        rvol_90d = factors.get("realized_vol_90d", 0.20)
        rvol_30d = factors.get("realized_vol_30d", rvol_90d)
        vol = max(0.6 * rvol_30d + 0.4 * rvol_90d, 0.08)

        # Multi-factor return components
        # 1. CAPM expectation: Rf + Beta * (Rm - Rf) + Alpha
        capm_drift = self.risk_free_rate + beta * (self.benchmark_market_return - self.risk_free_rate) + alpha

        # 2. Momentum drift (blend of 3M, 6M, 12M momentum)
        mom_blend = (
            0.4 * factors.get("momentum_3m", 0.0)
            + 0.3 * factors.get("momentum_6m", 0.0)
            + 0.3 * factors.get("momentum_12m", 0.0)
        )

        # 3. Technical trend adjustment (EMA spreads)
        trend_adj = 0.5 * factors.get("ema_20_50_spread", 0.0) + 0.5 * factors.get("ema_50_200_spread", 0.0)

        # Blended annualized drift with conservative shrinkage
        drift = 0.50 * capm_drift + 0.30 * mom_blend + 0.20 * trend_adj
        # Bound drift within realistic bounds [-30%, +50%]
        drift = float(np.clip(drift, -0.30, 0.50))

        return drift, vol

    def predict_growth_cones(
        self,
        stock_df: pd.DataFrame,
        index_df: Optional[pd.DataFrame] = None,
        current_price: Optional[float] = None,
        symbol: str = "STOCK",
    ) -> MultiHorizonGrowthForecast:
        """Predict multi-horizon probabilistic return cones with strict quantile monotonicity."""
        if stock_df.empty:
            raise ValueError("Empty stock DataFrame provided for growth forecasting")

        p0 = current_price if current_price is not None else float(stock_df["close"].iloc[-1])
        latest_date = (
            stock_df.index[-1].strftime("%Y-%m-%d")
            if hasattr(stock_df.index[-1], "strftime")
            else str(stock_df.index[-1])[:10]
        )

        drift, vol = self._estimate_annualized_drift_and_vol(stock_df, index_df)

        cones: Dict[str, HorizonForecastCone] = {}

        for cfg in HORIZON_CONFIGS:
            name = cfg["name"]
            days = cfg["days"]
            tau = cfg["tau"]

            # Horizon variance and standard deviation
            horizon_vol = vol * np.sqrt(tau)

            # Base case (50th percentile)
            q50 = float(np.exp(drift * tau) - 1.0)

            # 10th percentile (Pessimistic)
            q10 = float(np.exp((drift - self.z_score_90 * vol) * tau) - 1.0)

            # 90th percentile (Optimistic)
            q90 = float(np.exp((drift + self.z_score_90 * vol) * tau) - 1.0)

            # Strict Monotonicity Projection (Isotonic sort guarantees Q10 <= Q50 <= Q90)
            q10, q50, q90 = sorted([q10, q50, q90])

            # Target prices
            p10 = round(max(0.01, p0 * (1.0 + q10)), 2)
            p50 = round(max(0.01, p0 * (1.0 + q50)), 2)
            p90 = round(max(0.01, p0 * (1.0 + q90)), 2)

            p10, p50, p90 = sorted([p10, p50, p90])

            cones[name] = HorizonForecastCone(
                horizon=name,
                days=days,
                pessimistic_pct=round(q10, 4),
                base_pct=round(q50, 4),
                optimistic_pct=round(q90, 4),
                pessimistic_price=p10,
                base_price=p50,
                optimistic_price=p90,
            )

        return MultiHorizonGrowthForecast(
            symbol=symbol,
            current_price=round(p0, 2),
            as_of_date=latest_date,
            m1=cones["1M"],
            m3=cones["3M"],
            m6=cones["6M"],
            m12=cones["12M"],
        )
