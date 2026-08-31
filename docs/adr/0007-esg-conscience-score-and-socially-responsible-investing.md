# ESG Conscience Score and Socially Responsible Investing

We add an Environmental, Social, and Governance (ESG) scoring layer to every stock and portfolio recommendation.

## Context

The project review panel asked "How does this benefit society?" — a question that pure financial return optimization cannot answer. Indian retail investors have no visibility into the ethical footprint of their investments on existing platforms (Groww, Zerodha, INDmoney, MoneyControl). Meanwhile, SEBI now mandates Business Responsibility and Sustainability Reporting (BRSR) for the top 1,000 listed companies, making ESG data publicly available for all NIFTY 50 constituents.

## Decision

1. **Static curated dataset over live API**: ESG scores are curated from publicly available BRSR disclosures, CRISIL ESG ratings, and NSE Sustainability index methodology into a static dataset embedded in the codebase. This avoids runtime API dependencies and ensures demo stability. In production, this would be replaced by a CRISIL API integration.
2. **Composite + triplet scoring**: Each stock receives four scores (0–100): `esg_composite`, `esg_environment`, `esg_social`, `esg_governance`. The composite is a weighted average following NSE ESG index methodology.
3. **Portfolio-level aggregation**: Portfolio ESG is computed as the weighted sum of constituent ESG composites ($\text{ESG}_{\text{portfolio}} = \sum w_i \cdot \text{ESG}_i$), providing a single number for the entire basket.
4. **ESG-Conscious risk persona**: A 4th risk persona (alongside Conservative, Balanced, Aggressive) that applies an additive weight bias toward high-ESG stocks before HRP bisection, while maintaining the weight-sum and concentration constraints.

## Consequences

- Adds a static data dependency that requires periodic manual refresh if NIFTY 50 constituents change or new BRSR reports are published.
- Introduces a 4th risk persona, expanding the combinatorial space for basket generation testing.
- Provides a direct, defensible answer to the "society benefit" panel question.
