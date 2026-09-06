# 09: Portfolio Tab — Demo Portfolio, MTM Tracker & Compounding Charts

**What to build:** The Portfolio tab rebuilt with two modes: (1) a pre-populated Demo Portfolio for first-time users who haven't created their own portfolio yet, and (2) the full MTM tracker for users with real Virtual Paper Portfolios. The Demo Portfolio shows realistic synthetic data with a "This is a demo — build your own!" banner. When the user creates their first portfolio (via Grow → "Track in Portfolio"), the Demo disappears and their real portfolio takes over. All existing portfolio features (hero card, holdings table, rebalance alerts, 10-year compounding chart) are preserved with new design tokens and animations.

**Blocked by:** 02-layout-shell, 03-shared-components, 04-async-lifecycle

**Status:** resolved
Assigned: Developer 1

- [x] `<PortfolioPage>` component that checks whether any real Virtual Paper Portfolio exists in Zustand state
- [x] **Demo Portfolio state** (no real portfolio): `<DemoPortfolio>` component rendering:
  - [x] Visual banner: "This is a demo portfolio — see what tracking looks like! [Build Your Own →]" (navigates to Grow tab)
  - [x] 5–7 synthetic NIFTY 50 bluechip holdings with realistic prices, day changes, and weights
  - [x] Read-only hero card with demo badge, current value, 1D return, total return, invested capital, cash buffer
  - [x] Holdings table showing allocation, LTP, 1D return, total return
  - [x] 10-year compounding trajectory chart showing base case vs Bank FD hurdle
- [x] **Real Portfolio state** (≥1 real portfolio exists):
  - [x] Multi-portfolio dropdown/tab switcher + "New Goal" button (opens portfolio creation modal)
  - [x] Dual-Metric Hero Card (current value, 1D return, total return, invested capital, cash buffer, alpha vs NIFTY)
  - [x] Regime-Shift Rebalance banner ("Alert: Regime shift detected. Recommended rebalancing available [Review / Apply Rebalance]")
  - [x] Holdings table with real/simulated weights, P&L, day changes
  - [x] 10-year compounding trajectory chart powered by `/api/portfolio/compounding`
- [x] Portfolio creation (from Grow tab or modal) automatically persists and hides Demo Portfolio
- [x] Delete portfolio button with confirmation dialog; falls back to Demo Portfolio when 0 real portfolios remain
- [x] Automated tests covering Demo state, Real state, tab switching, and empty state fallback
- [x] Responsive layout with mobile-first design and desktop constraint (`max-w-[520px]`)
