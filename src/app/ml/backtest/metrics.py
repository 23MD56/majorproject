"""Quantitative Backtesting Metrics & Regime Attribution Calculator."""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd

from app.core.models import (
    BacktestMetrics,
    BacktestTrade,
    MarketRegimeType,
    RegimePerformanceBreakdown,
)
from app.ml.backtest.engine import BacktestResultData


def calculate_backtest_metrics(
    result: BacktestResultData,
    benchmark_returns: Optional[pd.Series] = None,
    risk_free_rate: float = 0.065,  # 6.5% standard Indian risk-free rate
) -> BacktestMetrics:
    """Compute comprehensive risk-adjusted performance metrics."""
    n_days = len(result.strategy_returns)
    if n_days == 0:
        return BacktestMetrics(
            initial_capital=result.initial_capital,
            final_equity=result.final_equity,
            total_return_pct=0.0,
            cagr=0.0,
            annualized_volatility=0.0,
            sharpe_ratio=0.0,
            sortino_ratio=0.0,
            max_drawdown_pct=0.0,
            calmar_ratio=0.0,
            win_rate_pct=0.0,
            profit_factor=0.0,
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            avg_trade_return_pct=0.0,
            benchmark_total_return_pct=0.0,
            benchmark_cagr=0.0,
            benchmark_max_drawdown_pct=0.0,
            alpha=0.0,
            beta=1.0,
        )

    # 1. Total Return & CAGR
    total_ret = (result.final_equity / result.initial_capital) - 1.0
    years = max(n_days / 252.0, 1.0 / 252.0)
    cagr = (result.final_equity / result.initial_capital) ** (1.0 / years) - 1.0 if result.final_equity > 0 else -1.0

    # 2. Volatility (Annualized)
    daily_rets = result.strategy_returns
    vol = float(daily_rets.std() * np.sqrt(252.0))

    # 3. Sharpe Ratio
    daily_rf = (1.0 + risk_free_rate) ** (1.0 / 252.0) - 1.0
    excess_rets = daily_rets - daily_rf
    sharpe = float((excess_rets.mean() / daily_rets.std() * np.sqrt(252.0))) if daily_rets.std() > 1e-8 else 0.0

    # 4. Sortino Ratio (Downside deviation only)
    downside_rets = daily_rets[daily_rets < daily_rf] - daily_rf
    downside_std = float(np.sqrt(np.mean(downside_rets ** 2)) * np.sqrt(252.0)) if len(downside_rets) > 0 else 1e-6
    sortino = float(excess_rets.mean() * 252.0 / downside_std) if downside_std > 1e-8 else 0.0

    # 5. Max Drawdown & Calmar
    max_dd = float(result.drawdown_series.min())
    calmar = float(cagr / abs(max_dd)) if abs(max_dd) > 1e-6 else 0.0

    # 6. Trade Level Metrics
    trades = result.trades
    total_trades = len(trades)
    winning_trades = len([t for t in trades if t.return_pct > 0])
    losing_trades = len([t for t in trades if t.return_pct <= 0])
    win_rate = (winning_trades / total_trades * 100.0) if total_trades > 0 else 0.0

    gross_profit = sum(t.pnl for t in trades if t.pnl > 0)
    gross_loss = abs(sum(t.pnl for t in trades if t.pnl < 0))
    profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 1.0)
    avg_trade_ret = float(np.mean([t.return_pct for t in trades])) if trades else 0.0

    # 7. Benchmark Metrics & CAPM Alpha / Beta
    bench_total_ret = 0.0
    bench_cagr = 0.0
    bench_max_dd = 0.0
    alpha = 0.0
    beta = 1.0

    b_rets = benchmark_returns if benchmark_returns is not None else result.benchmark_returns
    if b_rets is not None and len(b_rets) == n_days:
        bench_cum = (1.0 + b_rets).cumprod()
        bench_total_ret = float(bench_cum.iloc[-1] - 1.0)
        bench_cagr = (1.0 + bench_total_ret) ** (1.0 / years) - 1.0 if bench_total_ret > -1.0 else -1.0
        bench_dd = (bench_cum - bench_cum.cummax()) / bench_cum.cummax()
        bench_max_dd = float(bench_dd.min())

        # Covariance & Beta
        cov_matrix = np.cov(daily_rets.values, b_rets.values)
        bench_var = cov_matrix[1, 1]
        if bench_var > 1e-8:
            beta = float(cov_matrix[0, 1] / bench_var)
            alpha = float(cagr - (risk_free_rate + beta * (bench_cagr - risk_free_rate)))

    return BacktestMetrics(
        initial_capital=result.initial_capital,
        final_equity=round(result.final_equity, 2),
        total_return_pct=round(total_ret * 100.0, 2),
        cagr=round(cagr * 100.0, 2),
        annualized_volatility=round(vol * 100.0, 2),
        sharpe_ratio=round(sharpe, 2),
        sortino_ratio=round(sortino, 2),
        max_drawdown_pct=round(max_dd * 100.0, 2),
        calmar_ratio=round(calmar, 2),
        win_rate_pct=round(win_rate, 2),
        profit_factor=round(profit_factor, 2),
        total_trades=total_trades,
        winning_trades=winning_trades,
        losing_trades=losing_trades,
        avg_trade_return_pct=round(avg_trade_ret, 2),
        benchmark_total_return_pct=round(bench_total_ret * 100.0, 2),
        benchmark_cagr=round(bench_cagr * 100.0, 2),
        benchmark_max_drawdown_pct=round(bench_max_dd * 100.0, 2),
        alpha=round(alpha * 100.0, 2),
        beta=round(beta, 2),
    )


def calculate_regime_breakdown(
    result: BacktestResultData,
    regime_series: pd.Series,
    benchmark_returns: Optional[pd.Series] = None,
) -> List[RegimePerformanceBreakdown]:
    """Segment strategy performance across Bull, Bear, and Sideways regimes."""
    b_rets = benchmark_returns if benchmark_returns is not None else result.benchmark_returns
    df = pd.DataFrame({
        "strat_ret": result.strategy_returns.values,
        "bench_ret": b_rets.values if b_rets is not None else np.zeros(len(result.strategy_returns)),
        "regime": regime_series.reindex(result.dates).ffill().bfill().values,
    }, index=result.dates)

    breakdown: List[RegimePerformanceBreakdown] = []

    for reg_type in MarketRegimeType:
        sub = df[df["regime"] == reg_type.value]
        days = len(sub)
        if days == 0:
            # Fallback empty metrics
            breakdown.append(
                RegimePerformanceBreakdown(
                    regime=reg_type,
                    days_count=0,
                    strategy_return_pct=0.0,
                    benchmark_return_pct=0.0,
                    sharpe_ratio=0.0,
                    max_drawdown_pct=0.0,
                    win_rate_pct=0.0,
                )
            )
            continue

        strat_cum = (1.0 + sub["strat_ret"]).prod() - 1.0
        bench_cum = (1.0 + sub["bench_ret"]).prod() - 1.0

        sub_vol = sub["strat_ret"].std()
        sharpe = float(sub["strat_ret"].mean() / sub_vol * np.sqrt(252.0)) if sub_vol > 1e-8 else 0.0

        equity_sub = (1.0 + sub["strat_ret"]).cumprod()
        dd_sub = (equity_sub - equity_sub.cummax()) / equity_sub.cummax()
        max_dd = float(dd_sub.min())

        win_rate = float((sub["strat_ret"] > 0).mean() * 100.0)

        breakdown.append(
            RegimePerformanceBreakdown(
                regime=reg_type,
                days_count=days,
                strategy_return_pct=round(strat_cum * 100.0, 2),
                benchmark_return_pct=round(bench_cum * 100.0, 2),
                sharpe_ratio=round(sharpe, 2),
                max_drawdown_pct=round(max_dd * 100.0, 2),
                win_rate_pct=round(win_rate, 2),
            )
        )

    return breakdown
