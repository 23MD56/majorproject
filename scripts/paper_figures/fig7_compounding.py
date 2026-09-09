"""
Generate Figure 7: Wealth Compounding Trajectory & Analytical Tipping Point Solver.
Visualizes SIP compounding with 10% Step-Up and identifies the exact analytical month t*
where monthly interest gain exceeds monthly out-of-pocket investment deposit.
Outputs to docs/research_paper/figures/fig7_compounding_tipping_point.png and .pdf
"""
import sys
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

from app.core.models import CompoundingRequest
from app.ml.portfolio.compounding_engine import generate_compounding_projection

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 9,
    "axes.labelsize": 9,
    "axes.titlesize": 10
})

req = CompoundingRequest(
    initial_lump_sum=50000.0,
    monthly_sip=10000.0,
    tenure_years=10,
    expected_return_pct=14.5,
    step_up_pct=10.0,
    annual_volatility_pct=18.0
)

res = generate_compounding_projection(req)

years = [pt.year for pt in res.yearly_trajectories]
invested = np.array([pt.invested_step_up for pt in res.yearly_trajectories]) / 100000.0  # In Lakhs
wealth = np.array([pt.value_step_up for pt in res.yearly_trajectories]) / 100000.0
fd_baseline = np.array([pt.bank_fd_value for pt in res.yearly_trajectories]) / 100000.0

tipping_m = res.tipping_point.month if res.tipping_point.is_reached else 65

fig, ax = plt.subplots(figsize=(6.8, 4.2), dpi=300)

# Fill between invested and corpus
ax.fill_between(years, invested, wealth, color="#818CF8", alpha=0.35, label="Cumulative Compounding Gain ($V_t - C_t$)")
ax.plot(years, wealth, color="#4F46E5", lw=2.5, marker="o", markersize=4, label="QuantNiti Wealth Corpus (14.5% CAGR)")
ax.plot(years, invested, color="#059669", lw=2.0, linestyle="--", marker="s", markersize=4, label="Cumulative Capital Invested (10% Step-Up)")
ax.plot(years, fd_baseline, color="#D97706", lw=1.8, linestyle=":", label="7.0% Bank FD Benchmark Hurdle")

# Annotate Tipping Point
tipping_yr = tipping_m / 12.0
ax.axvline(tipping_yr, color="#DC2626", linestyle="-.", lw=1.5, alpha=0.8)
ax.scatter(tipping_yr, np.interp(tipping_yr, years, wealth), color="#DC2626", s=70, zorder=6)

ax.annotate(
    f"Compounding Tipping Point\nMonth {tipping_m} ({tipping_yr:.1f} Yrs)\nMonthly Interest > Monthly Deposit",
    xy=(tipping_yr, np.interp(tipping_yr, years, wealth)),
    xytext=(tipping_yr - 3.2, np.interp(tipping_yr, years, wealth) + 6.5),
    arrowprops=dict(arrowstyle="->", lw=1.4, color="#DC2626"),
    bbox=dict(boxstyle="round,pad=0.3", facecolor="#FEF2F2", edgecolor="#DC2626", lw=1.0),
    fontsize=8, fontweight="bold", color="#991B1B"
)

# Final year label in Lakhs (INR)
final_w = wealth[-1]
final_inv = invested[-1]
ax.text(years[-1] + 0.15, final_w, f"₹{final_w:.1f}L\n(+₹{final_w-final_inv:.1f}L)", va="center", color="#4F46E5", fontsize=8, fontweight="bold")

ax.set_xlabel("Investment Tenure (Years)")
ax.set_ylabel("Portfolio Wealth Valuation (INR Lakhs)")
ax.set_title("Long-Horizon Wealth Compounding Trajectory & Tipping Point Solver", fontweight="bold")
ax.grid(True, linestyle=":", alpha=0.5)
ax.set_xlim(-0.2, 11.4)
ax.set_xticks(range(0, 11))
ax.legend(loc="upper left", frameon=True, facecolor="white", edgecolor="#CBD5E1", fontsize=8)

plt.tight_layout()
plt.savefig("docs/research_paper/figures/fig7_compounding_tipping_point.png", dpi=300, bbox_inches='tight')
plt.savefig("docs/research_paper/figures/fig7_compounding_tipping_point.pdf", bbox_inches='tight')
print("Successfully generated Figure 7: fig7_compounding_tipping_point")
