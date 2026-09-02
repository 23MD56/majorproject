# 14: Financial Literacy Microlearning Cards & Home Tab Learning Hub

**What to build:** A comprehensive beginner financial education system featuring a prominent "Learning Hub" carousel on the Home tab, video facade explainers, and inline contextual learning cards across the QuantNiti interface. When users encounter unfamiliar concepts or want to learn investing fundamentals, the Learning Hub provides bite-sized, plain-language lessons with real-world analogies (e.g. comparing HRP diversification to a cricket team), lightweight video facades, and a concept completion tracker. NitiBot can also reference and surface these cards in its conversational responses.

**Blocked by:** 07: Unified Mobile-First Client Shell & End-to-End Integration, 16: Groww-Inspired Mobile UI Redesign & 4-Tab Navigation

**Status:** closed

- [x] Creates a static `literacy_cards.json` knowledge base containing ~30 curated micro-lessons, each with fields: `key` (concept identifier), `title`, `explanation` (2–4 plain-English sentences), `analogy` (1 relatable everyday comparison), `category` (`basics`, `regimes`, `risk`, `quant`), and `related_keys`.
- [x] Builds the Learning Hub carousel on the Home tab dashboard with visual concept cards, progress indicators ("X of 30 concepts learned"), and quick-filter category pills.
- [x] Implements lightweight Video Facades (lazy-loaded thumbnails with play overlays) that only load video players when clicked, preserving mobile battery and network speed.
- [x] Adds contextual "Learn" chips adjacent to technical terms across Explore, Grow, and Portfolio tabs, expanding an inline card with analogy and an "Ask NitiBot" deep-dive button.
- [x] Implements `GET /api/v1/literacy/{key}` and `GET /api/v1/literacy/all` endpoints returning microlearning lesson data.
- [x] Persists user learning progress in client-side `localStorage` so completed lessons show a checkmark badge.
- [x] Passes automated tests: all concept keys have valid schema definitions, endpoints return 200 for valid keys and 404 for unknown keys.


