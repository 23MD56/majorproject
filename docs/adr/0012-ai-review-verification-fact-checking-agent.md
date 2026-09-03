# AI Review Verification and Ground-Truth Fact-Checking Agent

User reviews and testimonials submitted on AI Portfolio Baskets and custom portfolios are audited in real time by an automated AI verification pipeline. The agent extracts percentage return claims and holding durations, verifies them against ground-truth mathematical historical data, and enforces SEBI advertisement compliance by rejecting unsubstantiated or deceptive claims.

## Context

The panel proposed an Amazon-style review system where users report their portfolio growth, and an agent verifies the legitimacy of those reviews. In regulated Indian fintech markets, SEBI (Investment Advisers) and Advertisement Regulations strictly prohibit unverified promotional claims of monetary returns. However, building an explicit anti-fraud, ground-truth verification agent provides a legitimate regulatory compliance tool and a technically defensible AI demonstration.

## Considered Options

1. **Unmoderated user reviews**: Allowing unrestricted user comments on stock performance. Rejected because it invites illegal stock tips, pump-and-dump promotion, and SEBI regulatory liability.
2. **Qualitative-only platform reviews**: Restricting reviews strictly to app usability (e.g. "Clean UI"). Rejected because it ignores the panel's explicit desire to verify mathematical growth claims against actual portfolio performance.
3. **Ground-Truth Fact-Checking Verification Agent (chosen)**: Users submit feedback on specific baskets or strategies. A 3-tier NLP pipeline extracts claimed growth percentages and time horizons, looks up audited backtest / paper portfolio returns in QuantNiti's time-series database, and attaches a cryptographic/verified badge (`[✅ Verified: Actual Return +12.8% vs Claimed +14%]`) if within tolerance ($\pm 3\%$). Exaggerated or impossible claims are automatically flagged and rejected.

## Consequences

- Transforms a standard review box into an Explainable AI / RegTech feature with high academic viva impact.
- Enforces zero-tolerance against spam, phone numbers, Telegram links, and stock tipping.
- Requires historical return lookup endpoints for all supported baskets and risk personas.
