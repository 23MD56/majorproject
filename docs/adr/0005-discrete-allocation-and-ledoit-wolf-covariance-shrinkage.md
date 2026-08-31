# Discrete Integer Allocation and Ledoit-Wolf Covariance Shrinkage

We incorporated two critical quantitative techniques identified in our open-source audit of PyPortfolioOpt:
1. **Ledoit-Wolf Covariance Shrinkage**: Rather than using noisy raw sample covariance matrices on rolling returns, the Hierarchical Risk Parity (HRP) engine uses Ledoit-Wolf shrinkage to regularize covariance estimation, improving portfolio weight stability across volatile market regimes.
2. **Discrete Integer Allocation**: Rather than outputting purely fractional theoretical weights, the order sheet generator and portfolio simulator perform integer share sizing ($n_i = \lfloor (w_i \cdot C) / P_i \rfloor$) with exact cash buffer tracking, delivering 100% executable order sheets for Indian retail brokers (Zerodha/Groww).
