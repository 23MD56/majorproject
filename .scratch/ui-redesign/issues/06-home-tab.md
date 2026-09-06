# 06: Home Tab — Market Pulse, Regime Radar, Adaptive Cards & Learning Hub

**What to build:** The Home tab rebuilt in React with the new design system. The user lands here after onboarding (or directly if returning). Shows Market Pulse with live NIFTY 50 data, Market Regime Radar with probability bars, an adaptive card (onboarding CTA for new users, portfolio snapshot for returning users), top regime recommendations, the Learning Hub carousel with microlearning cards, the compounding visualizer, and video explainer facades. All sections use the new violet theme, GlassCard components, and Framer Motion staggered entrance animations.

**Blocked by:** 02-layout-shell, 03-shared-components, 04-async-lifecycle

**Status:** resolved

- [x] `<HomePage>` component with Framer Motion staggered children entrance
- [x] `<MarketPulse>` card: NIFTY 50 price + change fetched from `/api/v1/stream/ticks` SSE, animated number ticker, green/red styling based on direction
- [x] `<RegimeRadar>` card: 3 probability bars (Bull/Sideways/Bear) with animated width transitions, regime badge, description card
- [x] `<OnboardingCard>` (new users): "Start Your Investment Journey" with CTAs to Explore and Grow — hidden when portfolio exists
- [x] `<PortfolioSnapshot>` (returning users): 1D P&L, Overall P&L, Total Value, Alpha vs NIFTY — visible when portfolio exists
- [x] `<TopRecommendations>` card: top 3-5 regime-scored stocks with staggered list entrance, "View All 50 →" link to Explore
- [x] `<LearningHub>` section: mastery progress bar, category filter pills, horizontally scrollable microlearning card carousel, concept modal trigger
- [x] `<CompoundingVisualizer>` card: 3 sliders (SIP amount, tenure, expected return) with step-up toggle, animated result metrics, Chart.js fan chart
- [x] `<VideoFacades>` section: lazy-loaded video thumbnail cards in a grid
- [x] All API calls use the `useAbortableRequest` hook from ticket 04
- [x] Test: Home renders market data, adaptive card switches based on portfolio existence
