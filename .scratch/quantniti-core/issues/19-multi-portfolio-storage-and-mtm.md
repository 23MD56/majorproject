# 19: Persistent Multi-Portfolio Storage & Day-over-Day MTM Engine

**What to build:** Replace ephemeral in-memory session portfolios with a persistent relational SQLite store and local-first IndexedDB cache supporting multiple named goal portfolios per user (e.g. "Retirement SIP", "Emergency Buffer", "Defense Alpha"). Implement accurate Day-over-Day Mark-to-Market (MTM) calculations ($\Delta V_{1D}$ in ₹ and %) distinguishing today's change from overall all-time P&L.

**Blocked by:** 06: Virtual Paper Portfolio Simulator & Rebalancing, 16: Groww-Inspired Mobile UI Redesign & 4-Tab Navigation

**Status:** ready-for-agent

- [ ] Creates SQLite relational schema (`portfolios`, `holdings`, `transactions`, `daily_snapshots`) with SQLModel / SQLAlchemy models.
- [ ] Implements REST endpoints for full portfolio lifecycle: `POST /api/v1/portfolios` (create named portfolio), `GET /api/v1/portfolios` (list user portfolios), `GET /api/v1/portfolios/{id}` (fetch details with MTM), `DELETE /api/v1/portfolios/{id}`.
- [ ] Calculates Day-over-Day MTM: holding 1D P&L $\Delta V_{i, 1D} = N_i \cdot (P_{i, t} - P_{i, t-1})$ and aggregate portfolio 1D change $\Delta V_{1D} = \sum \Delta V_{i, 1D}$, distinguishing today's change from total unrealized P&L.
- [ ] Builds a Portfolio Switcher dropdown and "Create New Goal Portfolio" modal on the Portfolio tab.
- [ ] Implements Groww-style dual-metric hero card displaying Current Value, Today's Return ($\pm$₹, $\pm$\%), and Overall Return in Indian number format (`₹1,24,560.00`).
- [ ] Connects client-side IndexedDB caching so portfolio balances load instantly offline.
- [ ] Passes automated unit tests: multi-portfolio creation, transaction ledger consistency, holding calculations, and day-over-day P&L formulas.
