# 16: Groww-Inspired Mobile UI Redesign & 4-Tab Navigation

**What to build:** Redesign the entire QuantNiti frontend with a clean, beginner-approachable Groww-inspired design system (`#00D09C` mint green accents, high-whitespace card surfaces, `#121212`/`#1E1E24` dark theme, 16px radius, hairline borders). Reorganize navigation into 4 primary tabs: `[Home]` (Market pulse, Onboarding / Portfolio snapshot, Recommendations, Learning Hub carousel), `[Explore]` (360° Profiles with a collapsible Advanced Analysis drawer for Quant Lab backtesting), `[Grow]` (3-Step AI Basket wizard), and `[Portfolio]` (Multi-portfolio MTM tracker). Include Android-native physics: overscroll isolation, haptic feedback on touch gestures, and History API popstate handling for modal sheets.

**Blocked by:** 07: Unified Mobile-First Client Shell & End-to-End Integration

**Status:** completed

- [x] Replaces the dark glassmorphism CSS theme with the Groww design system: mint green primary `#00D09C`, soft profit/loss indicators, high-legibility tabular numeric fonts, and 1px hairline card borders.
- [x] Implements the 4-tab bottom navigation bar (`Home`, `Explore`, `Grow`, `Portfolio`) with filled active state icons and smooth transitions.
- [x] Builds the adaptive `Home` tab: renders an educational onboarding card for first-time users, and a dual-metric portfolio summary card (`1D P&L` and `Overall P&L`) for returning users.
- [x] Relocates the Quant Lab Strategy Backtester from a primary tab into a collapsible "Advanced Analysis" drawer inside the Explore tab, keeping the Regime Radar on the Home tab.
- [x] Implements Android touch physics: `overscroll-behavior-y: contain`, vibration haptic feedback via `navigator.vibrate` on tab/button taps, and Android back button modal dismissal.
- [x] Passes automated end-to-end frontend tests verifying tab navigation, modal opening/closing, and mobile viewport responsiveness.
