# 09: Portfolio Tab — Demo Portfolio, MTM Tracker & Compounding Charts

**What to build:** The Portfolio tab rebuilt with two modes: (1) a pre-populated Demo Portfolio for first-time users who haven't created their own portfolio yet, and (2) the full MTM tracker for users with real Virtual Paper Portfolios. The Demo Portfolio shows realistic synthetic data with a "This is a demo — build your own!" banner. When the user creates their first portfolio (via Grow → "Track in Portfolio"), the Demo disappears and their real portfolio takes over. All existing portfolio features (hero card, holdings table, rebalance alerts, 10-year compounding chart) are preserved with new design tokens and animations.

**Blocked by:** 02-layout-shell, 03-shared-components, 04-async-lifecycle

**Status:** ready-for-agent

- [ ] `<PortfolioPage>` component that checks whether any real Virtual Paper Portfolio exists in Zustand state
- [ ] **Demo Portfolio state** (no real portfolio): `<DemoPortfolio>` component rendering:
  - A persistent banner: "📊 This is a demo portfolio — see what tracking looks like! [Build Your Own →]" (CTA navigates to Grow tab)
  - Pre-populated synthetic holdings: 5–7 NIFTY 50 stocks with realistic prices, shares, P&L values
  - Functional (but read-only) hero card, holdings table, and compounding chart using synthetic data
  - Banner and demo data styled with a subtle dashed border or visual distinction so user knows it's not real
- [ ] **Real Portfolio state** (portfolio exists): Full MTM tracker:
  - Multi-portfolio selector dropdown + "New Goal" button + Report/Share/Order Sheet buttons
  - Groww-Style Dual-Metric Hero Card: current value (Indian number format), 1D return badge, overall return badge, invested capital, cash buffer, alpha vs NIFTY
  - Regime-Shift Rebalance Alert Banner: status badge (In Sync / Rebalance Recommended), reason text, "Apply Rebalance" action
  - Active Holdings Breakdown Table: stock, shares, price, value, 1D return, overall P&L
  - 10-Year Long-Horizon Wealth Trajectory: GBM quantile cones (Q10, Q50, Q90) vs 7% Bank FD hurdle, Chart.js chart
- [ ] Portfolio creation (from Grow → "Track in Virtual Paper Portfolio") stores portfolio in Zustand + localStorage, auto-hides Demo Portfolio
- [ ] Delete portfolio button with confirmation, reverts to Demo Portfolio if last portfolio deleted
- [ ] All chart instances properly destroyed on unmount via useEffect cleanup
- [ ] Test: Demo Portfolio renders when no portfolio exists, disappears when portfolio is created, reappears when last portfolio is deleted
