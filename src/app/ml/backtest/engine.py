"""Vectorized Quantitative Strategy Backtesting Engine."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from app.core.models import BacktestTrade, StrategyType


@dataclass
class BacktestResultData:
    """Raw result time series and trade logs from a backtest execution."""
    dates: List[str]
    close_prices: pd.Series
    signals: pd.Series
    positions: pd.Series
    daily_returns: pd.Series
    strategy_returns: pd.Series
    equity_series: pd.Series
    drawdown_series: pd.Series
    benchmark_equity_series: Optional[pd.Series]
    benchmark_returns: Optional[pd.Series]
    trades: List[BacktestTrade]
    initial_capital: float
    final_equity: float
    total_cost_paid: float


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Compute Relative Strength Index (RSI)."""
    delta = series.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)

    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()

    rs = avg_gain / avg_loss.replace(0, 1e-9)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi.fillna(50.0)


class BacktestEngine:
    """Vectorized Technical Trading Strategy Backtesting Engine."""

    DEFAULT_PARAMS = {
        StrategyType.BUY_AND_HOLD: {},
        StrategyType.MA_CROSSOVER: {"fast_period": 20, "slow_period": 50},
        StrategyType.RSI_MEAN_REVERSION: {"rsi_period": 14, "rsi_oversold": 30, "rsi_overbought": 70},
        StrategyType.BOLLINGER_BANDS: {"bb_period": 20, "bb_std": 2.0},
        StrategyType.DUAL_MOMENTUM: {"momentum_lookback": 20},
    }

    def generate_signals(
        self,
        df: pd.DataFrame,
        strategy: StrategyType,
        parameters: Optional[Dict[str, Any]] = None,
        benchmark_df: Optional[pd.DataFrame] = None,
    ) -> pd.Series:
        """Generate binary position signals (1 for Long, 0 for Cash/Flat)."""
        close = df["close"]
        n = len(close)
        signals = pd.Series(0.0, index=df.index)

        params = {**self.DEFAULT_PARAMS.get(strategy, {}), **(parameters or {})}

        if strategy == StrategyType.BUY_AND_HOLD:
            signals[:] = 1.0

        elif strategy == StrategyType.MA_CROSSOVER:
            fast_p = int(params.get("fast_period", 20))
            slow_p = int(params.get("slow_period", 50))
            fast_ma = close.rolling(window=fast_p, min_periods=1).mean()
            slow_ma = close.rolling(window=slow_p, min_periods=1).mean()
            signals = (fast_ma > slow_ma).astype(float)

        elif strategy == StrategyType.RSI_MEAN_REVERSION:
            rsi_p = int(params.get("rsi_period", 14))
            oversold = float(params.get("rsi_oversold", 30))
            overbought = float(params.get("rsi_overbought", 70))
            rsi = compute_rsi(close, period=rsi_p)

            pos = 0.0
            pos_list = []
            for val in rsi:
                if val <= oversold:
                    pos = 1.0
                elif val >= overbought:
                    pos = 0.0
                pos_list.append(pos)
            signals = pd.Series(pos_list, index=df.index)

        elif strategy == StrategyType.BOLLINGER_BANDS:
            bb_p = int(params.get("bb_period", 20))
            bb_std_mult = float(params.get("bb_std", 2.0))
            mid = close.rolling(window=bb_p, min_periods=1).mean()
            std = close.rolling(window=bb_p, min_periods=1).std().fillna(0)
            upper = mid + bb_std_mult * std
            lower = mid - bb_std_mult * std

            pos = 0.0
            pos_list = []
            for i in range(len(close)):
                c = close.iloc[i]
                u = upper.iloc[i]
                m = mid.iloc[i]
                if c >= u:
                    pos = 1.0
                elif c <= m and pos == 1.0:
                    pos = 0.0
                pos_list.append(pos)
            signals = pd.Series(pos_list, index=df.index)

        elif strategy == StrategyType.DUAL_MOMENTUM:
            lookback = int(params.get("momentum_lookback", 20))
            stock_mom = close.pct_change(periods=lookback).fillna(0)
            if benchmark_df is not None and "close" in benchmark_df.columns:
                bench_close = benchmark_df["close"].reindex(df.index).ffill().bfill()
                bench_mom = bench_close.pct_change(periods=lookback).fillna(0)
                # Absolute momentum > 0 AND Relative momentum > benchmark
                signals = ((stock_mom > 0) & (stock_mom >= bench_mom)).astype(float)
            else:
                signals = (stock_mom > 0).astype(float)

        return signals

    def extract_trades(
        self,
        dates: List[str],
        close_prices: pd.Series,
        positions: pd.Series,
        initial_capital: float,
        cost_rate: float,
    ) -> List[BacktestTrade]:
        """Extract individual trade logs from position transitions."""
        trades: List[BacktestTrade] = []
        in_trade = False
        entry_idx = 0
        entry_price = 0.0
        entry_date = ""

        for i in range(len(positions)):
            pos = positions.iloc[i]
            prev_pos = positions.iloc[i - 1] if i > 0 else 0.0

            if not in_trade and pos > 0 and prev_pos == 0:
                in_trade = True
                entry_idx = i
                entry_price = float(close_prices.iloc[i])
                entry_date = dates[i]

            elif in_trade and (pos == 0 or i == len(positions) - 1):
                exit_price = float(close_prices.iloc[i])
                exit_date = dates[i]
                gross_ret = (exit_price / entry_price - 1.0) if entry_price > 0 else 0.0
                # Net return deducting entry and exit fees
                net_ret = gross_ret - (2 * cost_rate)
                bars_held = max(1, i - entry_idx)
                shares = initial_capital / entry_price if entry_price > 0 else 0.0
                pnl = shares * (exit_price - entry_price) - (initial_capital * 2 * cost_rate)

                trades.append(
                    BacktestTrade(
                        entry_date=entry_date,
                        exit_date=exit_date,
                        entry_price=round(entry_price, 2),
                        exit_price=round(exit_price, 2),
                        shares=round(shares, 2),
                        return_pct=round(net_ret * 100.0, 2),
                        pnl=round(pnl, 2),
                        bars_held=bars_held,
                        trade_type="LONG",
                    )
                )
                in_trade = False

        return trades

    def run(
        self,
        df: pd.DataFrame,
        strategy: StrategyType = StrategyType.BUY_AND_HOLD,
        parameters: Optional[Dict[str, Any]] = None,
        benchmark_df: Optional[pd.DataFrame] = None,
        initial_capital: float = 100000.0,
        cost_bps: float = 5.0,
        slippage_bps: float = 5.0,
    ) -> BacktestResultData:
        """Execute vectorized backtest simulation."""
        if df.empty or len(df) < 5:
            raise ValueError("Insufficient data points for backtesting (minimum 5 required).")

        # Ensure sorted by date
        df = df.sort_index().copy()
        dates = [
            d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d)[:10]
            for d in df.index
        ]
        close = df["close"]

        # Calculate asset daily returns
        if "daily_return" in df.columns:
            daily_returns = df["daily_return"].fillna(0.0)
        else:
            daily_returns = close.pct_change().fillna(0.0)

        # Total roundtrip cost rate per transaction
        cost_rate = (cost_bps + slippage_bps) / 10000.0

        # Generate signals (desired position)
        signals = self.generate_signals(
            df=df,
            strategy=strategy,
            parameters=parameters,
            benchmark_df=benchmark_df,
        )

        # Shift position by 1 day to prevent lookahead bias (trade executes on next bar)
        positions = signals.shift(1).fillna(signals.iloc[0])

        # Trade transaction cost calculation
        position_changes = positions.diff().abs().fillna(0.0)
        # Entry on first day if starting long
        if positions.iloc[0] > 0:
            position_changes.iloc[0] = positions.iloc[0]

        trade_costs = position_changes * cost_rate

        # Strategy daily returns: position * return - transaction costs
        strategy_returns = (positions * daily_returns) - trade_costs

        # Compute Equity Curve
        equity_series = initial_capital * (1.0 + strategy_returns).cumprod()
        final_equity = float(equity_series.iloc[-1])

        # Drawdown curve
        running_max = equity_series.cummax()
        drawdown_series = (equity_series - running_max) / running_max

        # Benchmark Equity Curve
        benchmark_equity_series = None
        bench_daily_returns = None
        if benchmark_df is not None and "close" in benchmark_df.columns:
            bench_close = benchmark_df["close"].reindex(df.index).ffill().bfill()
            bench_daily_returns = bench_close.pct_change().fillna(0.0)
            benchmark_equity_series = initial_capital * (1.0 + bench_daily_returns).cumprod()

        # Extract trades
        trades = self.extract_trades(
            dates=dates,
            close_prices=close,
            positions=positions,
            initial_capital=initial_capital,
            cost_rate=cost_rate,
        )

        total_cost_paid = float((trade_costs * initial_capital).sum())

        return BacktestResultData(
            dates=dates,
            close_prices=close,
            signals=signals,
            positions=positions,
            daily_returns=daily_returns,
            strategy_returns=strategy_returns,
            equity_series=equity_series,
            drawdown_series=drawdown_series,
            benchmark_equity_series=benchmark_equity_series,
            benchmark_returns=bench_daily_returns,
            trades=trades,
            initial_capital=initial_capital,
            final_equity=round(final_equity, 2),
            total_cost_paid=round(total_cost_paid, 2),
        )
