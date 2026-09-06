# 03: Shared UI Component Library — Cards, Buttons, Chips, Modals

**What to build:** A set of reusable, themed UI components that every page will use. Each component follows the "non-boxy" design language: squircle corners (24px cards, 16px inner containers), hairline violet borders, tonal surface elevation, and smooth Framer Motion entrance animations. The user doesn't see these directly — they're building blocks for subsequent tickets.

**Blocked by:** 01-react-vite-scaffold

**Status:** ready-for-agent

- [ ] `<GlassCard>` — primary content container: `rounded-3xl`, hairline border (`border-violet-400/20` light, `border-violet-500/15` dark), subtle inner-top highlight, tonal surface background, Framer Motion `fadeInUp` entrance
- [ ] `<ChipButton>` — selectable pill: active state with violet accent, inactive with muted surface, spring scale on tap (`whileTap={{ scale: 0.97 }}`)
- [ ] `<SegmentedControl>` — horizontal pill group with sliding active indicator using Framer Motion `layoutId`
- [ ] `<PrimaryButton>` — gradient violet CTA (`from-violet-500 to-indigo-500`), `whileTap={{ scale: 0.97 }}`, loading spinner state
- [ ] `<GhostButton>` — transparent with violet text, hover/active states
- [ ] `<ModalSheet>` — bottom sheet overlay with backdrop blur, slide-up entry (`slideUp` spring), handle bar, body scroll lock, dismissible via backdrop tap or swipe
- [ ] `<ProgressBar>` — segmented dash bar (Instagram Stories style) for multi-step wizards
- [ ] `<AnimatedNumber>` — ticker-roll number display that smoothly interpolates between values using `requestAnimationFrame`
- [ ] `<RegimeBadge>` — color-coded regime pill (emerald bull, amber sideways, rose bear) with pulse dot
- [ ] `<LearnChip>` — small "Learn" pill that opens a concept modal
- [ ] Transition presets module exporting spring/smooth/snappy configs for consistent motion across the app
