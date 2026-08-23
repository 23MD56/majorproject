"""Regime-conditioned stock suitability scoring and intelligence badge generator."""

from typing import Any, Dict
import numpy as np

from app.core.models import MarketRegimeType, RegimeSuitability


def compute_regime_suitability(
    factors: Dict[str, Any],
    active_regime: MarketRegimeType,
) -> RegimeSuitability:
    """Evaluate asset characteristics against the active market regime.

    Computes a calibrated score (0–100) and descriptive badge:
    - Bull: Rewards high beta (>1.1), positive momentum, and expansion strength.
    - Bear: Rewards low beta (<0.8), low volatility (<0.18), and drawdown resilience.
    - Sideways: Rewards balanced beta (0.85-1.15), value/mean-reversion qualities.
    """
    beta = float(factors.get("beta", 1.0))
    rvol = float(factors.get("realized_vol_90d", 0.20))
    mom_6m = float(factors.get("momentum_6m", 0.0))
    rsi = float(factors.get("rsi_14", 50.0))
    mdd = float(factors.get("max_drawdown_1y", -0.15))

    # Evaluate fit per regime
    if active_regime == MarketRegimeType.LOW_VOLATILITY_BULL:
        # Bull scoring: Beta contribution (0-40), Momentum contribution (0-40), RSI healthy trend (0-20)
        beta_score = np.clip((beta - 0.7) / (1.5 - 0.7) * 40.0, 0.0, 40.0)
        mom_score = np.clip((mom_6m + 0.10) / 0.40 * 40.0, 0.0, 40.0)
        rsi_score = np.clip((rsi - 40.0) / 30.0 * 20.0, 0.0, 20.0)
        score = float(np.clip(beta_score + mom_score + rsi_score, 10.0, 98.0))

        if score >= 75.0:
            badge = "High-Beta Momentum: Outperforms in Bull Regimes"
            desc = "Strong positive momentum and high sensitivity to market upside make this stock a prime growth vehicle during expansion."
        elif score >= 50.0:
            badge = "Growth Participant: Moderate Bull Alignment"
            desc = "Healthy participation in market expansion with balanced upside sensitivity."
        else:
            badge = "Lagging Defensive: Low Upside Sensitivity"
            desc = "Conservative asset profile that may lag aggressive bull market rallies."

    elif active_regime == MarketRegimeType.HIGH_VOLATILITY_BEAR:
        # Bear scoring: Low beta contribution (0-40), Low volatility contribution (0-30), Drawdown resilience (0-30)
        beta_score = np.clip((1.5 - beta) / (1.5 - 0.5) * 40.0, 0.0, 40.0)
        vol_score = np.clip((0.35 - rvol) / (0.35 - 0.12) * 30.0, 0.0, 30.0)
        mdd_score = np.clip((0.30 + mdd) / 0.30 * 30.0, 0.0, 30.0)
        score = float(np.clip(beta_score + vol_score + mdd_score, 10.0, 98.0))

        if score >= 75.0:
            badge = "Capital Shield: Resilient in Bear Regimes"
            desc = "Low market beta and high drawdown resilience help protect capital during severe market downturns."
        elif score >= 50.0:
            badge = "Moderate Defensive: Stable Risk Profile"
            desc = "Provides steady stability with lower downside volatility than high-beta peers."
        else:
            badge = "High Volatility Exposure: Vulnerable in Bear Regimes"
            desc = "High beta and volatility increase downside drawdown risk during market panic."

    else:  # SIDEWAYS_CONSOLIDATION
        # Sideways scoring: Mean-reverting RSI (0-35), Moderate beta (0-35), Controlled volatility (0-30)
        rsi_dist = abs(rsi - 50.0)
        rsi_score = np.clip((25.0 - rsi_dist) / 25.0 * 35.0, 0.0, 35.0)
        beta_dist = abs(beta - 1.0)
        beta_score = np.clip((0.6 - beta_dist) / 0.6 * 35.0, 0.0, 35.0)
        vol_score = np.clip((0.30 - rvol) / (0.30 - 0.15) * 30.0, 0.0, 30.0)
        score = float(np.clip(rsi_score + beta_score + vol_score, 10.0, 98.0))

        if score >= 75.0:
            badge = "Quality Value: Steady in Sideways Regimes"
            desc = "Balanced risk-reward profile and strong mean-reversion characteristics thrive in range-bound markets."
        elif score >= 50.0:
            badge = "Range-Bound Performer: Neutral Trend"
            desc = "Moves in tandem with the broader sideways market without excessive directional drift."
        else:
            badge = "Erratic Trend: Low Range-Bound Stability"
            desc = "Unpredictable price swings relative to the quiet market consolidation."

    return RegimeSuitability(
        score=round(score, 1),
        badge=badge,
        primary_regime=active_regime,
        description=desc,
    )
