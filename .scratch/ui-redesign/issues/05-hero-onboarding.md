# 05: Hero Onboarding — Welcome Splash & Persona Quiz

**What to build:** A full-screen animated onboarding experience that appears on first visit. The user sees a welcome splash with QuantNiti's value proposition, then answers 3 scenario-based questions that determine their Risk Persona, then sees a "Your dashboard is ready" confirmation that transitions smoothly into the Home tab. Returning users skip this entirely.

**Blocked by:** 02-layout-shell, 03-shared-components

**Status:** ready-for-agent

- [ ] `<OnboardingHero>` route/component that renders full-screen (hiding header + bottom nav) when `localStorage.getItem('quantniti_onboarded')` is falsy
- [ ] **Step 1 — Welcome Splash**: Animated brand display with value proposition ("AI-driven portfolio intelligence for Indian retail investors"), Framer Motion staggered text entrance, smooth violet gradient background, "Get Started" CTA
- [ ] **Step 2 — Persona Quiz**: 3 scenario-based questions rendered one at a time with slide transitions:
  - Q1: "Your stocks dropped 15% in a week — what do you do?" → options map to Conservative/Balanced/Aggressive
  - Q2: "How long can you leave your money invested without needing it?" → maps to horizon preference
  - Q3: "What matters more to you?" → Risk-adjusted returns vs Capital safety vs ESG impact
- [ ] Each question uses large, tappable option cards (not small radio buttons) with Framer Motion spring on selection
- [ ] **Step 3 — Personalized Result**: "You're a [Balanced] investor" with an animated badge reveal, brief explanation, and "Enter QuantNiti →" CTA
- [ ] Quiz results stored in Zustand state + `localStorage` (`quantniti_risk_persona`, `quantniti_onboarded = true`)
- [ ] Results pre-select the Grow wizard's Risk Persona segmented control (advisory, freely changeable)
- [ ] Smooth exit transition: the onboarding screen fades/scales out, revealing the Home tab underneath
- [ ] Segmented progress bar at top showing 3 steps
- [ ] Test: first visit shows hero, second visit skips to Home, quiz results persist across sessions
