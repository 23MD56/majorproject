# 05: Quant Lab Technical Strategy Backtesting Studio

**What to build:** Build an interactive backtesting studio for active traders and academic evaluators to simulate and inspect technical indicator strategies (Buy & Hold, MA Crossover, RSI, Bollinger Bands, Dual Momentum) on historical data with detailed risk/return analytics.

**Blocked by:** 01: Data Ingestion & NIFTY 50 Universe Service, 02: Unsupervised Market Regime Classifier & Regime Radar

**Status:** done

- [x] Implements vectorized backtest engine supporting Buy & Hold, MA Crossover, RSI Mean Reversion, Bollinger Band Breakout, and Dual Momentum strategies.
- [x] Computes key performance metrics: CAGR, Sharpe Ratio, Sortino Ratio, Max Drawdown, Annualized Volatility, and Win Rate %.
- [x] Renders interactive equity curve comparison against NIFTY 50 benchmark and underwater drawdown chart in the `Quant Lab` tab.
- [x] Displays historical regime breakdown showing strategy performance in Bull vs Bear vs Sideways regimes.
- [x] Passes automated tests validating equity curve math and metric calculations.
