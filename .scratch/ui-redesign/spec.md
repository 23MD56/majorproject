# QuantNiti UI Redesign — Full Spec

**Status:** ready-for-agent

## Problem Statement

QuantNiti's current frontend is a monolithic vanilla JS Single-Page Application (index.html: 2,122 lines, app.js: 3,651 lines, styles.css: 1,612 lines) that feels "boxy" and AI-generated. The green Groww-mint accent (#00D09C) is embedded across 160+ hardcoded Tailwind classes, 6 Chart.js hex references, and dozens of JS template strings. The Grow and Portfolio pages dump all information upfront, overwhelming the target audience — complete financial beginners in India. There is no hero/landing experience, no onboarding flow, and no cleanup of async operations when users switch tabs mid-execution. The app needs to feel like a polished, installable mobile app, not a prototype.

## Solution

Migrate the frontend to React + Vite with Framer Motion animations, a violet/indigo (`#7C3AED` / `#6366F1`) accent theme (light default, dark toggle), a first-visit animated onboarding hero with a persona quiz, guided multi-step flows for the Grow page, a pre-populated Demo Portfolio for the Portfolio page, redesigned Explore stock cards, simplified header, and a general `AbortController` cleanup pattern for all async operations. The PWA capability (installable mobile app, offline support, Web Push) is preserved and enhanced throughout.

## User Stories

1. As a first-time user, I want to see a beautiful animated hero welcome page, so that I feel confident the app is trustworthy before diving into financial data.
2. As a financial beginner, I want to answer 3 simple scenario-based questions (not jargon), so that my Risk Persona is determined without me needing to understand volatility metrics.
3. As a returning user, I want to skip the onboarding hero entirely, so that I land directly on my Home dashboard without friction.
4. As a mobile user, I want smooth spring-based page transitions between tabs, so that the app feels native and responsive, not like a web page.
5. As a user on the Grow page, I want a guided multi-step wizard (capital → horizon → persona → results → deep dive), so that I'm not overwhelmed by 10+ dense sections at once.
6. As a beginner on the Grow wizard, I want quick-tap preset chips (₹10k, ₹25k, ₹50k, ₹1L) alongside the capital slider, so that I don't struggle with fine thumb-dragging on my phone.
7. As a user viewing Grow results, I want the allocation overview and growth projections shown first, with ESG, Trust Card, and benchmarks available as a "Deep Dive" step, so that I can progressively explore details at my own pace.
8. As a first-time Portfolio tab visitor, I want to see a pre-populated Demo Portfolio with realistic data, so that I understand what portfolio tracking looks like before committing to build my own.
9. As a user who built their first portfolio, I want the Demo Portfolio to automatically disappear and be replaced by my real Virtual Paper Portfolio.
10. As a user exploring stocks, I want visually appealing stock cards showing name, price, and regime suitability as a visual indicator (not a raw number), so that I can quickly scan without data overload.
11. As an advanced user, I want to access the Quant Lab Strategy Backtester, so that I can run Moving Average Crossover, RSI Mean Reversion, and Dual Momentum strategies — but only when I explicitly opt in via a "Pro Tools" toggle.
12. As a user who taps "Generate AI Basket" and then switches tabs, I want the in-flight API call to be cleanly aborted, so that stale data doesn't render on the wrong tab.
13. As a user interacting with the stock profile modal, I want rapid successive taps on different stocks to always show the latest stock's data, not a race-conditioned stale response.
14. As a user chatting with NitiBot, I want the send button disabled while awaiting a response, so that I can't accidentally submit duplicate messages.
15. As a mobile user, I want the app's accent color to be violet/indigo throughout UI chrome (buttons, active tabs, borders, progress bars), so that the app has a distinctive, premium identity.
16. As a user, I want profit indicators to remain green and loss indicators to remain red, so that financial data follows the universal convention I already understand.
17. As a user, I want light theme as the default with a toggle to switch to dark mode, so that the app feels clean and approachable on first launch.
18. As a user, I want the header to show only the regime badge, notification bell, and theme toggle, so that I'm not distracted by secondary actions.
19. As a user, I want Compare, Install PWA, and Viewport toggle accessible from an overflow menu, so that they're available but not cluttering the primary header.
20. As a mobile PWA user, I want to install the app to my home screen and have it work offline, so that it feels like a native Android/iOS app.
21. As a user navigating between wizard steps, I want completed steps to collapse into editable summary pills (e.g., "✓ Capital: ₹50,000 • Edit"), so that I can review and change previous choices without losing my place.
22. As a user, I want number values on sliders to animate with a smooth ticker roll (not instant jumps), so that the interaction feels tactile and responsive.
23. As a user who completed the persona quiz, I want my Grow wizard to pre-select that persona, but I want to freely change it per basket without warnings, so that I'm not locked in.
24. As a user, I want cards with generous corner radii (24px), subtle violet-tinted tonal surfaces, and hairline borders instead of heavy box shadows, so that the UI feels organic and modern, not boxy.
25. As a user with reduced-motion preferences, I want animations to be suppressed or minimized, so that the app respects my accessibility settings.
26. As a user, I want haptic feedback on tab switches, button presses, and wizard step transitions (on supported devices), so that the app feels tactile.
27. As a user on the wizard's time horizon step, I want relatable context labels (e.g., "Strategic Stance — Balances market swings with regime alpha") alongside the duration, so that I understand why I'm choosing a horizon.
28. As a user on the risk persona step, I want visual badges with icons and plain-language drawdown descriptions (e.g., "Capital preservation first. -3% max drawdown"), so that I understand risk without financial jargon.
29. As a user, I want the capital display to show both the numeral and the word form (₹50,000 — Fifty Thousand Only), so that I'm confident I haven't added an extra zero by mistake.

## Implementation Decisions

### Architecture Migration
- Migrate from vanilla JS monolith (index.html + app.js + styles.css) to **React 18+ with Vite** build toolchain.
- Component architecture: decompose the 2,122-line HTML into a React component tree organized by feature (layout shell, tabs, wizard, modals, cards).
- State management: **Zustand** — lightweight, fits the existing global `AppState` pattern without Redux boilerplate.
- Routing: **React Router v6** with hash-based routing to preserve PWA deep-link support (`/#grow`, `/#explore`, `/#portfolio`).
- Styling: **Tailwind CSS v3** (installed via Vite, not CDN) with custom design tokens in `tailwind.config.js`. All 160+ hardcoded emerald classes replaced with semantic token classes (`text-accent`, `bg-accent/10`, etc.) mapped to violet/indigo.
- Icons: **Lucide React** (tree-shakeable, replaces CDN-loaded lucide).
- Charts: **Chart.js + react-chartjs-2** wrapper. All `#00D09C` hex references in chart configs replaced with theme-aware token values.
- Animations: **Framer Motion v11+** for page transitions, component entrances, wizard step slides, and micro-interactions.

### Design System & Theme
- Primary accent: `#7C3AED` (violet-600) with gradient variant `from-violet-500 to-indigo-500`.
- Light theme (default): white/slate canvas (`#F8FAFC` primary, `#FFFFFF` cards), violet accent, green/red financial semantics.
- Dark theme (toggle): obsidian slate canvas (`#0A0D14`), violet-tinted card surfaces (`#121124`), same violet accent.
- Card styling: `rounded-3xl` (24px), hairline borders (`border-violet-400/20`), subtle inner-top highlight, no heavy box shadows.
- Motion tokens: spring preset (stiffness: 300, damping: 25), fade duration: 0.3s, slide distance: 20px.

### Hero Onboarding Flow
- Full-screen animated hero shown only on first visit (gated by `localStorage` flag `quantniti_onboarded`).
- 3 steps: (1) Welcome splash with value prop and animated illustrations, (2) 3-question scenario-based persona quiz, (3) "Your personalized dashboard is ready" with smooth transition into Home tab.
- Quiz results stored in Zustand state and `localStorage`, pre-selecting the Grow wizard's Risk Persona control.
- Returning users skip directly to Home tab.

### Grow Page Guided Flow
- Converted from a single scrollable card into a multi-step experience:
  - **Step 1 (Inputs)**: Multi-step wizard cards — capital (with quick-pick chips + word-form reassurance), horizon (contextual cards with relatable descriptions), persona (visual badges with icons and plain-language tolerance).
  - **Step 2 (Results Overview)**: Allocation donut chart + stock pills + 3-tier probabilistic growth scenarios + cash buffer summary.
  - **Step 3 (Deep Dive)**: ESG Conscience Score, 4-Pillar Trust Card, benchmark comparison, community reviews.
- Segmented progress bar at top (Instagram Stories style — 3 equal-width dashes).
- Completed wizard steps collapse into editable summary pills.
- Horizontal slide transitions between steps using Framer Motion `AnimatePresence`.

### Portfolio Page
- **Empty state**: Pre-populated Demo Portfolio (read-only, synthetic data, "build your own" banner with CTA to Grow).
- Demo Portfolio auto-replaced when user creates their first real Virtual Paper Portfolio.
- Existing portfolio views (hero card, holdings table, rebalance alerts, compounding chart) remain but inherit new design tokens and animations.

### Explore Page
- Stock cards redesigned: larger corner radius, visual regime suitability indicator (color-coded badge, not raw number), cleaner typography hierarchy.
- Quant Lab Strategy Backtester hidden behind a "Pro Tools" toggle — collapsed by default, accessible on demand.

### Header Simplification
- Visible: Brand logo/badge, regime badge (clickable), notification bell, theme toggle.
- Overflow menu (⋮): Compare vs Competitors, Install PWA, Viewport toggle.

### Edge Case & Async Cleanup
- Global `AbortController` registry keyed by operation type (e.g., `basket-generation`, `stock-profile`, `portfolio-refresh`).
- `switchTab()` aborts all in-flight controllers.
- Stock profile modal: stale-response gating — check `AppState.selectedStockSymbol === requestedSymbol` before rendering.
- NitiBot: disable send button during await, re-enable on response/error.
- 45-second alert polling interval: store interval ID in Zustand, clear on component unmount.
- Chart.js instances: React `useEffect` cleanup destroys charts on unmount.

### PWA Preservation
- `manifest.json` updated with new theme color (violet), new icon set (if regenerated), same standalone display mode.
- `sw.js` service worker updated to precache new Vite-built assets.
- Web Push, haptic feedback, iOS install banner, and offline fallback preserved.

## Testing Decisions

### Testing Philosophy
- Tests verify **behavior through public interfaces**, not implementation details.
- Code can change entirely; tests shouldn't break unless behavior changed.
- Test names use the project's domain glossary (e.g., "Portfolio Basket", "Risk Persona", "Demo Portfolio").

### Test Seams
1. **React component rendering seam**: Test each page/feature component's rendered output and user interactions using React Testing Library + Vitest. This is the primary seam — the highest point we can test at.
2. **Zustand store seam**: Test state transitions (tab switching, persona selection, portfolio creation) through the store's public API.
3. **Async operation lifecycle seam**: Test that `AbortController` cancellation works correctly when tabs switch during in-flight operations.
4. **Theme system seam**: Test that design token CSS variables resolve correctly for both light and dark themes.

### What We Test
- Hero onboarding: renders on first visit, skips on return, quiz results persist.
- Grow guided flow: step navigation (forward/back), input persistence across steps, abort on tab switch.
- Portfolio Demo: renders demo when no real portfolio exists, disappears when real portfolio is created.
- Explore cards: search filtering, sector filtering, Pro Tools toggle.
- Tab switching: correct panel visibility, abort of in-flight operations.
- Theme toggle: CSS variable values switch, localStorage persistence.

### Prior Art
- No existing frontend tests in the codebase. Backend tests exist in `tests/` using pytest.
- Testing stack for new React frontend: **Vitest** (test runner) + **React Testing Library** (component testing) + **jsdom** (DOM environment).

## Out of Scope

- **Backend API changes**: All existing FastAPI endpoints remain unchanged. No new API contracts.
- **ML model changes**: Regime classifier, factor scoring, Monte Carlo simulations — untouched.
- **Real trading integration**: This remains a virtual paper trading platform.
- **User authentication/profiles**: No login system, no server-side user profiles. All personalization via localStorage.
- **NitiBot redesign**: The RAG chatbot's UX stays as-is (floating button → modal sheet), just re-themed.
- **Custom icon/logo design**: Using existing brand assets, re-colored to violet.
- **App Store deployment**: This is a PWA installable from the browser, not a native app store listing.

## Further Notes

- The user emphasized this is entering **customer engagement scope** — real users will interact with this app. Quality, polish, and edge-case handling matter.
- The target audience is **completely new to finance** — every design decision prioritizes cognitive simplicity over information density.
- The app must remain a **mobile-first installable PWA** — performance on mid-range Android devices is critical.
- The existing Python backend (FastAPI + ML pipeline) is the stable foundation; only the frontend is being rebuilt.
- The design research identified CRED, Groww, Jupiter, Fi Money, INDmoney, and Material Design 3 Expressive as key inspiration sources.
