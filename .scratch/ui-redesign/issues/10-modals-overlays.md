# 10: Modals & Overlays — NitiBot, Notifications, Reviews, Reports, Concepts

**What to build:** All modal/overlay components rebuilt in React with the new ModalSheet component: NitiBot chat, notification drawer, write review modal, concept detail modal, competitor benchmark modal, create goal modal, order sheet modal, and the portfolio report card template. Each uses the new violet theme, Framer Motion slide-up entry, backdrop blur, and proper lifecycle cleanup (scroll lock, history pushState for Android back gesture).

**Blocked by:** 02-layout-shell, 03-shared-components, 04-async-lifecycle

**Status:** resolved
Assigned: Developer 1

- [x] `<NitiBotModal>` — floating AI chat: suggestion chips, message bubbles, citations, typing indicator. Send button disabled during await. AbortController on chat fetch. History pushState for Android back dismiss.
- [x] `<NotificationDrawer>` — slide-from-right drawer: filter pills (All, Regime, Drift, Technicals, Risk), notification cards, Web Push permission prompt. Properly cleaned up 45-second polling interval.
- [x] `<WriteReviewModal>` — star rating selector, claimed return input, review text area, AI fact-checking explanation badge.
- [x] `<ConceptDetailModal>` — financial literacy concept detail: formula display, real-world example, "Mark as Learned" toggle that updates mastery progress.
- [x] `<CompetitorBenchmarkModal>` — comparison matrix (QuantNiti vs Smallcase vs Groww/Zerodha vs Mutual Funds) across 10 dimensions + fee drag calculator.
- [x] `<OrderSheetModal>` — discrete share counts, execution prices, cash buffer, copy-to-clipboard.
- [x] `<PortfolioReportCard>` — off-screen A4 template for html2canvas + jsPDF export. Updated to violet theme.
- [x] All modals use the shared `<ModalSheet>` base component from ticket 03
- [x] Android back gesture (popstate) dismisses the topmost open modal
- [x] Body scroll lock when any modal is open
- [x] Test: modals open/close correctly, Android back dismisses, NitiBot send button disabled during await
