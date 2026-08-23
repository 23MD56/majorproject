"""BacktestService domain orchestrator for Quant Lab Strategy Backtesting."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid
import pandas as pd

from app.core.models import (
    BacktestDataPoint,
    BacktestResponse,
    MarketRegimeType,
    StrategyType,
)
from app.data.service import MarketDataService
from app.ml.backtest.engine import BacktestEngine
from app.ml.backtest.metrics import (
    calculate_backtest_metrics,
    calculate_regime_breakdown,
)
from app.ml.regime.service import RegimeService
from app.universe import _SYMBOL_MAP, is_valid_symbol, normalize_symbol


class BacktestService:
    """Core domain service for technical strategy backtesting and quant analytics."""

    def __init__(
        self,
        market_service: MarketDataService,
        regime_service: Optional[RegimeService] = None,
        engine: Optional[BacktestEngine] = None,
    ):
        self.market_service = market_service
        self.regime_service = regime_service or RegimeService(market_service=market_service)
        self.engine = engine or BacktestEngine()

    def run_backtest(
        self,
        symbol: str = "^NSEI",
        strategy: StrategyType = StrategyType.BUY_AND_HOLD,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        initial_capital: float = 100000.0,
        cost_bps: float = 5.0,
        slippage_bps: float = 5.0,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> BacktestResponse:
        """Run technical strategy backtest simulation with performance and regime analytics."""
        canonical = normalize_symbol(symbol)
        if not is_valid_symbol(canonical):
            raise ValueError(f"Symbol '{symbol}' is not recognized in NIFTY 50 universe or benchmark indices.")

        meta = _SYMBOL_MAP.get(canonical, {"name": canonical, "sector": "Benchmark Index"})
        name = meta.get("name", canonical)

        # 1. Fetch Price History
        stock_df = self.market_service.get_history(canonical)
        benchmark_df = self.market_service.get_history("^NSEI")

        # 2. Filter Date Range
        if start_date:
            stock_df = stock_df[stock_df.index >= pd.to_datetime(start_date)]
            benchmark_df = benchmark_df[benchmark_df.index >= pd.to_datetime(start_date)]
        if end_date:
            stock_df = stock_df[stock_df.index <= pd.to_datetime(end_date)]
            benchmark_df = benchmark_df[benchmark_df.index <= pd.to_datetime(end_date)]

        if len(stock_df) < 5:
            raise ValueError(f"Insufficient historical data for symbol '{canonical}' within specified date range.")

        # 3. Execute Vectorized Backtest
        result = self.engine.run(
            df=stock_df,
            strategy=strategy,
            parameters=parameters,
            benchmark_df=benchmark_df,
            initial_capital=initial_capital,
            cost_bps=cost_bps,
            slippage_bps=slippage_bps,
        )

        # 4. Compute Performance Metrics
        metrics = calculate_backtest_metrics(result)

        # 5. Fetch Historical Regime Classification & Compute Breakdown
        regime_history = self.regime_service.get_regime_history()
        regime_dict = {
            pt.date: pt.regime
            for pt in regime_history.data
        }
        regime_series = pd.Series(
            [regime_dict.get(d, MarketRegimeType.LOW_VOLATILITY_BULL).value for d in result.dates],
            index=result.dates,
        )

        regime_breakdown = calculate_regime_breakdown(
            result=result,
            regime_series=regime_series,
        )

        # 6. Build Interactive Equity Curve Series
        equity_curve: List[BacktestDataPoint] = []
        for i, dt in enumerate(result.dates):
            bench_eq = (
                float(result.benchmark_equity_series.iloc[i])
                if result.benchmark_equity_series is not None
                else float(result.equity_series.iloc[i])
            )
            equity_curve.append(
                BacktestDataPoint(
                    date=dt,
                    close_price=round(float(result.close_prices.iloc[i]), 2),
                    signal=float(result.signals.iloc[i]),
                    strategy_equity=round(float(result.equity_series.iloc[i]), 2),
                    benchmark_equity=round(bench_eq, 2),
                    drawdown_pct=round(float(result.drawdown_series.iloc[i]) * 100.0, 2),
                    regime=regime_dict.get(dt, MarketRegimeType.LOW_VOLATILITY_BULL),
                )
            )

        start_dt_str = result.dates[0]
        end_dt_str = result.dates[-1]
        backtest_id = f"bt_{uuid.uuid4().hex[:8]}"

        return BacktestResponse(
            backtest_id=backtest_id,
            symbol=canonical,
            name=name,
            strategy=strategy,
            start_date=start_dt_str,
            end_date=end_dt_str,
            initial_capital=initial_capital,
            metrics=metrics,
            equity_curve=equity_curve,
            trades=result.trades,
            regime_breakdown=regime_breakdown,
            parameters_used=parameters or self.engine.DEFAULT_PARAMS.get(strategy, {}),
        )
