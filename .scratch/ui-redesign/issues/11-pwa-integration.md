# 11: PWA Finalization — Service Worker, Offline, Install & Integration Tests

**What to build:** The PWA infrastructure updated for the new React + Vite build output. Service worker precaches the new asset bundle. Offline fallback works. Install prompts (Android beforeinstallprompt + iOS Safari banner) work. Theme color is violet. The full app is integration-tested end-to-end: all tabs render, all modals open/close, theme toggle works, onboarding flow completes, Grow wizard generates a basket, Portfolio shows demo and real states, and async cleanup fires on tab switch.

**Blocked by:** 05-hero-onboarding, 06-home-tab, 07-explore-tab, 08-grow-tab, 09-portfolio-tab, 10-modals-overlays

**Status:** resolved

- [x] Vite PWA plugin (or manual) generates a service worker that precaches all built assets
- [x] `offline.html` fallback updated with violet theme
- [x] `manifest.json` updated: theme_color and background_color to violet, icons preserved or regenerated
- [x] `beforeinstallprompt` event intercepted for custom install button in overflow menu
- [x] iOS Safari install banner preserved with violet styling
- [x] Web Push subscription flow preserved
- [x] **Integration test suite** (Vitest + React Testing Library):
  - [x] Onboarding: first visit → quiz → Home; second visit → straight to Home
  - [x] Home tab: market pulse renders, regime radar renders, adaptive card switches
  - [x] Explore tab: stock cards render, search filters, Pro Tools toggles
  - [x] Grow tab: wizard navigates 3 steps, generates basket (mock API), results render, deep dive accessible
  - [x] Portfolio tab: Demo Portfolio shown initially, real portfolio shown after creation
  - [x] Tab switching: smooth transitions, no console errors, abort fires on in-flight operations
  - [x] Theme toggle: light ↔ dark, persists across reload
  - [x] Modals: open via triggers, close via backdrop/back/X, no scroll bleed
- [x] Lighthouse PWA audit passes (installability, offline capability, theme-color)
- [x] Performance: bundle size audit, lazy loading for heavy components (backtester, report template)
- [x] Old vanilla JS files (index.html, app.js, styles.css) archived or removed
