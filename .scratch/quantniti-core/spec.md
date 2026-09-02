# Spec: QuantNiti Revamped Core Platform (Portfolio Intelligence & Financial Education)

**Status:** ready-for-agent

## Problem Statement

Over 73% of Indian adults remain financially illiterate (NCFE-FLIS), and retail investors face severe challenges when attempting to participate in equity wealth generation:
1. Existing retail platforms (Groww, INDmoney, Zerodha) offer passive tracking and trading terminals, but provide no predictive portfolio intelligence, no regime-aware downside protection, and no contextual education for beginners.
2. Beginners are vulnerable to social media financial scams ("finfluencers"), fraudulent Telegram stock tips, and deceptive product reviews promising astronomical, unverified returns.
3. Complex quantitative tools (TradingView, Streak, Bloomberg) are opaque and require scripting knowledge, while bank wealth managers charge exorbitant 1.5%–2.5% AUM fees with inherent conflict of interest.
4. When market volatility strikes, beginners either panic-sell at market bottoms or hold declining assets indefinitely without systematic regime-adaptive rebalancing.

Retail investors need an intuitive, mobile-first, and beginner-accessible **Portfolio Intelligence and Financial Education Platform** that answers:
- *What is the current macro market condition, and how should my money be structured right now?*
- *How can I learn core financial principles through bite-sized, jargon-free analogies and visual compounding tools?*
- *How can I trust user reviews and algorithmic recommendations without falling prey to fake claims and spam?*
- *How much is my money probabilistically projected to grow across realistic economic horizons?*

---

## Solution

QuantNiti is an Android-first, AI-driven portfolio intelligence and financial education platform tailored for Indian retail investors. Built with a Groww-inspired design system (`#00D09C` mint green, high whitespace, clean typography) and 3-tier progressive disclosure, it combines rigorous institutional quantitative finance with an approachable user experience:

1. **Adaptive Home Dashboard (`Home` Tab):**
   - **Market Pulse Hero**: Real-time Market Regime indicator (Low-Vol Bull, High-Vol Bear, Sideways) powered by unsupervised Gaussian Mixture Models (GMM).
   - **User State Adaptation**: First-time visitors receive an inviting 3-step onboarding journey; returning investors see an immediate portfolio summary with Day-over-Day ($1\text{D}$) and Overall P&L in Indian currency (`₹`).
   - **Top Regime Recommendations**: Curated asset highlights ranked by a 4-pillar multi-factor model (Quality, Value, Momentum, Low Volatility).
   - **Learning Hub Carousel**: Accessible financial microlearning cards with plain-language analogies, video facade explainers, and an interactive Compounding / SIP Calculator.
   - **Smart Alert Feed**: Objective quantitative alerts (regime transitions, portfolio drift, RSI extremes, factor anomalies) delivered via in-app toast and Web Push.

2. **Explore & Asset Intelligence (`Explore` Tab):**
   - 360° asset intelligence profiles covering an expanded multi-asset universe: NIFTY 50 large-caps, commodity ETFs (Gold & Silver via `GOLDBEES` / `SILVERBEES`), and high-momentum sectoral leaders (Defense & Metals).
   - Multi-horizon probabilistic return forecast cones (1M, 3M, 6M, 12M) with regime sensitivity and ESG Conscience scores.
   - **Advanced Analysis Drawer (Quant Lab)**: Collapsible evaluator studio housing the vectorized strategy backtester and historical regime attribution, preserving full academic rigor without cluttering the primary beginner interface.

3. **AI Portfolio Basket Generator (`Grow` Tab):**
   - 3-step capital-to-basket wizard generating optimal multi-asset allocations using Hierarchical Risk Parity (HRP) with Ledoit-Wolf covariance shrinkage.
   - 4 Risk Personas: Conservative, Balanced, Aggressive, and ESG-Conscious (with automated tilt toward high BRSR sustainability ratings).
   - Discrete Integer Share Sizing with exact whole-share counts and cash buffer calculation for 1-click execution on Zerodha/Groww.
   - 4-Pillar Explainable AI Trust Card detailing regime context, backtest win rate, maximum stress drawdown, and fee savings.

4. **Multi-Portfolio Manager & Real-Time MTM (`Portfolio` Tab):**
   - Persistent multi-portfolio support via a local relational database: users can create named goal portfolios ("Retirement SIP", "Emergency Buffer", "Defense Alpha").
   - Real-time and Day-over-Day Mark-to-Market tracking ($\Delta V_{1D}$ in ₹ and %) with 3–5 second live tick updates via Server-Sent Events (SSE).
   - Proactive Regime-Shift Rebalance Diff Alerts with 1-click update mechanics.
   - Standalone and per-portfolio Compounding Projections (1–10 years) modeling Lump Sum, monthly SIP, and annual Step-Up growth cones.
   - One-click branded PDF/Image Report Card export.

5. **AI Review Legitimacy & Ground-Truth Fact-Checking Agent:**
   - Amazon-style community review and testimonial section for AI baskets and portfolios.
   - Real-time 3-tier NLP/RegTech verification pipeline that parses percentage return claims and holding durations, cross-checks them against ground-truth mathematical historical data, rejects fraudulent/exaggerated claims, and awards cryptographic verification badges.

6. **Conversational Intelligence (NitiBot):**
   - Grounded RAG assistant (Gemini 2.5 Flash) explaining portfolio recommendations, market regimes, and literacy concepts with strict SEBI disclaimer boundaries.

---

## User Stories

### Home & Educational Onboarding
1. As a beginner with zero finance knowledge, I want to see a welcoming, non-intimidating home screen with clear plain-English explanations, so that I can understand how investing works without feeling overwhelmed by technical jargon.
2. As a first-time user, I want to see an interactive Compounding & SIP Calculator, so that I can visually discover how small monthly savings grow into substantial wealth over 1 to 10 years.
3. As a mobile learner, I want to browse bite-sized Financial Literacy Microlearning Cards with relatable everyday analogies (e.g. comparing portfolio diversification to a cricket team), so that I can build genuine financial knowledge.
4. As a visual learner, I want to watch lightweight, fast-loading educational explainer videos on market regimes and risk management, so that I can learn through multimedia without slowing down the app.
5. As an active user, I want to see a live Market Pulse banner showing the current market regime (Bull, Bear, or Sideways), so that I instantly understand broader economic conditions.
6. As an active user, I want to receive real-time Smart Alerts when the market regime shifts or a high-quality stock enters an oversold zone, so that I know when to review my investments.

### Multi-Asset Exploration & Expanded Universe
7. As an investor, I want to explore Gold and Silver ETFs alongside NIFTY 50 equities, so that I can balance my equity portfolio with safe-haven precious metals.
8. As an investor interested in national industrial growth, I want to filter and inspect key Indian Defense stocks (HAL, BEL, BDL, Mazagon Dock) and Metals companies (Tata Steel, Hindalco), so that I can invest in strategic themes.
9. As an investor inspecting an asset, I want to view its 360° Intelligence Profile with probabilistic forecast cones (10th, 50th, 90th percentiles), ESG Conscience score, and regime suitability, so that I have a complete picture of risk and reward.
10. As an academic reviewer or quantitative trader, I want to open the collapsible "Advanced Analysis" studio within the Explore tab, so that I can inspect the Gaussian Mixture Model radar and backtest technical trading strategies.

### Portfolio Basket Generation & Explainability
11. As a retail investor, I want to input my investment capital (e.g. ₹50,000) and choose a risk persona (Conservative, Balanced, Aggressive, or ESG-Conscious), so that the AI generates an optimal asset basket tailored to current market conditions.
12. As a socially responsible investor, I want to select the ESG-Conscious persona, so that the HRP allocation tilts weight toward companies with top Environmental, Social, and Governance ratings.
13. As a practical investor ready to trade on Zerodha or Groww, I want the basket to output exact integer share quantities and leftover cash buffer, so that I can execute orders immediately without dealing with fractional shares.
14. As a retail investor, I want every recommendation to include a 4-Pillar Trust Card, so that I understand the backtested accuracy, drawdown limits, and fee savings compared to traditional bank wealth managers.

### Multi-Portfolio Management & Live MTM Tracking
15. As a goal-oriented saver, I want to create and manage multiple named portfolios (e.g. "Child Education", "Retirement Fund", "Tech Growth"), so that I can track separate financial goals independently.
16. As a portfolio tracker, I want to see my portfolio update in real-time with Day-over-Day ($1\text{D}$) P&L and Overall P&L in Indian Rupee format, so that I can monitor daily market changes just like on Groww.
17. As an investor during market transitions, I want to receive an interactive before/after visual rebalance diff when the market regime shifts, so that I can re-align my holdings in one click.
18. As an investor, I want to export a branded, downloadable PDF/image Portfolio Report Card to share on WhatsApp or keep for offline review.

### AI Review Fact-Checking & Community Transparency
19. As a platform user, I want to read community reviews on AI baskets to see how they performed for other simulated users, so that I can gauge community sentiment and strategy satisfaction.
20. As a user submitting a review stating my portfolio grew by X%, I want the AI Fact-Checking Agent to verify my claim against actual historical performance data, so that truthful experiences are certified and honored.
21. As a reader of community reviews, I want to see verified badges on authentic reviews and know that fraudulent "+50% in a week" claims have been rejected, so that I can trust the community feedback.

### Android Native Feel & RAG Assistance
22. As an Android phone user, I want QuantNiti to feel like a native app with smooth touch physics, haptic vibrations, standalone display, and responsive bottom tabs, so that I get a premier app experience without an APK download.
23. As an investor with questions, I want to ask NitiBot natural-language questions (e.g. "Why is Gold included in my basket?"), so that I receive transparent, data-grounded explanations.

---

## Implementation Decisions

### 1. Architectural Tiers & Navigation
- **Thin Mobile Client Architecture**: Vanilla ES Modules + HTML5 + CSS3 design system inspired by Groww (`#00D09C` mint green, `#121212` / `#1E1E24` dark theme, 16px radius cards, hairline borders).
- **Navigation Structure**: 4 primary tabs: `[Home]`, `[Explore]`, `[Grow]`, `[Portfolio]`.
- **Server-Side ML Execution**: All GMM regime inference, Ledoit-Wolf HRP optimization, factor ranking, and fact-checking logic reside exclusively on the FastAPI backend (response times $<30\text{ ms}$).

### 2. Multi-Asset Universe Expansion (`universe.py`)
- Extends the existing 50 NIFTY equities to include:
  - **Commodity ETFs**: `GOLDBEES.NS`, `SILVERBEES.NS`.
  - **Defense Equities**: `HAL.NS`, `BEL.NS`, `BDL.NS`, `MAZDOCK.NS`, `COCHINSHIP.NS`.
  - **Metals Equities**: `TATASTEEL.NS`, `HINDALCO.NS`, `JSWSTEEL.NS`, `VEDL.NS`, `JINDALSTEL.NS`.
- All assets carry standardized historical daily OHLCV series, factor metrics, and ESG score vectors.

### 3. Real-Time Streaming & Smart Alerts Engine
- **Server-Sent Events (SSE)** endpoint (`/api/v1/stream/ticks`) dispatches 3–5 second price ticks with DOM flash highlighting.
- **60-Second Micro-Batch Evaluator**: Background APScheduler evaluates regime shifts, RSI extremes ($<28$ / $>72$), weight drift ($>\pm 5\%$), drawdown limits, and multi-factor anomalies, pushing live toast alerts and Web Push notifications.

### 4. Persistent Multi-Portfolio Storage (SQLite + IndexedDB)
- Replaces ephemeral server session storage with a relational SQLite database (`portfolios`, `holdings`, `transactions`, `daily_snapshots`).
- Local-First sync with browser `IndexedDB` enables instantaneous loading and offline inspection.

### 5. Compounding & Long-Horizon Wealth Projection Engine
- Mathematical calculation of Lump Sum, monthly SIP, and annual Step-Up SIP trajectories over 1 to 10-year horizons.
- Geometric Brownian Motion (GBM) quantile cones: 10th (Pessimistic), 50th (Base), and 90th (Optimistic) percentiles based on backtested basket volatility and drift.
- Rendered via Chart.js hardware-accelerated canvas with touch tooltips and invested capital baseline.

### 6. AI Review Verification & Ground-Truth Fact-Checking Agent
- Multi-tier moderation pipeline:
  1. *Tier 1 (Deterministic)*: Scrub contact details, Telegram links, profanity, and explicit stock tips.
  2. *Tier 2 (NLP Claim Extraction & Historical Query)*: Extract claimed percentage return ($\Delta\%$) and duration ($T$). Query actual basket historical return over that period. If $|\text{Claim} - \text{Actual}| \le 3\%$, mark verified. If deviation $>3\%$, flag or reject.
  3. *Tier 3 (LLM Compliance Check)*: Gemini 2.5 Flash validates tone, ensuring no promissory or guaranteed language.

---

## Testing Decisions

### Seams Under Test
1. **API / Service Boundary (`/api/v1/*`)**:
   - `GET /api/v1/stream/ticks`: SSE streaming format conformance (`data: {...}\n\n`).
   - `POST /api/v1/portfolio/create`, `GET /api/v1/portfolios`, `POST /api/v1/portfolio/{id}/rebalance`: Multi-portfolio CRUD, MTM calculations, integer share sizing.
   - `POST /api/v1/portfolio/compounding`: Mathematical accuracy of SIP and Lump Sum formula outputs against verified mathematical benchmarks.
   - `POST /api/v1/reviews/submit`: NLP fact-checking agent accuracy (approving claims matching historical data within $\pm 3\%$, rejecting exaggerated $+50\%$ claims).
   - `POST /api/v1/grow/basket`: HRP allocation across expanded multi-asset universe including gold/silver ETFs and defense stocks.
2. **Client Component Seam**:
   - Mobile touch interactions, tab switching, Chart.js canvas rendering, and PWA service worker caching.

---

## Out of Scope

- Automated live broker trade routing / real-money demat execution.
- Futures & Options (F&O) derivatives pricing.
- Continuous tick-by-tick microsecond algorithmic order execution.
- Native App Store publishing (Google Play / Apple App Store) — PWA and TWA distribution only.
