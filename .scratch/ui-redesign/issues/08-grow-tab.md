# 08: Grow Tab — Multi-Step Wizard & Guided Results Flow

**What to build:** The Grow tab rebuilt as a guided multi-step experience. The user walks through a 3-step wizard (capital → horizon → persona) with animated card transitions, then sees results in Step 2 (allocation + growth), and can dive deeper in Step 3 (ESG, Trust Card, benchmarks, reviews). Each wizard step is its own card that slides in horizontally. Completed steps collapse into editable summary pills. The capital slider has quick-pick chips and word-form reassurance. Horizon cards have relatable context. Persona cards have visual badges with plain-language descriptions.

**Blocked by:** 02-layout-shell, 03-shared-components, 04-async-lifecycle

**Status:** resolved

- [x] `<GrowPage>` component managing a 5-step guided flow state
- [x] **Segmented progress bar** at top: 3 equal-width dashes (for the 3 input steps) that fill with violet as user progresses. Plus an additional "Results" and "Deep Dive" indicator for steps 4-5.
- [x] **Step 1 — Capital**: Large animated Rupee display (`₹50,000`) + word form (`Fifty Thousand Only`), range slider with violet track, 4 quick-pick chips (`₹10k`, `₹25k`, `₹50k`, `₹1L`), micro-trust chip ("Safe simulated capital • No live trading"). Horizontal slide-in transition.
- [x] **Step 2 — Horizon**: 2×2 grid of touch cards, each showing duration + relatable context (e.g., "6 Months — Strategic Stance: Balances market swings with regime alpha"). "Recommended" badge on 6M. Radio-style selection with checkmark morph.
- [x] **Step 3 — Persona**: 4 vertical cards with icons (Shield/Scales/Rocket/Leaf), persona name, plain-language tolerance description, and drawdown guardrail. Pre-selected based on onboarding quiz result (advisory, freely changeable).
- [x] **Completed step summary pills**: When advancing past a step, it collapses into a compact pill at the top (e.g., "✓ Capital: ₹50,000 • Edit"). Tapping "Edit" slides back to that step.
- [x] **"Generate AI Basket" CTA**: Sticky bottom button in thumb zone with frosted glass backdrop. Triggers API call to `/api/v1/basket/generate`. Loading skeleton during await.
- [x] **Step 4 — Results Overview**: Allocation donut chart (Chart.js with violet-themed palette), stock pills list (scrollable), discrete allocation & cash buffer summary, 3-tier probabilistic Rupee growth scenarios (Pessimistic Q10, Base Q50, Optimistic Q90), "Track in Portfolio" CTA, "See Deep Dive →" button.
- [x] **Step 5 — Deep Dive**: ESG Conscience Score card, 4-Pillar Explainable AI Trust Card, benchmark comparison (vs Bank FD + NIFTY), community reviews section with rating summary and filter tabs.
- [x] All transitions use Framer Motion `AnimatePresence` with horizontal slide (spring stiffness 300, damping 25)
- [x] Abort basket generation on tab switch (AbortController from ticket 04)
- [x] Button disabled during basket generation to prevent duplicate submissions
- [x] Test: wizard navigates forward/back, inputs persist across steps, abort fires on tab switch, completed steps show summary pills
