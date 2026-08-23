# Product Requirements Document (PRD): QuantNiti

**Version:** 2.0.0  
**Project Title:** QuantNiti — AI-Driven Regime-Adaptive Portfolio & Stock Growth Intelligence Platform  
**Target Market:** Indian Equity Markets (NIFTY 50 Universe)  
**Authors/Team:** Aryaman Tiwari, Chirag T., Durgashree M., Jayaditya Dev  
**Guide:** Prof. Beena K (KSIT, CSE Dept)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem & The Academic Panel Critique
In Project Phase 1, the initial system focused on technical strategy backtesting (e.g. Moving Average Crossover, RSI, Bollinger Bands). The evaluation panel and retail market research identified three major shortcomings:
1. **Audience Usability Barrier:** Retail investors and evaluators with non-finance backgrounds cannot interpret technical indicator strategies; they need actionable answers to: *"Which stocks should I invest in? How much will my money grow over 6 months? What is my downside risk?"*
2. **The "Why Trust You Over a Bank?" Dilemma:** Black-box recommendations lack transparency. Traditional banks charge 1.5%–2.5% in hidden commissions or push low-yield 6.5% fixed deposits. QuantNiti must demonstrate clear algorithmic transparency, explainable rationale, and proven risk-managed outperformance.
3. **Form Factor:** Evaluators demanded a clean, accessible mobile application.

### 1.2 The Solution: QuantNiti
QuantNiti bridges advanced academic machine learning (probabilistic multi-horizon forecasting, unsupervised market regime detection, risk parity optimization) with an accessible, mobile-first experience. It provides:
- **Zero-Jargon Guided Baskets (Grow Tab):** 3-step capital-to-portfolio generation with probabilistic ₹ growth projections (Pessimistic, Base, Optimistic).
- **Explainable AI Trust Card:** Clear rationale on current market regime, historical backtest hit rate, stress drawdown guardrails, and middleman fee savings.
- **Quant Lab (For Traders & Evaluators):** Retains full technical strategy backtesting, regime classification visualization, and performance analytics.
- **Virtual Paper Portfolio & Rebalance Engine:** Mark-to-market simulated tracking with proactive Regime-Shift Rebalance alerts and 1-click broker order sheets.

---

## 2. Core Personas & User Stories

### Persona 1: Rahul (The First-Time Retail Investor)
- *Profile:* 26-year-old software engineer in Bengaluru with ₹50,000 savings; wants equity exposure without getting lost in technical charts or paying bank wealth management fees.
- *User Story 1.1:* As a retail investor, I want to input my capital (₹50,000), time horizon (6 months), and risk persona (Balanced) so that I receive an optimized basket of blue-chip stocks with projected ₹ growth.
- *User Story 1.2:* As a retail investor, I want to see a Trust Card explaining *why* these stocks were selected and how the portfolio protects my capital in market downturns.
- *User Story 1.3:* As a retail investor, I want to see a direct comparison of my projected returns against a 7% Bank Fixed Deposit and the NIFTY 50 benchmark.

### Persona 2: Priya (The Self-Directed Stock Explorer)
- *Profile:* 32-year-old retail investor looking to evaluate specific stocks before buying on Zerodha/Groww.
- *User Story 2.1:* As a stock explorer, I want to search any NIFTY 50 stock (e.g., RELIANCE) and view its 360° Stock Intelligence Profile, including 1M/3M/6M growth projections and regime suitability.

### Persona 3: Ankit (The Active Trader & Technical Evaluator)
- *Profile:* Academic evaluator / quant enthusiast who wants to verify the mathematical models, regime switches, and indicator strategies.
- *User Story 3.1:* As a technical user, I want to open the *Quant Lab* to inspect current market regime probabilities (Bull / Bear / Sideways) derived from unsupervised clustering.
- *User Story 3.2:* As an active trader, I want to backtest technical strategies (Dual Momentum, Mean Reversion, MA Crossover) on historical NIFTY data and inspect CAGR, Sharpe Ratio, and Drawdown.

---

## 3. Product Feature Architecture (4-Tab Layout)

```
┌────────────────────────────────────────────────────────────────────────┐
│                          QuantNiti Mobile App                          │
├───────────────┬────────────────┬───────────────────┬───────────────────┤
│   Tab 1: 🌱   │   Tab 2: 🔍    │     Tab 3: 🧪     │     Tab 4: 💼     │
│     GROW      │    EXPLORE     │     QUANT LAB     │    PORTFOLIO      │
├───────────────┼────────────────┼───────────────────┼───────────────────┤
│• 3-Step Wizard│• Stock Search  │• Regime Radar     │• Virtual Tracker  │
│• AI Baskets   │• 360° Profile  │• Strategy Studio  │• Regime Rebalance │
│• ₹ Projections│• Growth Range  │• Backtest Metrics │• 1-Click Order    │
│• Trust Card   │• Sector Peers  │• Equity Curves    │  Sheet Export     │
└───────────────┴────────────────┴───────────────────┴───────────────────┘
```

### 3.1 Tab 1: `Grow` (Investor Mode)
1. **Interactive Capital & Horizon Slider:** Set investment amount (₹5,000 – ₹10,00,000) and duration (1M, 3M, 6M, 12M).
2. **Risk Persona Selector:** Conservative (Capital Protection), Balanced (All-Weather Growth), Aggressive (Alpha Maximizer).
3. **AI Basket Recommendation:**
   - Visual allocation donut chart (e.g., 25% Reliance, 20% Infosys, 20% HDFC Bank, 20% L&T, 15% ITC).
   - **Growth Projection Card (3 Scenarios):**
     - 🟢 *Optimistic (90th percentile):* ₹58,400 (+16.8%)
     - 🔵 *Base Case (50th percentile):* ₹55,600 (+11.2%)
     - 🔴 *Pessimistic (10th percentile):* ₹51,200 (+2.4%)
4. **The 4-Pillar Trust Card:**
   - *Pillar 1 (Regime Context):* Current market classified as "Low-Volatility Bull".
   - *Pillar 2 (Model Reliability):* 84.6% historical directional hit rate over 5-year backtests.
   - *Pillar 3 (Drawdown Guardrail):* Max historical stress drawdown capped at -5.8%.
   - *Pillar 4 (Disintermediation Savings):* "0% commissions saves ~₹1,250/yr vs private bank wealth management."
5. **Action:** "Track in Virtual Portfolio" or "View Order Sheet".

### 3.2 Tab 2: `Explore` (Stock Intelligence)
1. **NIFTY 50 Ticker Search & Sector Filter** (IT, Banking, Energy, FMCG, Auto).
2. **Stock Intelligence Profile:**
   - Live price and 1-day change.
   - AI Growth Forecast gauge across 1M, 3M, 6M horizons with confidence bands.
   - Regime Suitability Score (e.g., "High Beta Momentum: Best in Bull Regimes").
   - 3-Year historical performance vs NIFTY 50.

### 3.3 Tab 3: `Quant Lab` (Academic & Trader Studio)
1. **Market Regime Radar:** Unsupervised clustering state probability (e.g. 72% Bull, 18% Sideways, 10% Bear) using Gaussian HMM / GMM on rolling volatility and returns.
2. **Strategy Backtesting Studio:**
   - Select strategy: Buy & Hold, Moving Average Crossover (20/50, 50/200), RSI Mean Reversion, Bollinger Band Breakout, Dual Momentum.
   - Select date range & benchmark.
   - Output: Interactive equity curve, CAGR, Sharpe Ratio, Sortino Ratio, Max Drawdown, Monthly Win Rate heatmap.

### 3.4 Tab 4: `Portfolio` (Virtual Investment Simulator)
1. **Live Mark-to-Market Simulated Portfolio:** Tracks virtual capital invested, total current value, unrealized P&L, and XIRR.
2. **Benchmark Tracker:** Compares live portfolio performance against NIFTY 50 and a 7% Bank FD baseline.
3. **Regime-Shift Rebalance Alert:**
   - Triggered when macro regime switches.
   - Displays interactive before/after diff (e.g. "Shift 10% from IT to FMCG to reduce downside volatility").
   - "Apply Rebalance" button updates virtual allocation.
4. **1-Click Broker Order Sheet:** Generates an exact share breakdown (e.g. 4 shares of RELIANCE, 6 shares of INFY) with copyable Zerodha/Groww format.

---

## 4. Technical & Machine Learning Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QuantNiti Architecture                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. DATA LAYER                                                          │
│    • NSE / Yahoo Finance historical & daily OHLCV (NIFTY 50)           │
│    • India VIX & Sectoral Indices                                      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. ML & QUANT ENGINE                                                   │
│    • Regime Classifier: Gaussian HMM / GMM (Bull / Bear / Sideways)    │
│    • Growth Forecaster: Multi-Factor LightGBM + Quantile LSTM          │
│    • Portfolio Optimizer: Regime-Aware Black-Litterman & HRP           │
│    • Backtesting Engine: Vectorized OHLCV simulation & metrics        │
├────────────────────────────────────────────────────────────────────────┤
│ 3. BACKEND API (FastAPI)                                               │
│    • /api/regime/current & /api/regime/history                         │
│    • /api/baskets/recommend (capital, horizon, risk)                   │
│    • /api/stocks/{symbol}/profile                                      │
│    • /api/backtest/run (strategy, params, date_range)                  │
│    • /api/portfolio/simulate (holdings, rebalance)                     │
├────────────────────────────────────────────────────────────────────────┤
│ 4. FRONTEND CLIENT (React + Tailwind Mobile-First PWA / Native UI)     │
│    • Modern glassmorphism dark mode UI, Lucide icons, Recharts/Plotly  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Compliance & Regulatory Boundaries
- QuantNiti is an educational, analytical decision-support and simulation tool.
- It does not execute live broker trades automatically.
- Clear standard SEBI disclaimer included: "Simulated backtested projections are not guaranteed predictors of future returns."

---

## 6. Phase 2 Verification & Review Plan
1. **Backend & ML Unit Testing:** Verify regime classification convergence, quantile forecast monotonicity (10th <= 50th <= 90th), and HRP portfolio weight constraints ($\sum w_i = 1.0$).
2. **API Endpoint Verification:** Test all FastAPI endpoints with mock and live NIFTY 50 feeds.
3. **Interactive Demo Run-through:**
   - Demo 1: Retail user enters ₹25,000 for 6 months -> receives Balanced Basket, inspects Trust Card and Bank FD comparison.
   - Demo 2: User activates basket in Virtual Portfolio, simulates a market regime change, reviews rebalance diff.
   - Demo 3: Evaluator switches to *Quant Lab*, inspects GMM market regime clusters and backtests Dual Momentum vs Buy & Hold.
