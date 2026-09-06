# 01: React + Vite Scaffold with Tailwind & Violet Design Tokens

**What to build:** A working React + Vite project that replaces the vanilla JS monolith. The user can run `npm run dev` and see an empty app shell with the correct violet/indigo theme (light default, dark toggle) rendering in a mobile-first PWA viewport. No content yet — just the scaffold, design tokens, and build pipeline. The existing FastAPI backend serves the new Vite-built assets from the same `/static/` path.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Vite + React 18 project initialized inside the existing repo structure, configured to output to `src/app/static/`
- [x] Tailwind CSS v3 installed via Vite (not CDN) with a `tailwind.config.js` defining custom design tokens: violet accent (`#7C3AED`), indigo secondary (`#6366F1`), semantic green/red for profit/loss, light/dark theme CSS variables, corner radii scale (16px, 20px, 24px), and motion tokens
- [x] Lucide React installed (tree-shakeable, replaces CDN lucide)
- [x] Framer Motion v11+ installed
- [x] Chart.js + react-chartjs-2 installed
- [x] Zustand installed with an initial `useAppStore` matching the shape of the existing `AppState` object
- [x] A `<ThemeProvider>` component that reads/writes `data-theme` attribute and persists to localStorage, defaulting to light
- [x] The `manifest.json` updated with violet theme color
- [x] FastAPI's static file serving updated to serve the Vite build output
- [x] `npm run dev` renders a blank themed shell; `npm run build` produces production assets
