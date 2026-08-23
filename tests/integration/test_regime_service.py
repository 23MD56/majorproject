import pytest
from app.core.models import CurrentRegimeResponse, MarketRegimeType, RegimeHistoryResponse, RegimeTrainResponse
from app.data.cache import ParquetMarketCache
from app.data.provider import MockDataProvider
from app.data.service import MarketDataService
from app.ml.regime.service import RegimeService


@pytest.fixture
def regime_service(tmp_path):
    cache = ParquetMarketCache(cache_dir=tmp_path / "cache")
    provider = MockDataProvider()
    market_service = MarketDataService(provider=provider, cache=cache)
    return RegimeService(market_service=market_service)


def test_get_current_regime(regime_service):
    current = regime_service.get_current_regime()
    assert isinstance(current, CurrentRegimeResponse)
    assert current.regime in [
        MarketRegimeType.LOW_VOLATILITY_BULL,
        MarketRegimeType.HIGH_VOLATILITY_BEAR,
        MarketRegimeType.SIDEWAYS_CONSOLIDATION,
    ]
    assert current.regime_id in [0, 1, 2]
    # Probabilities sum to 1.0
    total_prob = current.probabilities.bull + current.probabilities.bear + current.probabilities.sideways
    assert pytest.approx(total_prob, 1e-4) == 1.0
    assert len(current.description) > 0
    assert len(current.recommended_strategy) > 0
    assert "realized_vol_20d" in current.metrics
    assert "log_return_20d" in current.metrics


def test_get_regime_history(regime_service):
    history = regime_service.get_regime_history(start_date="2024-01-01", end_date="2024-06-01")
    assert isinstance(history, RegimeHistoryResponse)
    assert history.count > 0
    assert len(history.data) == history.count
    # Verify distribution sums to ~100% (or 1.0)
    dist_sum = sum(history.regime_distribution.values())
    assert pytest.approx(dist_sum, 1e-3) == 1.0
    # Check item schema
    item = history.data[0]
    assert item.close_price > 0
    assert item.realized_volatility > 0


def test_train_model(regime_service):
    train_res = regime_service.train_model(start_date="2023-01-01", end_date="2024-01-01")
    assert isinstance(train_res, RegimeTrainResponse)
    assert train_res.samples_trained > 50
    assert train_res.converged is True
