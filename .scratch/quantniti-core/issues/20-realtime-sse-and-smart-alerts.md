# 20: Real-Time SSE Ticker Streaming & Live Smart Alerts

**What to build:** Implement a real-time Server-Sent Events (SSE) streaming architecture that pushes live market price ticks (3–5 second updates) to the mobile client with visual DOM green/red flash animations. Build an asynchronous background evaluator (running every 60 seconds) that scans for 6 quantitative Smart Alert triggers (regime shift, portfolio drift >5%, RSI extremes <28/>72, drawdown limits, 52W high breakout, factor score anomalies) and pushes live in-app toasts and Web Push notifications.

**Blocked by:** 01: Data Ingestion & NIFTY 50 Market Data Service, 16: Groww-Inspired Mobile UI Redesign & 4-Tab Navigation, 19: Persistent Multi-Portfolio Storage & Day-over-Day MTM Engine

**Status:** ready-for-agent

- [ ] Implements `GET /api/v1/stream/ticks` Server-Sent Events (SSE) endpoint broadcasting live market quotes with heartbeat pinging and client disconnect handling.
- [ ] Builds a synthetic tick generator for reliable demonstration and off-market hours, with clean fallback to live broker quotes when configured.
- [ ] Implements the Vanilla JS `MarketStreamClient` on the frontend: handles SSE auto-reconnection, updates ticker elements in real-time, and applies `.tick-up` (emerald flash) / `.tick-down` (rose flash) CSS animations.
- [ ] Builds the 60-second micro-batch alert evaluator scanning for: (1) Market Regime transition, (2) Portfolio allocation drift $> \pm 5\%$, (3) RSI-14 oversold/overbought, (4) Drawdown breach, (5) 52-Week high milestone, and (6) Regime-adjusted factor score anomalies.
- [ ] Dispatches alerts as in-app notification toasts and integrates with the Service Worker Push API using VAPID keys.
- [ ] Adds an in-app Notification Center drawer accessible from the top header bell icon.
- [ ] Passes automated integration tests verifying SSE stream formatting, event dispatching, and alert trigger threshold evaluations.
