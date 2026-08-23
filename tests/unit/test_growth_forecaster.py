import numpy as np
import pandas as pd
import pytest
from app.core.models import HorizonForecastCone, MultiHorizonGrowthForecast
from app.ml.forecasting.forecaster import MultiHorizonForecaster


@pytest.fixture
def sample_stock_and_index():
    dates = pd.bdate_range("2023-01-01", periods=300)
    rng = np.random.default_rng(42)

    idx_returns = rng.normal(0.0005, 0.01, size=300)
    idx_prices = 20000.0 * np.exp(np.cumsum(idx_returns))
    index_df = pd.DataFrame(
        {
            "open": idx_prices * 0.998,
            "high": idx_prices * 1.006,
            "low": idx_prices * 0.993,
            "close": idx_prices,
            "adj_close": idx_prices,
            "volume": rng.integers(100000, 500000, size=300),
        },
        index=dates,
    )

    stock_returns = 1.1 * idx_returns + rng.normal(0.0003, 0.012, size=300)
    stock_prices = 2500.0 * np.exp(np.cumsum(stock_returns))
    stock_df = pd.DataFrame(
        {
            "open": stock_prices * 0.997,
            "high": stock_prices * 1.009,
            "low": stock_prices * 0.991,
            "close": stock_prices,
            "adj_close": stock_prices,
            "volume": rng.integers(500000, 2000000, size=300),
        },
        index=dates,
    )

    return stock_df, index_df


def test_forecast_all_four_horizons(sample_stock_and_index):
    stock_df, index_df = sample_stock_and_index
    forecaster = MultiHorizonForecaster()
    current_price = float(stock_df["close"].iloc[-1])

    forecast = forecaster.predict_growth_cones(stock_df, index_df, current_price=current_price)

    assert isinstance(forecast, MultiHorizonGrowthForecast)
    assert forecast.m1 is not None
    assert forecast.m3 is not None
    assert forecast.m6 is not None
    assert forecast.m12 is not None


def test_strict_quantile_monotonicity(sample_stock_and_index):
    stock_df, index_df = sample_stock_and_index
    forecaster = MultiHorizonForecaster()
    current_price = float(stock_df["close"].iloc[-1])

    forecast = forecaster.predict_growth_cones(stock_df, index_df, current_price=current_price)

    for horizon_name, cone in [
        ("1M", forecast.m1),
        ("3M", forecast.m3),
        ("6M", forecast.m6),
        ("12M", forecast.m12),
    ]:
        # Return percentage monotonicity: Q10 <= Q50 <= Q90
        assert cone.pessimistic_pct <= cone.base_pct, f"Failed at {horizon_name}: Q10 > Q50"
        assert cone.base_pct <= cone.optimistic_pct, f"Failed at {horizon_name}: Q50 > Q90"

        # Price monotonicity: P10 <= P50 <= P90
        assert cone.pessimistic_price <= cone.base_price, f"Failed at {horizon_name}: P10 > P50"
        assert cone.base_price <= cone.optimistic_price, f"Failed at {horizon_name}: P50 > P90"


def test_forecast_cone_widening_over_longer_horizons(sample_stock_and_index):
    stock_df, index_df = sample_stock_and_index
    forecaster = MultiHorizonForecaster()
    current_price = float(stock_df["close"].iloc[-1])

    forecast = forecaster.predict_growth_cones(stock_df, index_df, current_price=current_price)

    cone_width_1m = forecast.m1.optimistic_pct - forecast.m1.pessimistic_pct
    cone_width_6m = forecast.m6.optimistic_pct - forecast.m6.pessimistic_pct
    cone_width_12m = forecast.m12.optimistic_pct - forecast.m12.pessimistic_pct

    # As horizon extends, uncertainty cone widens
    assert cone_width_12m > cone_width_6m > cone_width_1m
