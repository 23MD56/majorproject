# Comprehensive Research: Competitor Matrix & Open-Source Codebase Audit

**Date:** August 2026  
**Project:** QuantNiti — AI Regime-Adaptive Portfolio & Stock Growth Intelligence Platform  
**Target:** Indian Equity Market (NIFTY 50 Universe)

---

## 1. Indian & Global Competitor Analysis: What They Provide vs. What They Lack

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       PLATFORM CAPABILITY MATRIX                                            │
├─────────────────┬──────────────┬───────────────┬────────────────┬─────────────────┬──────────────┬──────────┤
│ Platform        │ Portfolio    │ Strategy      │ Market Regime  │ Multi-Horizon   │ Explainable  │ Mobile   │
│                 │ Optimization │ Backtesting   │ Intelligence   │ Prob. Forecasts │ Trust Card   │ App UX   │
├─────────────────┼──────────────┼───────────────┼────────────────┼─────────────────┼──────────────┼──────────┤
│ Groww           │ ❌ None       │ ❌ None        │ ❌ None         │ ❌ None          │ ❌ None       │ ⭐⭐⭐⭐⭐    │
│ Zerodha (Streak)│ ❌ Symbol only│ ⭐⭐⭐⭐ Rules  │ ❌ None         │ ❌ None          │ ❌ None       │ ⭐⭐⭐⭐     │
│ INDmoney        │ ❌ None       │ ❌ None        │ ❌ None         │ ❌ None          │ ❌ None       │ ⭐⭐⭐⭐⭐    │
│ Moneycontrol Pro│ ❌ Static MPT │ ❌ None        │ ❌ None         │ ❌ Analyst tips  │ ❌ None       │ ⭐⭐⭐      │
│ Smallcase       │ ⭐⭐ Static    │ ❌ Marketing   │ ❌ None         │ ❌ None          │ ❌ None       │ ⭐⭐⭐⭐     │
│ TradingView     │ ❌ Single-sym │ ⭐⭐⭐⭐⭐ Pine   │ ❌ None         │ ❌ None          │ ❌ None       │ ⭐⭐⭐⭐     │
├─────────────────┼──────────────┼───────────────┼────────────────┼─────────────────┼──────────────┼──────────┤
│ QuantNiti (Ours)│ ⭐⭐⭐⭐⭐ HRP   │ ⭐⭐⭐⭐⭐ 5 Rules │ ⭐⭐⭐⭐⭐ GMM     │ ⭐⭐⭐⭐⭐ 3-Tier │ ⭐⭐⭐⭐⭐ 4-Pill│ ⭐⭐⭐⭐⭐    │
└─────────────────┴──────────────┴───────────────┴────────────────┴─────────────────┴──────────────┴──────────┘
```

### Deep Dive by Competitor:

1. **Groww & INDmoney (Retail Wealth Trackers)**
   - **What they do well:** Exceptional onboarding, zero-friction Mutual Fund & Stock buying, clean net worth tracking, XIRR returns.
   - **What they lack:** Zero forward-looking predictive intelligence; purely backward-looking tracking. No regime awareness or downside stress simulation. When markets crash (e.g. 2020 or 2022), they offer no adaptive guidance.
   - **QuantNiti's Advantage:** QuantNiti tells users *what to buy, how much it will grow, and dynamically warns them when regimes shift to protect capital*.

2. **Zerodha Kite + Streak (Rule-Based Trading)**
   - **What they do well:** Fast no-code indicator builder, chart-to-backtest, live webhook execution for single stocks.
   - **What they lack:** Streak is restricted to single-symbol technical rules (MA crossover, RSI). Cannot optimize or backtest a diversified multi-stock portfolio; zero machine learning or market regime clustering.
   - **QuantNiti's Advantage:** Portfolio-level optimization (Hierarchical Risk Parity), multi-horizon return cones, and unsupervised GMM regime classification.

3. **Smallcase (Thematic Baskets)**
   - **What they do well:** Curated baskets of stocks (e.g. "All-Weather Investing", "IT Tracker") with easy 1-click execution.
   - **What they lack:** Baskets are manually curated by SEBI managers who charge subscription fees (₹2,000–₹10,000/yr). Baskets are static and do not adapt in real-time to shifting market regimes; past performance shown is marketing CAGR without confidence bounds.
   - **QuantNiti's Advantage:** Automated AI-generated baskets customized to the user's exact capital and risk persona, with 0% middleman fees and probabilistic scenario bounds (Pessimistic/Base/Optimistic).

4. **TradingView (Advanced Global Charting)**
   - **What they do well:** Gold-standard charting, Pine Script custom coding, deep community indicators.
   - **What they lack:** Completely inaccessible to retail investors with no coding/finance background. Single-ticker analysis only; no native Indian market regime intelligence or portfolio basket generator.

---

## 2. Audit of the 4 Open-Source Repositories

We cloned and inspected the four codebases in `/tmp/repo_audit/`:

### A. `PyPortfolio/PyPortfolioOpt` (Quantitative Gold Standard)
- **Core Architecture:** Modular portfolio optimization implementing Markowitz Mean-Variance, Black-Litterman, Hierarchical Risk Parity (HRP), and Ledoit-Wolf Shrinkage Covariance.
- **Key Gems Worth Taking:**
  1. **`DiscreteAllocation` Algorithm:** Solves the real-world integer programming problem: converting continuous portfolio weights (e.g. 17.4% RELIANCE) into exact integer share counts (e.g. 3 shares @ ₹2,950 = ₹8,850) with leftover cash tracking.
  2. **Covariance Shrinkage (Ledoit-Wolf / Oracle Approximating Shrinkage):** Dramatically reduces sample noise in daily return covariance matrices compared to raw sample covariance.

### B. `agent7898/stock_predictor` (ARIMA + LSTM + Technical Sentiment)
- **Core Architecture:** Lightweight Flask app predicting stock price trends using ARIMA, simple LSTM, and basic RSI/SMA sentiment flags.
- **Audit Findings:**
  - Standard single-layer LSTM on closing prices alone produces lag-behind curves (predicting $t+1 \approx t$).
  - **Takeaway:** Confirms why our multi-factor ranker + multi-horizon quantile regression (10th/50th/90th percentiles) is far superior to naive raw price LSTMs.

### C. `AnnaSkarpalezou/Portfolio-Optimization-using-Machine-Learning` (PCA + LSTM)
- **Core Architecture:** PCA (Principal Component Analysis) for dimensionality reduction across S&P 500 stocks + LSTM price forecasting + Mean-Variance Optimization.
- **Audit Findings:**
  - Uses PCA to identify market-wide latent factors, reducing noise across 50+ stocks.
  - **Takeaway:** PCA eigenvalue decomposition is a solid, elegant technique to display in academic reviews to demonstrate factor analysis.

### D. `arunchavan4499/Trading-Assistant` (Professional Quant Trading Assistant)
- **Core Architecture:** Full-stack FastAPI + SQLAlchemy + PostgreSQL quant platform featuring Vector Autoregression (VAR), GraphicalLassoCV sparse inverse covariance estimation, and Kelly Criterion position sizing.
- **Key Gems Worth Taking:**
  1. **GraphicalLassoCV for Sparse Precision Matrices:** Removes spurious cross-stock correlation noise in financial networks.
  2. **Risk Manager with Maximum Position Limits & Cash Buffer:** Hard safety limits that prevent any single asset from exceeding risk thresholds.

---

## 3. Synthesis: How QuantNiti Stands Above the Rest

QuantNiti takes the best mathematical rigor from open-source quant frameworks (HRP, GMM regime clustering, discrete allocation) and wraps it in a retail-accessible, explainable mobile experience that solves the fundamental flaws of existing consumer platforms.
