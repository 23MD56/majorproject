"""RegimeService orchestrating market data ingestion, feature engineering, and regime inference."""

from datetime import datetime, timezone
from typing import Dict, List, Optional
import pandas as pd

from app.core.models import (
    CurrentRegimeResponse,
    MarketRegimeType,
    RegimeHistoricalPoint,
    RegimeHistoryResponse,
    RegimeProbabilities,
    RegimeTrainResponse,
)
from app.data.service import MarketDataService
from app.ml.regime.classifier import MarketRegimeClassifier, REGIME_METADATA
from app.ml.regime.features import extract_regime_features


class RegimeService:
    """Core domain service for Market Regime Intelligence."""

    def __init__(
        self,
        market_service: MarketDataService,
        classifier: Optional[MarketRegimeClassifier] = None,
    ):
        self.market_service = market_service
        self.classifier = classifier or MarketRegimeClassifier()

    def _ensure_fitted(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> pd.DataFrame:
        """Fetch index & vix data, compute features, and ensure classifier is trained."""
        index_df = self.market_service.get_history("^NSEI", start_date=start_date, end_date=end_date)
        vix_df = self.market_service.get_history("^INDIAVIX", start_date=start_date, end_date=end_date)

        if index_df.empty:
            raise ValueError("No historical index data available to train regime classifier")

        features_df = extract_regime_features(index_df, vix_df)
        if features_df.empty:
            raise ValueError("Insufficient features extracted for regime classification")

        if not self.classifier.is_fitted:
            self.classifier.fit(features_df)

        return features_df

    def get_current_regime(self) -> CurrentRegimeResponse:
        """Infer current active market regime, class probabilities, and diagnostic metrics."""
        features_df = self._ensure_fitted()
        latest_features = features_df.iloc[[-1]]
        latest_date = str(features_df.index[-1])[:10]

        pred_regime = self.classifier.predict_single(latest_features)
        proba_df = self.classifier.predict_proba(latest_features)

        bull_prob = float(proba_df.loc[proba_df.index[0], MarketRegimeType.LOW_VOLATILITY_BULL.value])
        bear_prob = float(proba_df.loc[proba_df.index[0], MarketRegimeType.HIGH_VOLATILITY_BEAR.value])
        sideways_prob = float(proba_df.loc[proba_df.index[0], MarketRegimeType.SIDEWAYS_CONSOLIDATION.value])

        probs = RegimeProbabilities(
            bull=round(bull_prob, 4),
            bear=round(bear_prob, 4),
            sideways=round(sideways_prob, 4),
        )

        regime_meta = REGIME_METADATA.get(pred_regime, {})
        regime_id_map = {
            MarketRegimeType.LOW_VOLATILITY_BULL: 0,
            MarketRegimeType.HIGH_VOLATILITY_BEAR: 1,
            MarketRegimeType.SIDEWAYS_CONSOLIDATION: 2,
        }

        # Extract current driving metrics
        metrics = {
            col: round(float(latest_features.iloc[0][col]), 4)
            for col in latest_features.columns
        }

        confidence = max(bull_prob, bear_prob, sideways_prob)

        return CurrentRegimeResponse(
            regime=pred_regime,
            regime_id=regime_id_map[pred_regime],
            probabilities=probs,
            confidence=round(confidence, 4),
            metrics=metrics,
            description=regime_meta.get("description", ""),
            recommended_strategy=regime_meta.get("recommended_strategy", ""),
            as_of_date=latest_date,
        )

    def get_regime_history(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> RegimeHistoryResponse:
        """Compute full historical regime series and overall distribution."""
        features_df = self._ensure_fitted(start_date=start_date, end_date=end_date)
        index_df = self.market_service.get_history("^NSEI", start_date=start_date, end_date=end_date)

        labels = self.classifier.predict(features_df)
        proba_df = self.classifier.predict_proba(features_df)

        regime_id_map = {
            MarketRegimeType.LOW_VOLATILITY_BULL: 0,
            MarketRegimeType.HIGH_VOLATILITY_BEAR: 1,
            MarketRegimeType.SIDEWAYS_CONSOLIDATION: 2,
        }

        points: List[RegimeHistoricalPoint] = []
        counts: Dict[str, int] = {
            MarketRegimeType.LOW_VOLATILITY_BULL.value: 0,
            MarketRegimeType.HIGH_VOLATILITY_BEAR.value: 0,
            MarketRegimeType.SIDEWAYS_CONSOLIDATION.value: 0,
        }

        for idx, (dt, row) in enumerate(features_df.iterrows()):
            date_str = str(dt)[:10]
            regime_label = labels[idx]
            counts[regime_label.value] += 1

            close_p = float(index_df.loc[dt, "close"]) if dt in index_df.index else 0.0
            r_vol = float(row["realized_vol_20d"]) if "realized_vol_20d" in row else 0.0

            probs = RegimeProbabilities(
                bull=round(float(proba_df.loc[dt, MarketRegimeType.LOW_VOLATILITY_BULL.value]), 4),
                bear=round(float(proba_df.loc[dt, MarketRegimeType.HIGH_VOLATILITY_BEAR.value]), 4),
                sideways=round(float(proba_df.loc[dt, MarketRegimeType.SIDEWAYS_CONSOLIDATION.value]), 4),
            )

            points.append(
                RegimeHistoricalPoint(
                    date=date_str,
                    regime=regime_label,
                    regime_id=regime_id_map[regime_label],
                    probabilities=probs,
                    close_price=round(close_p, 2),
                    realized_volatility=round(r_vol, 4),
                )
            )

        total_pts = len(points)
        distribution = {
            k: round(v / total_pts, 4) if total_pts > 0 else 0.0
            for k, v in counts.items()
        }

        start_str = points[0].date if points else (start_date or "")
        end_str = points[-1].date if points else (end_date or "")

        return RegimeHistoryResponse(
            start_date=start_str,
            end_date=end_str,
            count=total_pts,
            regime_distribution=distribution,
            data=points,
        )

    def train_model(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> RegimeTrainResponse:
        """Explicitly re-train the regime model on specified historical window."""
        index_df = self.market_service.get_history("^NSEI", start_date=start_date, end_date=end_date)
        vix_df = self.market_service.get_history("^INDIAVIX", start_date=start_date, end_date=end_date)

        features_df = extract_regime_features(index_df, vix_df)
        self.classifier.fit(features_df)

        start_str = str(features_df.index[0])[:10] if not features_df.empty else (start_date or "")
        end_str = str(features_df.index[-1])[:10] if not features_df.empty else (end_date or "")

        return RegimeTrainResponse(
            samples_trained=len(features_df),
            start_date=start_str,
            end_date=end_str,
            trained_at=datetime.now(timezone.utc).isoformat(),
            converged=self.classifier.gmm.converged_,
        )
