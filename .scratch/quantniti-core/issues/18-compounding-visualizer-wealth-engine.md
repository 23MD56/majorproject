# 18: Compounding Visualizer & Wealth Growth Engine

**What to build:** Build an interactive Compounding and Long-Horizon Wealth Projection engine. Provide both a standalone interactive SIP and Lump Sum compounding calculator in the Home tab's Learning Hub (modeling monthly investment, expected return, tenure 1–10 years, and annual step-up percentage) and per-portfolio long-horizon growth projections with 3-tier uncertainty cones (10th, 50th, 90th percentiles).

**Blocked by:** 04: AI Portfolio Basket Engine & Trust Card, 16: Groww-Inspired Mobile UI Redesign & 4-Tab Navigation

**Status:** done

- [x] Implements `POST /api/v1/portfolio/compounding` endpoint calculating future values for Lump Sum, monthly SIP, and annual Step-Up SIP ($g=10\%$), alongside invested principal and wealth gain.
- [x] Computes Geometric Brownian Motion (GBM) quantile growth cones (10th percentile Pessimistic, 50th percentile Base, 90th percentile Optimistic) for portfolio-level projections over 1 to 10-year horizons.
- [x] Builds the interactive Compounding Visualizer card in the Learning Hub with monthly SIP slider, tenure slider (1–10Y), step-up toggle, and Chart.js filled area fan chart.
- [x] Displays the psychological "Compounding Tipping Point" indicator highlighting the exact month where total interest earned exceeds cumulative principal invested.
- [x] Integrates the compounding projection into the Portfolio tab, showing the user's active portfolio trajectory against a 7% Bank Fixed Deposit hurdle.
- [x] Passes automated mathematical verification tests: SIP outputs match standard financial formulas within ₹1.00 tolerance across multiple horizons and rates.
