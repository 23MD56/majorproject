"""Unsupervised Gaussian Mixture Model (GMM) Market Regime Classifier."""

from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler

from app.core.models import MarketRegimeType, RegimeProbabilities


REGIME_METADATA: Dict[MarketRegimeType, Dict[str, str]] = {
    MarketRegimeType.LOW_VOLATILITY_BULL: {
        "id": "0",
        "name": "Low-Volatility Bull",
        "description": "Steady upward price drift with muted realized and implied volatility. Optimal for momentum and growth equities.",
        "recommended_strategy": "Overweight High-Beta Growth & Momentum Equities; Full equity allocation.",
    },
    MarketRegimeType.HIGH_VOLATILITY_BEAR: {
        "id": "1",
        "name": "High-Volatility Bear",
        "description": "Negative price drift with sharp volatility spikes and elevated India VIX. High risk of severe drawdowns.",
        "recommended_strategy": "Defensive Capital Protection; Overweight FMCG, Healthcare, Cash & Low-Beta assets.",
    },
    MarketRegimeType.SIDEWAYS_CONSOLIDATION: {
        "id": "2",
        "name": "Sideways Consolidation",
        "description": "Mean-reverting, range-bound market with moderate volatility and negligible directional trend.",
        "recommended_strategy": "Quality Value, High Dividend Yield, and Mean-Reversion factor baskets.",
    },
}


class MarketRegimeClassifier:
    """Unsupervised clustering classifier for macroeconomic market regimes."""

    def __init__(self, n_components: int = 3, random_state: int = 42):
        self.n_components = n_components
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.gmm = GaussianMixture(
            n_components=n_components,
            covariance_type="full",
            random_state=random_state,
            max_iter=200,
            n_init=3,
        )
        self.is_fitted = False
        self.cluster_to_regime: Dict[int, MarketRegimeType] = {}
        self.feature_columns: List[str] = []

    def fit(self, X: pd.DataFrame) -> "MarketRegimeClassifier":
        """Fit GMM clustering and establish deterministic state mapping."""
        if X.empty or len(X) < self.n_components:
            raise ValueError(f"Insufficient data to fit regime classifier (samples: {len(X)})")

        self.feature_columns = list(X.columns)
        X_scaled = self.scaler.fit_transform(X)
        self.gmm.fit(X_scaled)

        # Compute cluster centroids in original space
        centroids = self.scaler.inverse_transform(self.gmm.means_)
        centroids_df = pd.DataFrame(centroids, columns=self.feature_columns)

        # Rank clusters by return-to-volatility ratio for deterministic mapping
        # Higher score -> Bull; Lowest score -> Bear; Middle -> Sideways
        ret_col = "log_return_20d" if "log_return_20d" in centroids_df.columns else centroids_df.columns[0]
        vol_col = "realized_vol_20d" if "realized_vol_20d" in centroids_df.columns else centroids_df.columns[1]

        scores = {}
        for c_idx in range(self.n_components):
            c_ret = centroids_df.loc[c_idx, ret_col]
            c_vol = max(centroids_df.loc[c_idx, vol_col], 1e-4)
            scores[c_idx] = c_ret / c_vol

        sorted_clusters = sorted(scores.items(), key=lambda item: item[1], reverse=True)

        # Deterministic assignment
        bull_cluster = sorted_clusters[0][0]
        bear_cluster = sorted_clusters[-1][0]
        sideways_cluster = sorted_clusters[1][0]

        self.cluster_to_regime = {
            bull_cluster: MarketRegimeType.LOW_VOLATILITY_BULL,
            bear_cluster: MarketRegimeType.HIGH_VOLATILITY_BEAR,
            sideways_cluster: MarketRegimeType.SIDEWAYS_CONSOLIDATION,
        }

        self.is_fitted = True
        return self

    def _format_input(self, X: Union[pd.DataFrame, pd.Series]) -> np.ndarray:
        if isinstance(X, pd.Series):
            X = X.to_frame().T
        if self.feature_columns:
            # Reorder columns to match training
            X = X[self.feature_columns]
        return self.scaler.transform(X)

    def predict(self, X: pd.DataFrame) -> List[MarketRegimeType]:
        """Predict regime labels for a DataFrame of features."""
        if not self.is_fitted:
            raise RuntimeError("Classifier must be fitted before predict()")

        X_scaled = self._format_input(X)
        raw_clusters = self.gmm.predict(X_scaled)
        return [self.cluster_to_regime[c] for c in raw_clusters]

    def predict_single(self, X: Union[pd.DataFrame, pd.Series]) -> MarketRegimeType:
        """Predict regime for a single feature vector."""
        labels = self.predict(X)
        return labels[0]

    def predict_proba(self, X: pd.DataFrame) -> pd.DataFrame:
        """Predict posterior probabilities for each regime class, summing to 1.0."""
        if not self.is_fitted:
            raise RuntimeError("Classifier must be fitted before predict_proba()")

        X_scaled = self._format_input(X)
        raw_proba = self.gmm.predict_proba(X_scaled)

        # Normalize rows strictly
        raw_proba = raw_proba / raw_proba.sum(axis=1, keepdims=True)

        # Remap columns to semantic regime names
        cols = [
            MarketRegimeType.LOW_VOLATILITY_BULL.value,
            MarketRegimeType.HIGH_VOLATILITY_BEAR.value,
            MarketRegimeType.SIDEWAYS_CONSOLIDATION.value,
        ]

        # Invert cluster_to_regime
        regime_to_cluster = {v: k for k, v in self.cluster_to_regime.items()}

        out = pd.DataFrame(index=X.index)
        out[MarketRegimeType.LOW_VOLATILITY_BULL.value] = raw_proba[
            :, regime_to_cluster[MarketRegimeType.LOW_VOLATILITY_BULL]
        ]
        out[MarketRegimeType.HIGH_VOLATILITY_BEAR.value] = raw_proba[
            :, regime_to_cluster[MarketRegimeType.HIGH_VOLATILITY_BEAR]
        ]
        out[MarketRegimeType.SIDEWAYS_CONSOLIDATION.value] = raw_proba[
            :, regime_to_cluster[MarketRegimeType.SIDEWAYS_CONSOLIDATION]
        ]

        return out

    def get_regime_info(self, regime: MarketRegimeType) -> Dict[str, str]:
        """Get descriptive metadata and strategy recommendation for a regime."""
        return REGIME_METADATA.get(regime, {})
