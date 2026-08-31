# Cross-Platform PWA with Adaptive Desktop Layout

We distribute QuantNiti as a Progressive Web App (PWA) installable on Android, iOS, and desktop, with an adaptive layout that transitions from mobile bottom-tab to desktop sidebar navigation.

## Context

The project review panel specifically requested a mobile application. Building a native app (React Native, Flutter, Swift, Kotlin) would require rewriting the UI, maintaining a separate codebase, and dealing with app store review — scope that is disproportionate for a BTech final year project. The current FastAPI full-stack architecture already serves a mobile-first web UI from the same process.

## Decision

1. **PWA over native app**: A `manifest.json` + `sw.js` configuration makes the existing web UI installable as a standalone app on Android (via Chrome "Add to Home Screen"), desktop (via Chrome/Edge install), and iOS (via Safari "Add to Home Screen"). No separate codebase, no app store approval.
2. **Adaptive responsive layout**: On viewports ≥ 1024px, the mobile bottom tab bar collapses into a persistent 240px left sidebar with icon + label navigation. Content area fills the remaining width. This ensures the "web app for laptops" use case is well-served without breaking the mobile experience.
3. **Offline resilience via service worker**: The app shell (HTML, CSS, JS, CDN fonts) is cached during the `install` event. The `fetch` handler serves cached content when offline, with a custom fallback page.
4. **iOS-specific guidance**: Since Safari does not support `beforeinstallprompt`, a custom in-app banner detects Safari and guides users through the manual install flow.

## Consequences

- The app is not available on Google Play or the Apple App Store (PWA-only distribution). This is acceptable for an academic project.
- Service worker caching introduces a cache invalidation concern — mitigated by `skipWaiting()` and versioned cache keys.
- The sidebar layout requires additional CSS but no structural HTML changes.
