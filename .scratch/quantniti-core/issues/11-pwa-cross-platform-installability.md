# 11: PWA Cross-Platform Installability (Mobile + Desktop)

**What to build:** Configure Progressive Web App assets and adaptive responsive layout so that QuantNiti can be installed as a standalone fullscreen application on Android phones, iOS devices, and desktop laptops/PCs — all from the same codebase. On desktop viewports (≥ 1024px), the bottom tab bar collapses into a persistent left sidebar with expanded labels and the content area widens for comfortable laptop usage.

**Blocked by:** 07: Unified Mobile-First Client Shell & End-to-End Integration

**Status:** ready-for-agent

- [x] Creates `manifest.json` specifying `name: "QuantNiti"`, `short_name: "QuantNiti"`, `display: "standalone"`, `theme_color: "#09090b"`, `background_color: "#09090b"`, `start_url: "/"`, `id: "quantniti"`, and responsive icon entries (192×192, 512×512, maskable).
- [x] Creates `sw.js` service worker: caches app shell (HTML, CSS, JS, font CDNs) during `install` event, serves cached assets on `fetch` with network-first fallback, provides a custom offline fallback page, and calls `self.skipWaiting()` for immediate activation.
- [x] Links `manifest.json` in `index.html` `<head>`, registers service worker on `DOMContentLoaded`, and adds Apple-specific meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`).
- [x] Implements iOS install banner: detects Safari standalone-capable browsers lacking `beforeinstallprompt` support and renders an in-app dismissible banner guiding users through Share → "Add to Home Screen."
- [x] Implements desktop install: intercepts the `beforeinstallprompt` event, defers it, and presents a custom branded "Install QuantNiti" button in the header when the prompt is available.
- [x] Adds responsive desktop layout via CSS media query (`@media (min-width: 1024px)`): bottom tab bar becomes a persistent 240px left sidebar with icon + label navigation, main content area fills remaining width, and cards/charts scale to wider breakpoints.
- [x] FastAPI serves `manifest.json` and `sw.js` from the static directory with correct MIME types.
- [x] Verified: Lighthouse PWA audit achieves 100/100 installability score on both mobile and desktop emulation.

