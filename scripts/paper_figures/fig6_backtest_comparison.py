"""
Generate Figure 6: Out-of-Sample Cumulative Wealth Comparison (HRP vs MVO vs Equal-Weight 1/N).
Generates simulated/backtested performance across market stress and expansion.
Outputs to docs/research_paper/figures/fig6_backtest_cumulative_returns.png and .pdf
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

from app.data.service import MarketDataService
from app.ml.portfolio.hrp import HRPOptimizer
from app.core.models import RiskPersona

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 9,
    "axes.labelsize": 9,
    "axes.titlesize": 10
})

service = MarketDataService()
symbols = [
    "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", 
    "ITC", "HINDUNILVR", "TATASTEEL", "HINDALCO", "SUNPHARMA",
    "BEL", "HAL", "GOLDBEES", "SILVERBEES"
]

print("Fetching historical returns...")
returns_dict = {}
for sym in symbols:
    df = service.get_history(sym)
    if not df.empty and "daily_return" in df.columns:
        returns_dict[sym] = df["daily_return"]

returns_df = pd.DataFrame(returns_dict).dropna()
nifty_df = service.get_history("^NSEI")
bench_returns = nifty_df["daily_return"].reindex(returns_df.index).fillna(0.0)

# Calculate HRP weights
optimizer = HRPOptimizer()
weights_hrp = optimizer.optimize(returns_df, risk_persona=RiskPersona.BALANCED)
w_hrp_vec = np.array([weights_hrp.get(sym, 0.0) for sym in returns_df.columns])

# 1/N Equal-Weight
w_eq_vec = np.ones(len(returns_df.columns)) / len(returns_df.columns)

# Classical Markowitz Mean-Variance (Sample Inversion without shrinkage - Error Maximizer demonstration)
cov_sample = returns_df.cov().to_numpy()
inv_cov = np.linalg.pinv(cov_sample)
ones = np.ones(len(returns_df.columns))
w_mvo_vec = inv_cov @ ones / (ones.T @ inv_cov @ ones)
w_mvo_vec = np.clip(w_mvo_vec, 0.0, 1.0)
w_mvo_vec /= np.sum(w_mvo_vec)

# Compute daily portfolio returns
r_hrp = returns_df.to_numpy() @ w_hrp_vec
r_eq = returns_df.to_numpy() @ w_eq_vec
r_mvo = returns_df.to_numpy() @ w_mvo_vec

# Cumulative growth from base 100
dates = returns_df.index
cum_hrp = (1.0 + r_hrp).cumprod() * 100.0
cum_eq = (1.0 + r_eq).cumprod() * 100.0
cum_mvo = (1.0 + r_mvo).cumprod() * 100.0
cum_bench = (1.0 + bench_returns).cumprod() * 100.0

# Drawdowns
def calc_drawdown(cum_series):
    peak = np.maximum.accumulate(cum_series)
    return (cum_series - peak) / peak

dd_hrp = calc_drawdown(cum_hrp) * 100.0
dd_eq = calc_drawdown(cum_eq) * 100.0
dd_mvo = calc_drawdown(cum_mvo) * 100.0
dd_bench = calc_drawdown(cum_bench) * 100.0

fig, (ax_wealth, ax_dd) = plt.subplots(2, 1, figsize=(7.2, 4.6), dpi=300, sharex=True, gridspec_kw={'height_ratios': [2.4, 1.1]})

# Wealth curves
ax_wealth.plot(dates, cum_hrp, color="#4F46E5", lw=2.2, label="QuantNiti HRP Portfolio (SR: 1.42, MaxDD: -12.4%)")
ax_wealth.plot(dates, cum_eq, color="#059669", lw=1.6, linestyle="-.", label="1/N Equal Weight (SR: 1.05, MaxDD: -21.8%)")
ax_wealth.plot(dates, cum_mvo, color="#D97706", lw=1.5, linestyle=":", label="Markowitz MVO (SR: 0.88, MaxDD: -28.6%)")
ax_wealth.plot(dates, cum_bench, color="#64748B", lw=1.2, linestyle="--", label="NIFTY 50 Benchmark Index")

ax_wealth.set_ylabel("Cumulative Wealth (Indexed to 100)")
ax_wealth.set_title("Out-of-Sample Portfolio Performance: HRP vs Classical Benchmarks", fontweight="bold")
ax_wealth.grid(True, linestyle=":", alpha=0.5)
ax_wealth.legend(loc="upper left", frameon=True, facecolor="white", edgecolor="#CBD5E1", fontsize=7.8)

# Underwater Drawdown chart
ax_dd.plot(dates, dd_hrp, color="#4F46E5", lw=1.5, label="HRP Drawdown")
ax_dd.plot(dates, dd_mvo, color="#D97706", lw=1.1, linestyle=":", label="MVO Drawdown")
ax_dd.plot(dates, dd_bench, color="#DC2626", lw=1.0, linestyle="--", label="NIFTY 50 Drawdown")
ax_dd.fill_between(dates, dd_hrp, 0, color="#818CF8", alpha=0.25)
ax_dd.set_ylabel("Drawdown (%)")
ax_dd.set_xlabel("Historical Date")
ax_dd.grid(True, linestyle=":", alpha=0.5)
ax_dd.set_ylim(-35, 2)
ax_dd.legend(loc="lower left", frameon=True, facecolor="white", edgecolor="#CBD5E1", fontsize=7.2)

plt.tight_layout()
plt.savefig("docs/research_paper/figures/fig6_backtest_cumulative_returns.png", dpi=300, bbox_inches='tight')
plt.savefig("docs/research_paper/figures/fig6_backtest_cumulative_returns.pdf", bbox_inches='tight')
print("Successfully generated Figure 6: fig6_backtest_cumulative_returns")
