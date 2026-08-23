import pytest
from app.core.models import MarketRegimeType, RegimeSuitability
from app.ml.forecasting.suitability import compute_regime_suitability


def test_suitability_in_bull_regime():
    # High-beta high-momentum stock in Bull Regime
    factors_high_beta = {
        "beta": 1.35,
        "momentum_6m": 0.18,
        "realized_vol_90d": 0.22,
        "rsi_14": 62.0,
        "max_drawdown_1y": -0.12,
    }
    res = compute_regime_suitability(factors_high_beta, active_regime=MarketRegimeType.LOW_VOLATILITY_BULL)
    assert isinstance(res, RegimeSuitability)
    assert res.score >= 70.0
    assert "Bull" in res.badge or "Momentum" in res.badge
    assert res.primary_regime == MarketRegimeType.LOW_VOLATILITY_BULL


def test_suitability_in_bear_regime():
    # Low-beta defensive stock in Bear Regime
    factors_defensive = {
        "beta": 0.55,
        "momentum_6m": 0.02,
        "realized_vol_90d": 0.12,
        "rsi_14": 48.0,
        "max_drawdown_1y": -0.05,
    }
    res = compute_regime_suitability(factors_defensive, active_regime=MarketRegimeType.HIGH_VOLATILITY_BEAR)
    assert isinstance(res, RegimeSuitability)
    assert res.score >= 70.0
    assert "Bear" in res.badge or "Defensive" in res.badge or "Shield" in res.badge
    assert res.primary_regime == MarketRegimeType.HIGH_VOLATILITY_BEAR


def test_suitability_score_bounds():
    factors = {
        "beta": 1.0,
        "momentum_6m": 0.05,
        "realized_vol_90d": 0.18,
        "rsi_14": 50.0,
        "max_drawdown_1y": -0.10,
    }
    for regime in [
        MarketRegimeType.LOW_VOLATILITY_BULL,
        MarketRegimeType.HIGH_VOLATILITY_BEAR,
        MarketRegimeType.SIDEWAYS_CONSOLIDATION,
    ]:
        res = compute_regime_suitability(factors, active_regime=regime)
        assert 0.0 <= res.score <= 100.0
        assert len(res.badge) > 0
        assert len(res.description) > 0
