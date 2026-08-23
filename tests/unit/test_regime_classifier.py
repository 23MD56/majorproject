import numpy as np
import pandas as pd
import pytest
from app.core.models import MarketRegimeType, RegimeProbabilities
from app.ml.regime.classifier import MarketRegimeClassifier


@pytest.fixture
def synthetic_regime_features():
    # Create 3 distinct clusters to verify separation
    rng = np.random.default_rng(42)
    n = 60

    # Cluster 1: Bull (High positive return, low vol, low vix)
    bull_df = pd.DataFrame(
        {
            "log_return_20d": rng.normal(0.06, 0.01, n),
            "log_return_50d": rng.normal(0.12, 0.02, n),
            "realized_vol_20d": rng.normal(0.10, 0.01, n),
            "parkinson_vol_20d": rng.normal(0.09, 0.01, n),
            "vix_level": rng.normal(12.0, 1.0, n),
            "vix_change_20d": rng.normal(-1.0, 0.5, n),
        }
    )

    # Cluster 2: Bear (Negative return, high vol, high vix)
    bear_df = pd.DataFrame(
        {
            "log_return_20d": rng.normal(-0.08, 0.02, n),
            "log_return_50d": rng.normal(-0.15, 0.03, n),
            "realized_vol_20d": rng.normal(0.28, 0.03, n),
            "parkinson_vol_20d": rng.normal(0.25, 0.03, n),
            "vix_level": rng.normal(26.0, 2.0, n),
            "vix_change_20d": rng.normal(5.0, 1.0, n),
        }
    )

    # Cluster 3: Sideways (Flat return, medium vol, normal vix)
    sideways_df = pd.DataFrame(
        {
            "log_return_20d": rng.normal(0.005, 0.01, n),
            "log_return_50d": rng.normal(0.01, 0.015, n),
            "realized_vol_20d": rng.normal(0.15, 0.02, n),
            "parkinson_vol_20d": rng.normal(0.14, 0.02, n),
            "vix_level": rng.normal(16.0, 1.5, n),
            "vix_change_20d": rng.normal(0.0, 0.5, n),
        }
    )

    dates = pd.bdate_range("2023-01-01", periods=3 * n)
    combined = pd.concat([bull_df, bear_df, sideways_df], ignore_index=True)
    combined.index = dates
    return combined, bull_df, bear_df, sideways_df


def test_classifier_fit_and_predict(synthetic_regime_features):
    features, bull_df, bear_df, sideways_df = synthetic_regime_features
    clf = MarketRegimeClassifier()
    clf.fit(features)

    assert clf.is_fitted

    # Predict single point for clear bull scenario
    bull_point = bull_df.iloc[[0]]
    pred_bull = clf.predict_single(bull_point)
    assert pred_bull == MarketRegimeType.LOW_VOLATILITY_BULL

    # Predict single point for clear bear scenario
    bear_point = bear_df.iloc[[0]]
    pred_bear = clf.predict_single(bear_point)
    assert pred_bear == MarketRegimeType.HIGH_VOLATILITY_BEAR


def test_classifier_probabilities_sum_to_one(synthetic_regime_features):
    features, _, _, _ = synthetic_regime_features
    clf = MarketRegimeClassifier()
    clf.fit(features)

    proba_df = clf.predict_proba(features)
    assert isinstance(proba_df, pd.DataFrame)
    assert len(proba_df) == len(features)
    assert set(proba_df.columns) == {
        MarketRegimeType.LOW_VOLATILITY_BULL.value,
        MarketRegimeType.HIGH_VOLATILITY_BEAR.value,
        MarketRegimeType.SIDEWAYS_CONSOLIDATION.value,
    }

    # Sum of probabilities per row must equal 1.0
    row_sums = proba_df.sum(axis=1)
    np.testing.assert_allclose(row_sums.values, 1.0, atol=1e-5)


def test_classifier_state_label_determinism(synthetic_regime_features):
    features, _, _, _ = synthetic_regime_features
    # Fit twice with different random states, deterministic mapping should produce same regime labels
    clf1 = MarketRegimeClassifier(random_state=42)
    clf1.fit(features)
    labels1 = clf1.predict(features)

    clf2 = MarketRegimeClassifier(random_state=123)
    clf2.fit(features)
    labels2 = clf2.predict(features)

    # Dominant state matching should be consistent across seeds
    match_pct = (pd.Series(labels1) == pd.Series(labels2)).mean()
    assert match_pct > 0.85
