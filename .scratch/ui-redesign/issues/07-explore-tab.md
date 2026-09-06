# 07: Explore Tab — Redesigned Stock Cards & Pro Tools Toggle

**What to build:** The Explore tab rebuilt with redesigned stock cards that are visual, less data-dense, and beginner-friendly. Each card shows the stock name, current price, and regime suitability as a color-coded visual badge (not a raw number). The Quant Lab Strategy Backtester is hidden behind a "Pro Tools" toggle — collapsed by default. Search and sector filter chips work as before but styled with the new design system.

**Blocked by:** 02-layout-shell, 03-shared-components, 04-async-lifecycle

**Status:** resolved

- [x] `<ExplorePage>` component with search bar and sector filter chip row (horizontally scrollable)
- [x] `<StockCard>` redesigned: larger squircle card (`rounded-2xl`), stock name in bold, price with animated ticker, regime suitability as a visual badge (green "Strong Buy" / amber "Hold" / rose "Caution"), 6M forecast range as a compact progress bar — not raw percentages
- [x] Stock cards in a responsive grid (1 col mobile, 2 col tablet) with Framer Motion staggered entrance
- [x] Tapping a stock card opens the `<StockProfileModal>` (rebuilt as a ModalSheet component)
- [x] Stock profile modal: 360° intelligence profile with forecast cones chart, technical factors grid, ESG breakdown — all using new theme tokens
- [x] Race condition fix: rapid stock card taps only render the latest stock's profile data (stale-response guard from ticket 04)
- [x] `<ProToolsToggle>` — a collapsible section at the bottom: "Pro Tools: Quant Lab Backtester" with a chevron toggle. Default: collapsed. Expanding reveals the strategy backtester (Moving Average Crossover, RSI Mean Reversion, Dual Momentum)
- [x] Backtester functionality preserved: asset dropdown, strategy selector, slippage input, equity curve chart, drawdown chart, regime attribution table
- [x] Search input filters stocks in-memory (existing `filterStocks` logic ported to React)
- [x] Sector filter chips filter the stock grid
- [x] Test: stock cards render with correct regime badges, Pro Tools toggle hides/shows backtester
