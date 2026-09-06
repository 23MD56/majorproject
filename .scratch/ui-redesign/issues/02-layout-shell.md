# 02: App Layout Shell — Header, Bottom Nav, Tab Routing & Animations

**What to build:** The persistent app layout (sticky header + bottom tab bar + routed content area) with Framer Motion page transitions. The user can tap between 4 tabs (Home, Explore, Grow, Portfolio) and see smooth animated transitions. The header shows the brand badge, regime pill, notification bell, and theme toggle. Compare/Install/Viewport are in an overflow menu. All tabs render placeholder content ("Home Page", "Explore Page", etc.) — real content comes in later tickets.

**Blocked by:** 01-react-vite-scaffold

**Status:** ready-for-agent

- [ ] `<AppShell>` component with sticky header, scrollable content area, and fixed bottom nav
- [ ] `<Header>` component: brand badge (clickable → Home), regime pill badge, notification bell (with unread dot), theme toggle button, overflow menu (⋮) containing Compare, Install PWA, Viewport toggle
- [ ] `<BottomNav>` component: 4 tab buttons (Home, Explore, Grow, Portfolio) with Lucide icons, active state indicator using Framer Motion `layoutId` for sliding pill
- [ ] React Router v6 hash routes: `/#home`, `/#explore`, `/#grow`, `/#portfolio`
- [ ] Framer Motion `AnimatePresence` page transitions between tabs: fade + slide (y: 20 → 0, opacity: 0 → 1, spring stiffness 300, damping 25)
- [ ] Tab switch triggers haptic feedback via `navigator.vibrate(12)` on supported devices
- [ ] `useReducedMotion` hook: animations suppressed when user prefers reduced motion
- [ ] Mobile viewport meta tag preserved (`width=device-width, initial-scale=1.0`)
- [ ] App container constrained to `max-w-[520px]` on desktop with centered shadow, full-width on mobile
