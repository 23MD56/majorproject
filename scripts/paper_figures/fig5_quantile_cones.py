"""
Generate Figure 5: Multi-Horizon Probabilistic Quantile Forecasting Cones.
Visualizes Q10 (Pessimistic), Q50 (Base Median), and Q90 (Optimistic) growth cones
over 1M, 3M, 6M, and 12M investment horizons with strict isotonic monotonicity.
Outputs to docs/research_paper/figures/fig5_quantile_forecast_cones.png and .pdf
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

from app.data.service import MarketDataService
from app.ml.forecasting.forecaster import MultiHorizonForecaster

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 9,
    "axes.labelsize": 9,
    "axes.titlesize": 10
})

service = MarketDataService()
symbol = "RELIANCE"
print(f"Fetching data for {symbol} and ^NSEI index...")
stock_df = service.get_history(symbol)
index_df = service.get_history("^NSEI")

forecaster = MultiHorizonForecaster(risk_free_rate=0.065, benchmark_market_return=0.12)
cones = forecaster.predict_growth_cones(stock_df, index_df=index_df, symbol=symbol)

current_p = cones.current_price
days = [0, 21, 63, 126, 252]
horizons = ["T0", "1M", "3M", "6M", "12M"]

p10_series = [current_p, cones.m1.pessimistic_price, cones.m3.pessimistic_price, cones.m6.pessimistic_price, cones.m12.pessimistic_price]
p50_series = [current_p, cones.m1.base_price, cones.m3.base_price, cones.m6.base_price, cones.m12.base_price]
p90_series = [current_p, cones.m1.optimistic_price, cones.m3.optimistic_price, cones.m6.optimistic_price, cones.m12.optimistic_price]

# Calculate percentages for labels
q10_pct = cones.m12.pessimistic_pct * 100
q50_pct = cones.m12.base_pct * 100
q90_pct = cones.m12.optimistic_pct * 100

fig, ax = plt.subplots(figsize=(6.8, 4.2), dpi=300)

# Shaded quantile bands
ax.fill_between(days, p10_series, p90_series, color="#818CF8", alpha=0.2, label="80% Confidence Band ($Q_{0.10} - Q_{0.90}$)")
ax.fill_between(days, p10_series, p50_series, color="#C7D2FE", alpha=0.35)
ax.fill_between(days, p50_series, p90_series, color="#A5B4FC", alpha=0.35)

# Lines
ax.plot(days, p90_series, color="#059669", lw=2.0, linestyle="--", label=f"Optimistic 90th Percentile ($Q_{{0.90}}$: +{q90_pct:.1f}%)")
ax.plot(days, p50_series, color="#4F46E5", lw=2.5, label=f"Base Expected Median ($Q_{{0.50}}$: {q50_pct:+.1f}%)")
ax.plot(days, p10_series, color="#DC2626", lw=2.0, linestyle="--", label=f"Pessimistic 10th Percentile ($Q_{{0.10}}$: {q10_pct:+.1f}%)")

# Scatter markers on discrete horizons
for d, p1, p5, p9 in zip(days[1:], p10_series[1:], p50_series[1:], p90_series[1:]):
    ax.scatter(d, p9, color="#059669", s=35, zorder=5)
    ax.scatter(d, p5, color="#4F46E5", s=45, zorder=5)
    ax.scatter(d, p1, color="#DC2626", s=35, zorder=5)

# T0 baseline point
ax.scatter(0, current_p, color="#0F172A", s=50, marker="o", zorder=6, label=f"Spot Reference: ₹{current_p:,.2f}")

ax.set_xticks(days)
ax.set_xticklabels([f"{h}\n(d={d})" if d > 0 else "Spot (T0)" for h, d in zip(horizons, days)])
ax.set_xlabel("Forecast Horizon Timeline")
ax.set_ylabel(f"{symbol} Projected Valuation (INR)")
ax.set_title(f"Multi-Horizon Probabilistic Quantile Growth Cone for {symbol} ($H \\in [1M, 12M]$)", fontweight="bold")
ax.grid(True, linestyle=":", alpha=0.6)
ax.legend(loc="upper left", frameon=True, facecolor="white", edgecolor="#CBD5E1")

# Annotations showing strict monotonicity
ax.text(days[-1] + 4, p90_series[-1], f"₹{p90_series[-1]:,.0f}", va="center", fontsize=8, color="#059669", fontweight="bold")
ax.text(days[-1] + 4, p50_series[-1], f"₹{p50_series[-1]:,.0f}", va="center", fontsize=8, color="#4F46E5", fontweight="bold")
ax.text(days[-1] + 4, p10_series[-1], f"₹{p10_series[-1]:,.0f}", va="center", fontsize=8, color="#DC2626", fontweight="bold")
ax.set_xlim(-10, 280)

plt.tight_layout()
plt.savefig("docs/research_paper/figures/fig5_quantile_forecast_cones.png", dpi=300, bbox_inches='tight')
plt.savefig("docs/research_paper/figures/fig5_quantile_forecast_cones.pdf", bbox_inches='tight')
print("Successfully generated Figure 5: fig5_quantile_forecast_cones")
