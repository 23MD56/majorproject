# Spec: QuantNiti Core Platform

**Status:** ready-for-agent

## Problem Statement

Retail investors and evaluators without a quantitative finance background struggle to make informed, data-backed stock market decisions. Existing retail investment platforms (Groww, INDmoney) provide passive portfolio tracking without predictive intelligence or downside risk modeling, while quantitative tools (TradingView, Zerodha Streak) require technical indicator scripting that retail users cannot parse. When seeking guidance, retail investors are pushed toward high-commission bank wealth managers (charging 1.5%–2.5% AUM fees with hidden conflicts of interest) or low-yielding fixed deposits.

Retail investors need a transparent, mobile-first decision support system that directly answers:
1. *Where should I invest my money?*
2. *How much is it probabilistically projected to grow over 1, 3, 6, and 12 months?*
3. *What is my downside risk in market crashes?*
4. *Why should I trust this algorithmic recommendation over a human bank advisor?*

Simultaneously, active traders and academic evaluators need to inspect underlying market regime dynamics and backtest technical trading strategies on Indian equity markets.

---

## Solution

QuantNiti is an AI-driven regime-adaptive equity intelligence and portfolio recommendation platform for the Indian equity market (NIFTY 50 universe). It provides:

1. **Investor Growth Journey (`Grow` Tab):** A 3-step capital-to-basket recommendation engine that produces curated NIFTY 50 equity baskets with 3-tier probabilistic ₹ growth projections (Pessimistic 10th percentile, Base 50th percentile, Optimistic 90th percentile), downside stress guardrails, and a benchmark comparison against 7% Bank Fixed Deposits and NIFTY 50.
2. **Explainable AI Trust Card:** A transparent 4-pillar credibility card explaining current market regime context, 5-year backtested directional accuracy, worst-case drawdown bounds, and estimated fee savings by eliminating middleman advisory commissions.
3. **Stock Intelligence Profiles (`Explore` Tab):** 360° asset intelligence for individual NIFTY 50 tickers featuring multi-horizon growth forecast gauges, regime suitability scores, and benchmark alpha comparisons.
4. **Quant Lab (`Quant Lab` Tab):** An academic and quantitative trading studio featuring unsupervised Market Regime radar (Gaussian HMM / GMM clustering for Bull, Bear, and Sideways regimes) and vectorized technical strategy backtesting (Moving Average Crossovers, RSI Mean Reversion, Bollinger Band Breakouts, Dual Momentum) with interactive equity curves and risk metrics (CAGR, Sharpe, Sortino, Max Drawdown).
5. **Virtual Paper Portfolio & Rebalancing Engine (`Portfolio` Tab):** A simulated investment tracker that calculates live mark-to-market performance, tracks real-time P&L, delivers interactive before/after diff alerts when market regimes transition, and generates 1-click broker order sheets for manual execution.

---

## User Stories

1. As a first-time retail investor, I want to input my investment capital (e.g. ₹50,000) and time horizon (e.g. 6 months), so that I get a personalized portfolio basket recommendation suited to my timeframe.
2. As a first-time retail investor, I want to select my risk persona (Conservative, Balanced, or Aggressive), so that my portfolio allocation strictly adheres to my drawdown tolerance.
3. As a retail investor, I want to see projected future portfolio values in rupees across three scenarios (Pessimistic, Base, Optimistic), so that I understand realistic outcome boundaries rather than misleading single-point promises.
4. As a retail investor, I want to view an Explainable AI Trust Card on every recommendation, so that I understand why these stocks were selected and why I can trust the algorithm over a bank relationship manager.
5. As a retail investor, I want to see a side-by-side comparison of projected portfolio returns against a 7% Bank Fixed Deposit and the NIFTY 50 index, so that I can evaluate the risk-adjusted premium of equity investing.
6. As a retail investor, I want to see the exact percentage and rupee allocation across recommended NIFTY 50 stocks in a clean visual donut breakdown, so that I understand where my capital is distributed.
7. As a self-directed investor, I want to search and filter NIFTY 50 stocks by sector (IT, Banking, Energy, Auto, FMCG), so that I can explore individual companies I am interested in.
8. As a self-directed investor, I want to view a Stock Intelligence Profile for any ticker, so that I can see its multi-horizon growth forecast (1M, 3M, 6M), regime sensitivity, and historical 3-year performance.
9. As a self-directed investor, I want to see a Regime Suitability badge on individual stocks (e.g. "High-Beta Momentum: Outperforms in Bull Regimes"), so that I know whether a stock aligns with current market conditions.
10. As a retail investor, I want to activate any recommended basket into a Virtual Paper Portfolio with a single click, so that I can track its simulated live performance without risking real capital.
11. As a virtual portfolio user, I want to see my portfolio's live mark-to-market value, total return percentage, and day change, so that I can monitor simulated progress over time.
12. As a virtual portfolio user, I want to receive a Regime-Shift Rebalance Alert when the macro market transitions (e.g. Bull to High-Vol Bear), so that I am notified to adjust my portfolio before severe downturns.
13. As a virtual portfolio user, I want to view an interactive before/after asset allocation diff when a rebalance is recommended, so that I understand exactly which stocks are trimmed or added.
14. As a virtual portfolio user, I want to click "Apply Rebalance", so that my virtual portfolio weights update to the new regime-optimized distribution.
15. As a retail investor ready to invest real funds, I want to generate a 1-Click Order Sheet showing exact share counts and current prices, so that I can easily copy orders to Zerodha or Groww.
16. As an active quant trader, I want to open the Quant Lab to view real-time Market Regime probabilities (Bull / Bear / Sideways), so that I can understand prevailing macroeconomic volatility and drift.
17. As an academic evaluator, I want to inspect historical market regime segmentation on the NIFTY 50 index chart, so that I can verify the unsupervised machine learning clustering model.
18. As an active trader, I want to backtest technical trading strategies (Buy & Hold, MA Crossover, RSI, Bollinger Bands, Dual Momentum) across custom date ranges, so that I can evaluate systematic rule profitability.
19. As an active trader, I want to view comprehensive backtest performance metrics (CAGR, Sharpe Ratio, Sortino Ratio, Volatility, Max Drawdown, Win Rate), so that I can evaluate risk-adjusted strategy alpha.
20. As an active trader, I want to view interactive equity curves and drawdown charts comparing my backtested strategy against the NIFTY 50 benchmark, so that I can visually verify historical performance under various market regimes.

---

## Implementation Decisions

1. **Dual-Tabbed Mobile-First Architecture:**
   The client interface is structured into four primary tabs: `Grow` (Investor Basket Generation), `Explore` (Stock Intelligence Profiles), `Quant Lab` (Regime Radar & Strategy Backtesting Studio), and `Portfolio` (Virtual Investment Tracker & Order Sheet).

2. **Data Ingestion & Universe:**
   The platform operates on the NIFTY 50 universe, ingesting daily historical and live-adjusted OHLCV price series, India VIX, and benchmark index data via standardized market data providers with local caching for low latency.

3. **Unsupervised Market Regime Classification Engine:**
   Market regime is classified into three macro states (Low-Volatility Bull, High-Volatility Bear, Sideways Consolidation) using Gaussian Hidden Markov Models (GHMM) / Gaussian Mixture Models (GMM) trained on rolling returns, realized volatility, and volatility index metrics.

4. **Multi-Horizon Probabilistic Growth Forecasting Engine:**
   Stock-level expected returns and distribution intervals (10th, 50th, 90th percentiles) across 1-month, 3-month, 6-month, and 12-month horizons are generated using a multi-factor ranking and quantile regression neural pipeline, providing bounded forecast cones rather than deterministic single-point targets.

5. **Regime-Conditioned Portfolio Optimization:**
   Portfolio baskets are constructed using Hierarchical Risk Parity (HRP) and Regime-Conditioned Black-Litterman optimization, combining ML return expectations with risk persona constraints (Conservative, Balanced, Aggressive) to enforce maximum per-stock weight limits and minimum defensive allocations.

6. **Explainable AI Trust Card Generation:**
   Every basket and stock recommendation automatically synthesizes four trust pillars: (1) Active regime context, (2) Historical backtested hit rate, (3) Max stress drawdown guardrail, and (4) Estimated commission savings vs traditional wealth management.

7. **Vectorized Strategy Backtesting Engine:**
   The Quant Lab features an in-memory vectorized backtesting engine that simulates technical trading rules (Moving Average Crossovers, RSI Mean Reversion, Bollinger Band Breakouts, Dual Momentum) on historical OHLCV data with slippage and transaction cost modeling.

8. **Virtual Paper Portfolio Simulator & Regime Rebalancer:**
   Virtual holdings are persisted in local/server session state, computing daily mark-to-market valuations and triggering rebalance diff alerts upon regime transition events.

---

## Testing Decisions

1. **Testing Philosophy:**
   Tests will focus exclusively on external behavior and API/service boundaries. No internal private helper methods will be unit tested in isolation.

2. **Primary Seam for Testing:**
   The primary testing seam is the Application Service and API boundary (`/api/*`), testing:
   - Basket recommendation generation: Verifying valid weight distribution ($\sum w_i = 1.0$), quantile monotonicity ($Q_{10} \le Q_{50} \le Q_{90}$), and persona risk constraints.
   - Stock profile intelligence: Verifying correct multi-horizon projections and regime ratings for NIFTY 50 tickers.
   - Market regime classification: Verifying valid 3-state probability distributions summing to 1.0.
   - Backtest engine: Verifying mathematical integrity of CAGR, Sharpe ratio, drawdown curves, and trade log calculations.
   - Virtual portfolio simulation: Verifying accurate P&L calculation and regime-shift rebalance diff generation.

3. **Client UI Verification:**
   Component and integration tests for user flows: 3-step capital input to basket rendering, scenario toggle (Pessimistic/Base/Optimistic), Quant Lab backtest execution, and Virtual Portfolio rebalance application.

---

## Out of Scope

- Automated live broker order routing or auto-trading execution (educational and simulated decision support only).
- Penny stocks or illiquid small-cap tickers outside the NIFTY 50 index.
- Intraday high-frequency tick-by-tick streaming or futures/options derivatives pricing.
- User financial advisory licensing under SEBI RIA regulations (standard analytical disclaimer provided).

---

## Further Notes

- QuantNiti directly preserves the mathematical depth and machine learning foundations of Project Phase 1 while wrapping it in an intuitive, accessible product experience that addresses all feedback from the project review panel.
