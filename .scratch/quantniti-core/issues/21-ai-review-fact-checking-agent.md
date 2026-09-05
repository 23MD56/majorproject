# 21: AI Review Legitimacy & Ground-Truth Fact-Checking Agent

**What to build:** Build an Amazon-style review and testimonial system for QuantNiti AI Portfolio Baskets and custom strategies, moderated by an automated AI Fact-Checking Agent. The agent extracts claimed growth percentages and holding durations from submitted reviews, cross-checks them against ground-truth mathematical historical data in QuantNiti's time-series database, rejects fraudulent or exaggerated claims (e.g. "+50% in 1 week"), and awards verification badges (`[✅ Verified: Actual Return +12.8% vs Claimed +14%]`) to authentic reviews within a $\pm 3\%$ tolerance window.

**Blocked by:** 04: AI Portfolio Basket Engine & Trust Card, 16: Groww-Inspired Mobile UI Redesign & 4-Tab Navigation, 19: Persistent Multi-Portfolio Storage & Day-over-Day MTM Engine

**Status:** ready-for-human

- [x] Implements database models and REST endpoints for review submission and retrieval: `POST /api/v1/reviews/submit` and `GET /api/v1/reviews/{target_type}/{target_id}`.
- [x] Builds Tier 1 deterministic regex filters: automatically blocks contact details, external links, Telegram handles, profanity, and explicit stock tips.
- [x] Builds Tier 2 NLP fact-checking logic: extracts claimed percentage ($\Delta\%$) and duration ($T$), queries ground-truth basket historical performance over that horizon, and computes the mathematical discrepancy.
- [x] Approves and awards verified badges to reviews with $|\text{Claimed} - \text{Actual}| \le 3\%$; flags or rejects reviews exceeding the tolerance window.
- [x] Integrates optional Tier 3 LLM check (Gemini 2.5 Flash) for borderline cases to detect promotional or deceptive astroturfing.
- [x] Builds the community review UI component on the Grow and Portfolio tabs, showing verified badges, audit timestamps, and average community sentiment.
- [x] Passes automated tests: accurately approves valid simulated reviews, rejects exaggerated claims, and blocks prohibited contact information and stock tips.

