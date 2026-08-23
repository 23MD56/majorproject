# QuantNiti User Guide & Academic Demonstration Walkthrough

**Version:** 2.0.0  
**Target:** Indian Equity Markets (NIFTY 50 Universe)  
**Authors:** Aryaman Tiwari, Chirag T., Durgashree M., Jayaditya Dev  
**Guide:** Prof. Beena K (KSIT, CSE Dept)

---

## 1. System Overview

QuantNiti is an AI-driven equity portfolio intelligence, probabilistic growth forecasting, and regime-adaptive quantitative platform designed for Indian investors and evaluators. It combines rigorous unsupervised machine learning (Gaussian Mixture Models / HMM for market regime detection) and Hierarchical Risk Parity (HRP) portfolio optimization with a mobile-first dark-mode application shell.

### 4-Tab Navigation Architecture
1. 🌱 **Grow (`Tab 1`)**: 3-step capital/horizon/risk wizard, AI Portfolio Basket recommendations, 3-tier Rupee growth scenarios (Optimistic, Base, Pessimistic), 4-Pillar Explainable AI Trust Card, and benchmark comparisons.
2. 🔍 **Explore (`Tab 2`)**: NIFTY 50 universe browser, sector filtering, and 360° Stock Intelligence Profiles with multi-horizon probabilistic return cones (1M, 3M, 6M, 12M).
3. 🧪 **Quant Lab (`Tab 3`)**: Unsupervised Market Regime Radar, technical strategy backtesting studio (5 strategies: Buy & Hold, MA Crossover, RSI, Bollinger Bands, Dual Momentum), equity curves, underwater drawdown charts, and regime attribution.
4. 💼 **Portfolio (`Tab 4`)**: Live mark-to-market simulated tracker, benchmark alpha vs NIFTY 50 & 7% Bank FD, proactive Regime-Shift Rebalance alerts with interactive diffs, and 1-Click Broker Order Sheet exports (Zerodha CSV / Groww summary).

---

## 2. Launching the Application

Ensure dependencies are installed via `uv`:
```bash
uv sync
```

Start the FastAPI application and web client:
```bash
uv run uvicorn src.app.api.app:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser at `http://localhost:8000/` or `http://localhost:8000/app`.

---

## 3. Academic Demonstration & Evaluation Scenarios

### Demonstration 1: Retail Investor Flow (`Grow` Tab)
1. **Configure Investment Parameters**:
   - Set **Capital Amount**: e.g., ₹50,000 (slider from ₹10k to ₹5L).
   - Select **Horizon**: e.g., `6 Months`.
   - Select **Risk Persona**: `Balanced` (or `Conservative` / `Aggressive`).
2. **Generate Basket**:
   - Click **"Generate AI Recommended Basket"**.
   - Review the **Allocation Donut Chart** and stock weight distribution ($\sum w_i = 1.0$).
3. **Inspect Probabilistic Rupee Growth**:
   - 🟢 **Optimistic (90th percentile)**: Projected upper bound growth.
   - 🔵 **Base Case (50th percentile)**: Expected median growth.
   - 🔴 **Pessimistic (10th percentile)**: Downside risk bound.
4. **Examine the 4-Pillar Explainable AI Trust Card**:
   - **Pillar 1 (Regime Context)**: Current macro state (e.g., Low-Volatility Bull).
   - **Pillar 2 (Historical Hit Rate)**: Model directional hit rate over 5-year backtests.
   - **Pillar 3 (Stress Drawdown Guardrail)**: Maximum tolerable stress drawdown limit.
   - **Pillar 4 (Fee Savings)**: Direct disintermediation savings vs private bank wealth managers (0% commission).
5. **Activate Portfolio**:
   - Click **"Track in Virtual Paper Portfolio"** to activate the simulated investment.

---

### Demonstration 2: Stock Explorer Flow (`Explore` Tab)
1. Navigate to the **Explore** tab from the bottom navigation bar.
2. Filter stocks by Sector (e.g., `Information Technology`, `Banking & Fin`, `Energy`).
3. Search for any specific NIFTY 50 ticker (e.g. `INFY` or `RELIANCE`).
4. Tap on any stock card to open the **360° Stock Intelligence Profile**:
   - Inspect the **Multi-Horizon Probabilistic Return Cones** (1M, 3M, 6M, 12M).
   - Review technical factors (RSI-14, MACD, Bollinger Bands, Alpha, Beta).
   - Review the **Regime Suitability Score** and badge.
5. Click **"Simulate in Quant Lab Studio"** to jump directly into strategy backtesting for that stock.

---

### Demonstration 3: Quant Lab Strategy Studio (`Quant Lab` Tab)
1. Navigate to **Quant Lab**.
2. Review the **Market Regime Radar**:
   - Probability breakdown across Low-Vol Bull, Sideways Consolidation, and High-Vol Bear.
3. Configure the Backtest:
   - Asset Symbol: Select stock or `^NSEI` benchmark.
   - Strategy: Choose from `Buy & Hold`, `Moving Average Crossover`, `RSI Mean Reversion`, `Bollinger Band Breakout`, or `Dual Momentum`.
   - Set Initial Capital, Transaction Cost (bps), and Slippage (bps).
4. Click **"Run Vectorized Strategy Simulation"**:
   - Inspect performance metrics: **CAGR**, **Sharpe Ratio**, **Sortino Ratio**, **Max Drawdown**, **Win Rate %**, **Alpha**.
   - Inspect interactive **Equity Growth Curve** vs benchmark.
   - Inspect **Underwater Drawdown Chart**.
   - Review **Performance by Market Regime** table.

---

### Demonstration 4: Virtual Paper Portfolio & Rebalancing (`Portfolio` Tab)
1. Navigate to **Portfolio**.
2. Review live **Mark-to-Market Valuation**:
   - Total Value, Unrealized P&L, Invested Capital, and Alpha vs NIFTY 50.
3. Check the **Regime-Shift Rebalance Status**:
   - Review whether current holdings remain optimal for the active regime.
   - If market regime shifts, click **"Apply Regime-Shift Rebalance"** to update simulated holdings.
4. Export **1-Click Broker Order Sheet**:
   - Click **"Broker Order Sheet"**.
   - Copy **Zerodha Basket CSV** or **Groww Summary Text** directly to the clipboard.

---

## 4. Test Suite Execution

To run all automated unit and integration tests:
```bash
uv run pytest -v
```

To run coverage analysis:
```bash
uv run pytest --cov=src/app
```
