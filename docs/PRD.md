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

Beyond pure financial returns, investors increasingly want visibility into the ethical and social impact of their investments — but no Indian retail platform surfaces ESG (Environmental, Social, Governance) data at the portfolio recommendation level. India's financial literacy rate remains at 27% (NCFE-FLIS), and existing platforms provide recommendations without educating users on the concepts behind them.

---

## Solution

QuantNiti is an AI-driven regime-adaptive equity intelligence and portfolio recommendation platform for the Indian equity market (NIFTY 50 universe). It provides:

1. **Investor Growth Journey (`Grow` Tab):** A 3-step capital-to-basket recommendation engine that produces curated NIFTY 50 equity baskets with 3-tier probabilistic ₹ growth projections (Pessimistic 10th percentile, Base 50th percentile, Optimistic 90th percentile), downside stress guardrails, and a benchmark comparison against 7% Bank Fixed Deposits and NIFTY 50.
2. **Explainable AI Trust Card:** A transparent 4-pillar credibility card explaining current market regime context, 5-year backtested directional accuracy, worst-case drawdown bounds, and estimated fee savings by eliminating middleman advisory commissions.
3. **Stock Intelligence Profiles (`Explore` Tab):** 360° asset intelligence for individual NIFTY 50 tickers featuring multi-horizon growth forecast gauges, regime suitability scores, ESG Conscience Scores, and benchmark alpha comparisons.
4. **Quant Lab (`Quant Lab` Tab):** An academic and quantitative trading studio featuring unsupervised Market Regime radar (Gaussian HMM / GMM clustering for Bull, Bear, and Sideways regimes) and vectorized technical strategy backtesting (Moving Average Crossovers, RSI Mean Reversion, Bollinger Band Breakouts, Dual Momentum) with interactive equity curves and risk metrics (CAGR, Sharpe, Sortino, Max Drawdown).
5. **Virtual Paper Portfolio & Rebalancing Engine (`Portfolio` Tab):** A simulated investment tracker that calculates live mark-to-market performance, tracks real-time P&L, delivers interactive before/after diff alerts when market regimes transition, and generates 1-click broker order sheets with discrete integer share quantities for manual execution.
6. **NitiBot — RAG-Powered Portfolio Intelligence Assistant:** A context-aware conversational AI assistant grounded in QuantNiti's own regime, portfolio, and backtest data via Retrieval-Augmented Generation (RAG), enabling users to ask natural-language questions about their recommendations ("Why did the AI pick Infosys?", "What happens if the market crashes?") and receive data-backed, explainable answers.
7. **ESG Conscience Score Layer:** An Environmental, Social, and Governance scoring dimension applied to every stock in the NIFTY 50 universe and aggregated at the portfolio level, enabling socially responsible investment decisions and an "ESG-Conscious" risk persona option.
8. **Financial Literacy Microlearning Cards:** Contextual, bite-sized educational cards surfaced alongside every recommendation, explaining core financial concepts (diversification, HRP, market regimes, max drawdown) in plain language to bridge India's financial literacy gap.
9. **Sharable Portfolio Report Card:** One-click generation of a branded, professional portfolio intelligence report (PDF/image) that users can download or share via WhatsApp and social media.
10. **Cross-Platform PWA Installability:** Progressive Web App configuration enabling 1-click standalone installation on Android phones, iOS devices, and desktop laptops/PCs with offline resilience and an adaptive sidebar layout for wider viewports.

---

## User Stories

1. As a first-time retail investor, I want to input my investment capital (e.g. ₹50,000) and time horizon (e.g. 6 months), so that I get a personalized portfolio basket recommendation suited to my timeframe.
2. As a first-time retail investor, I want to select my risk persona (Conservative, Balanced, Aggressive, or ESG-Conscious), so that my portfolio allocation strictly adheres to my drawdown tolerance and ethical preferences.
3. As a retail investor, I want to see projected future portfolio values in rupees across three scenarios (Pessimistic, Base, Optimistic), so that I understand realistic outcome boundaries rather than misleading single-point promises.
4. As a retail investor, I want to view an Explainable AI Trust Card on every recommendation, so that I understand why these stocks were selected and why I can trust the algorithm over a bank relationship manager.
5. As a retail investor, I want to see a side-by-side comparison of projected portfolio returns against a 7% Bank Fixed Deposit and the NIFTY 50 index, so that I can evaluate the risk-adjusted premium of equity investing.
6. As a retail investor, I want to see the exact percentage and rupee allocation across recommended NIFTY 50 stocks in a clean visual donut breakdown, so that I understand where my capital is distributed.
7. As a self-directed investor, I want to search and filter NIFTY 50 stocks by sector (IT, Banking, Energy, Auto, FMCG), so that I can explore individual companies I am interested in.
8. As a self-directed investor, I want to view a Stock Intelligence Profile for any ticker, so that I can see its multi-horizon growth forecast (1M, 3M, 6M), regime sensitivity, ESG score, and historical 3-year performance.
9. As a self-directed investor, I want to see a Regime Suitability badge on individual stocks (e.g. "High-Beta Momentum: Outperforms in Bull Regimes"), so that I know whether a stock aligns with current market conditions.
10. As a retail investor, I want to activate any recommended basket into a Virtual Paper Portfolio with a single click, so that I can track its simulated live performance without risking real capital.
11. As a virtual portfolio user, I want to see my portfolio's live mark-to-market value, total return percentage, and day change, so that I can monitor simulated progress over time.
12. As a virtual portfolio user, I want to receive a Regime-Shift Rebalance Alert when the macro market transitions (e.g. Bull to High-Vol Bear), so that I am notified to adjust my portfolio before severe downturns.
13. As a virtual portfolio user, I want to view an interactive before/after asset allocation diff when a rebalance is recommended, so that I understand exactly which stocks are trimmed or added.
14. As a virtual portfolio user, I want to click "Apply Rebalance", so that my virtual portfolio weights update to the new regime-optimized distribution.
15. As a retail investor ready to invest real funds, I want to generate a 1-Click Order Sheet showing exact whole-share counts, current prices, and remaining unallocated cash, so that I can copy executable orders to Zerodha or Groww without fractional shares.
16. As an active quant trader, I want to open the Quant Lab to view real-time Market Regime probabilities (Bull / Bear / Sideways), so that I can understand prevailing macroeconomic volatility and drift.
17. As an academic evaluator, I want to inspect historical market regime segmentation on the NIFTY 50 index chart, so that I can verify the unsupervised machine learning clustering model.
18. As an active trader, I want to backtest technical trading strategies (Buy & Hold, MA Crossover, RSI, Bollinger Bands, Dual Momentum) across custom date ranges, so that I can evaluate systematic rule profitability.
19. As an active trader, I want to view comprehensive backtest performance metrics (CAGR, Sharpe Ratio, Sortino Ratio, Volatility, Max Drawdown, Win Rate), so that I can evaluate risk-adjusted strategy alpha.
20. As an active trader, I want to view interactive equity curves and drawdown charts comparing my backtested strategy against the NIFTY 50 benchmark, so that I can visually verify historical performance under various market regimes.
21. As a retail investor confused by a recommendation, I want to ask NitiBot a natural-language question like "Why did the AI pick Infosys for my portfolio?" and receive a data-grounded explanation referencing the stock's regime suitability, growth projections, and HRP weight rationale.
22. As a retail investor worried about a market downturn, I want to ask NitiBot "What happens to my portfolio if the market crashes?" and receive a stress-scenario answer citing the Trust Card's max drawdown bounds and backtest performance data.
23. As a first-time investor unfamiliar with financial jargon, I want to ask NitiBot "What does HRP optimization mean?" and receive a plain-language educational explanation grounded in QuantNiti's own domain glossary.
24. As a socially conscious investor, I want to see an ESG Conscience Score (0–100) on every stock's Intelligence Profile, so that I can evaluate whether my investments align with my environmental, social, and governance values.
25. As a socially conscious investor, I want to select the "ESG-Conscious" risk persona, so that the AI tilts portfolio weights toward high-ESG-scoring NIFTY 50 companies while maintaining return expectations.
26. As a socially conscious investor, I want to see a portfolio-level weighted ESG score on my basket results, so that I understand the aggregate ethical footprint of my entire investment.
27. As a new investor seeing "Quantile Regression" or "Sharpe Ratio" for the first time, I want to tap a contextual "Learn" icon and see a bite-sized educational card explaining the concept in plain language, so that I can learn while investing.
28. As a user who has generated a portfolio basket, I want to click "Download Report" and receive a branded PDF report card containing my portfolio donut, growth projections, Trust Card summary, ESG score, and current regime badge, so that I can save or print it.
29. As a user who wants to share their AI-generated portfolio analysis, I want to click a "Share" button that generates a shareable image with a WhatsApp-ready pre-formatted message, so that I can share my QuantNiti results socially.
30. As a mobile user on Android, I want to install QuantNiti to my home screen as a standalone fullscreen app, so that it feels native without visiting the browser.
31. As a desktop user on a laptop, I want to install QuantNiti from Chrome/Edge as a desktop application with a sidebar navigation layout, so that I can use the platform in a wider viewport with keyboard shortcuts.
32. As an iOS user, I want to see an in-app guided banner explaining how to "Add to Home Screen" via Safari's Share menu, so that I can install the PWA on my iPhone.

---

## Implementation Decisions

1. **Dual-Tabbed Mobile-First Architecture with Responsive Desktop Layout:**
   The client interface is structured into four primary tabs: `Grow` (Investor Basket Generation), `Explore` (Stock Intelligence Profiles), `Quant Lab` (Regime Radar & Strategy Backtesting Studio), and `Portfolio` (Virtual Investment Tracker & Order Sheet). On viewports ≥ 1024px, the bottom tab bar collapses into a persistent left sidebar with expanded labels, and the content area widens to a two-column or wider single-column layout.

2. **Data Ingestion & Universe:**
   The platform operates on the NIFTY 50 universe, ingesting daily historical and live-adjusted OHLCV price series, India VIX, and benchmark index data via standardized market data providers with local caching for low latency. Each stock carries a static ESG score triplet (Environment, Social, Governance) curated from public BRSR/CRISIL reports.

3. **Unsupervised Market Regime Classification Engine:**
   Market regime is classified into three macro states (Low-Volatility Bull, High-Volatility Bear, Sideways Consolidation) using Gaussian Hidden Markov Models (GHMM) / Gaussian Mixture Models (GMM) trained on rolling returns, realized volatility, and volatility index metrics.

4. **Multi-Horizon Probabilistic Growth Forecasting Engine:**
   Stock-level expected returns and distribution intervals (10th, 50th, 90th percentiles) across 1-month, 3-month, 6-month, and 12-month horizons are generated using a multi-factor ranking and quantile regression neural pipeline, providing bounded forecast cones rather than deterministic single-point targets.

5. **Regime-Conditioned Portfolio Optimization with ESG Tilting:**
   Portfolio baskets are constructed using Hierarchical Risk Parity (HRP) with Ledoit-Wolf covariance shrinkage, combining ML return expectations with risk persona constraints (Conservative, Balanced, Aggressive, ESG-Conscious) to enforce maximum per-stock weight limits and minimum defensive allocations. The ESG-Conscious persona applies an additive weight bias toward high-ESG-scoring stocks before HRP bisection.

6. **Discrete Integer Share Allocation:**
   Continuous theoretical weights are converted to exact whole-share quantities via greedy integer sizing ($n_i = \lfloor (w_i \cdot C) / P_i \rfloor$), tracking the remaining unallocated cash buffer for 100% executable broker order sheets.

7. **Explainable AI Trust Card Generation:**
   Every basket and stock recommendation automatically synthesizes four trust pillars: (1) Active regime context, (2) Historical backtested hit rate, (3) Max stress drawdown guardrail, and (4) Estimated commission savings vs traditional wealth management.

8. **Vectorized Strategy Backtesting Engine:**
   The Quant Lab features an in-memory vectorized backtesting engine that simulates technical trading rules (Moving Average Crossovers, RSI Mean Reversion, Bollinger Band Breakouts, Dual Momentum) on historical OHLCV data with slippage and transaction cost modeling.

9. **Virtual Paper Portfolio Simulator & Regime Rebalancer:**
   Virtual holdings are persisted in local/server session state, computing daily mark-to-market valuations and triggering rebalance diff alerts upon regime transition events.

10. **NitiBot RAG Architecture:**
    A FastAPI chat endpoint receives a user message, constructs a RAG context payload by aggregating the user's active basket, current regime state, relevant growth projections, Trust Card data, and backtest results from existing services, then forwards the augmented prompt to the Google Gemini API (gemini-2.5-flash). A hard-coded SEBI-compliant system prompt disclaims financial advice. Conversation memory is session-scoped (last 10 turns). The feature degrades gracefully: if no `GEMINI_API_KEY` is set, the chat bubble is hidden and all other features remain fully functional.

11. **ESG Conscience Score Data Model:**
    A curated static dataset provides per-stock ESG scores (0–100 composite, plus Environment, Social, Governance sub-scores) for all 50 NIFTY tickers, sourced from publicly available BRSR disclosures, CRISIL ESG ratings, and NSE Sustainability indices. No external API is called at runtime.

12. **Financial Literacy Microlearning Knowledge Base:**
    A static JSON file contains ~30 curated micro-lessons, each tagged with a concept key (e.g. `hrp`, `sharpe_ratio`, `market_regime`, `max_drawdown`, `esg`). Contextual "Learn" icons in the UI reference concept keys to surface the matching card inline. NitiBot can also reference these cards in its RAG context.

13. **Client-Side PDF/Image Report Generation:**
    Portfolio report cards are generated entirely on the client using `html2canvas` + `jspdf` — no server-side rendering dependency. Reports include the portfolio donut, growth projection chart, Trust Card summary, ESG aggregate score, and a branded QuantNiti watermark with a SEBI disclaimer footer.

14. **Progressive Web App Configuration:**
    A `manifest.json` with `display: standalone` and responsive icons (192px, 512px, maskable) enables browser-native install prompts on Android Chrome and desktop Chrome/Edge. A `sw.js` service worker caches the app shell (HTML, CSS, JS, fonts) for offline resilience. iOS receives a custom in-app banner guiding the Safari "Add to Home Screen" flow. Apple-specific meta tags (`apple-mobile-web-app-capable`, `apple-touch-icon`) are included.

---

## Testing Decisions

1. **Testing Philosophy:**
   Tests will focus exclusively on external behavior and API/service boundaries. No internal private helper methods will be unit tested in isolation.

2. **Primary Seam for Testing:**
   The primary testing seam is the Application Service and API boundary (`/api/*`), testing:
   - Basket recommendation generation: Verifying valid weight distribution ($\sum w_i = 1.0$), quantile monotonicity ($Q_{10} \le Q_{50} \le Q_{90}$), persona risk constraints, and ESG persona weight tilting.
   - Stock profile intelligence: Verifying correct multi-horizon projections, regime ratings, and ESG score inclusion for NIFTY 50 tickers.
   - Market regime classification: Verifying valid 3-state probability distributions summing to 1.0.
   - Backtest engine: Verifying mathematical integrity of CAGR, Sharpe ratio, drawdown curves, and trade log calculations.
   - Virtual portfolio simulation: Verifying accurate P&L calculation, regime-shift rebalance diff generation, and discrete integer share quantities with non-negative cash buffers.
   - Chat endpoint: Verifying RAG context construction, system prompt injection, graceful degradation when API key is absent, and response structure (mocked Gemini responses in tests).
   - ESG data service: Verifying score retrieval, portfolio-level weighted aggregation, and ESG persona constraint enforcement.

3. **Client UI Verification:**
   Component and integration tests for user flows: 3-step capital input to basket rendering, scenario toggle (Pessimistic/Base/Optimistic), Quant Lab backtest execution, Virtual Portfolio rebalance application, NitiBot conversation flow, ESG badge rendering, literacy card expansion, report card PDF download, and PWA install prompt behavior.

---

## Out of Scope

- Automated live broker order routing or auto-trading execution (educational and simulated decision support only).
- Penny stocks or illiquid small-cap tickers outside the NIFTY 50 index.
- Intraday high-frequency tick-by-tick streaming or futures/options derivatives pricing.
- User financial advisory licensing under SEBI RIA regulations (standard analytical disclaimer provided).
- Real-time ESG data scraping or paid ESG API integration (static curated dataset; production path noted for defense).
- Multi-turn agentic workflows where NitiBot autonomously executes trades or modifies portfolios on the user's behalf.
- Native app store distribution (Google Play / Apple App Store); PWA-only distribution.
- Vernacular/multilingual chatbot interface (English-only for this version; noted as future work).

---

## Further Notes

- QuantNiti directly preserves the mathematical depth and machine learning foundations of Project Phase 1 while wrapping it in an intuitive, accessible product experience that addresses all feedback from the project review panel.
- The NitiBot chatbot is the primary "wow factor" for panel demonstrations — it allows evaluators to interactively interrogate the system's decisions in natural language during the viva.
- The ESG Conscience Score is the primary "society benefit" feature — it directly answers the panel question "How does this benefit society?" by enabling socially responsible investment decisions backed by SEBI-mandated BRSR data.
- Financial Literacy Microlearning Cards address India's 27% financial literacy rate and position QuantNiti as an educational platform, not just a recommendation engine.
