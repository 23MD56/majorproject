# 15: Sharable Portfolio Report Card (PDF/Image Export)

**What to build:** A one-click "Download Report" feature that generates a branded, professional QuantNiti portfolio intelligence report card as a downloadable PDF file, plus a "Share" button that produces a shareable image suitable for WhatsApp, Instagram, and other social platforms. The report card is generated entirely on the client side using `html2canvas` and `jspdf` — no server-side rendering dependency.

**Blocked by:** 04: AI Portfolio Basket Engine & Trust Card, 06: Virtual Portfolio Simulator & Rebalancing, 07: Unified Mobile-First Client Shell & End-to-End Integration

**Status:** ready-for-human

- [x] Adds a "Download Report" button on the Portfolio tab (and optionally on the Grow tab after basket generation) that, when clicked, renders a hidden report HTML template, captures it via `html2canvas`, and converts it to a multi-page PDF via `jspdf`.
- [x] Report card contents include: (1) QuantNiti branded header with logo and generation timestamp, (2) portfolio donut chart showing asset allocation, (3) growth projection bar/cone chart (Pessimistic/Base/Optimistic), (4) Trust Card 4-pillar summary, (5) portfolio-level ESG Conscience Score (if ESG ticket is complete), (6) current market regime badge, (7) key metrics table (total value, total return %, benchmark alpha), (8) branded watermark footer with SEBI disclaimer text.
- [x] Adds a "Share" button that generates a single-image capture (PNG) of the report card and triggers the Web Share API (`navigator.share`) with a pre-formatted message including the user's portfolio return and a link to QuantNiti. Falls back to a download-and-copy flow on browsers that do not support Web Share API.
- [x] Report card layout is fixed-width (optimized for A4 portrait PDF and 1080×1920 social image), independent of the user's current viewport size.
- [x] `html2canvas` and `jspdf` are loaded via CDN script tags (no npm build step required).
- [x] Passes automated tests: report generation function produces a valid Blob output, share button triggers the expected API call or fallback behavior.
