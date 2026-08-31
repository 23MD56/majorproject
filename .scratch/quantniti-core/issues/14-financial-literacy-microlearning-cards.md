# 14: Financial Literacy Microlearning Cards

**What to build:** A contextual financial education system that surfaces bite-sized learning cards alongside every recommendation, technical metric, and jargon term in the QuantNiti UI. When a user encounters an unfamiliar concept (e.g. "HRP Optimization", "Sharpe Ratio", "Market Regime"), tapping the contextual "Learn" icon expands an inline educational card explaining the concept in plain language with a relatable analogy. NitiBot can also reference and surface these cards in its conversational responses.

**Blocked by:** 07: Unified Mobile-First Client Shell & End-to-End Integration

**Status:** ready-for-agent

- [ ] Creates a static `literacy_cards.json` knowledge base containing ~30 curated micro-lessons, each with fields: `key` (concept identifier, e.g. `hrp`, `sharpe_ratio`, `market_regime`, `max_drawdown`, `esg`, `quantile_regression`, `diversification`, `rebalancing`, `bull_market`, `bear_market`, `sideways_market`, `volatility`, `cagr`, `sortino_ratio`, `risk_persona`, `trust_card`, `black_litterman`, `portfolio_basket`, `growth_projection`, `regime_shift`, `order_sheet`, `nifty_50`, `fii_dii`, `india_vix`, `moving_average`, `rsi`, `bollinger_bands`, `momentum`, `backtesting`, `paper_portfolio`), `title`, `explanation` (2–4 sentences, no jargon), `analogy` (1 sentence relatable comparison), `related_keys` (list of related concept keys).
- [ ] Adds contextual "Learn" icons (ℹ️ circle) adjacent to technical terms across the Grow, Explore, Quant Lab, and Portfolio tabs. Tapping the icon expands an inline glassmorphism card below the term showing the title, explanation, and analogy.
- [ ] Cards are dismissible and do not disrupt the primary user flow.
- [ ] Implements a `GET /api/v1/literacy/{key}` endpoint returning the card data for a given concept key, enabling NitiBot to retrieve and reference cards in conversational responses.
- [ ] Mobile-responsive card design: on mobile, cards span full width below the trigger element; on desktop sidebar layout, cards appear as a right-aligned popover.
- [ ] No external API dependency — the knowledge base is a static JSON file served from the static directory.
- [ ] Passes automated tests: all concept keys referenced in the UI have a matching entry in `literacy_cards.json`, API endpoint returns valid data for known keys and 404 for unknown keys.
