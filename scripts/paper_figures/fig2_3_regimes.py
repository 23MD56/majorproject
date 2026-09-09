"""
Generate Figures 2 and 3 using real/cached historical market data and the QuantNiti GMM engine.
Fig 2: GMM Regime Clusters in Feature Space with Confidence Ellipses.
Fig 3: Historical NIFTY 50 Timeline Colored by Detected Regime (2018-2025).
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse

# Ensure project src is in pythonpath
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

from app.data.service import MarketDataService
from app.ml.regime.features import extract_regime_features
from app.ml.regime.classifier import MarketRegimeClassifier
from app.core.models import MarketRegimeType

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 9,
    "axes.labelsize": 9,
    "axes.titlesize": 10,
    "xtick.labelsize": 8,
    "ytick.labelsize": 8,
    "legend.fontsize": 8,
    "figure.titlesize": 11
})

print("Fetching historical data for NIFTY 50 and India VIX...")
service = MarketDataService()
nifty_df = service.get_history("^NSEI")
vix_df = service.get_history("^INDIAVIX")

print(f"Data retrieved: NIFTY={len(nifty_df)} bars, VIX={len(vix_df)} bars")

# Feature extraction
feat_df = extract_regime_features(nifty_df, vix_df)
print(f"Engineered feature matrix: {feat_df.shape}")

# Fit GMM
classifier = MarketRegimeClassifier(n_components=3, random_state=42)
classifier.fit(feat_df)
regimes = classifier.predict(feat_df)
probas = classifier.predict_proba(feat_df)

feat_df["regime"] = regimes
feat_df["close"] = nifty_df["close"].reindex(feat_df.index)

# -------------------------------------------------------------
# Figure 2: GMM Regime Clusters with 95% Confidence Ellipses
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(6.2, 4.2), dpi=300)

colors = {
    MarketRegimeType.LOW_VOLATILITY_BULL: "#059669",      # Emerald Green
    MarketRegimeType.SIDEWAYS_CONSOLIDATION: "#D97706",  # Amber
    MarketRegimeType.HIGH_VOLATILITY_BEAR: "#DC2626"     # Crimson Red
}
labels = {
    MarketRegimeType.LOW_VOLATILITY_BULL: "Low-Volatility Bull (Expansion)",
    MarketRegimeType.SIDEWAYS_CONSOLIDATION: "Sideways Consolidation (Neutral)",
    MarketRegimeType.HIGH_VOLATILITY_BEAR: "High-Volatility Bear (Contraction)"
}

x_col = "log_return_20d"
y_col = "realized_vol_20d"

# Plot points
for reg in [MarketRegimeType.LOW_VOLATILITY_BULL, MarketRegimeType.SIDEWAYS_CONSOLIDATION, MarketRegimeType.HIGH_VOLATILITY_BEAR]:
    sub = feat_df[feat_df["regime"] == reg]
    ax.scatter(
        sub[x_col] * 100, sub[y_col] * 100,
        c=colors[reg], label=labels[reg],
        alpha=0.45, s=20, edgecolors='none'
    )

# Draw covariance ellipses for each cluster in original scale
def draw_ellipse(position, covariance, ax, color, n_std=2.0):
    vals, vecs = np.linalg.eigh(covariance)
    order = vals.argsort()[::-1]
    vals, vecs = vals[order], vecs[:, order]
    theta = np.degrees(np.arctan2(*vecs[:, 0][::-1]))
    width, height = 2 * n_std * np.sqrt(np.maximum(vals, 1e-8))
    ell = Ellipse(xy=position, width=width, height=height, angle=theta,
                  facecolor=color, alpha=0.15, edgecolor=color, linewidth=1.5, linestyle="--")
    ax.add_patch(ell)

# Reconstruct 2D means and covs in the 2D plane (x_col, y_col)
for reg in [MarketRegimeType.LOW_VOLATILITY_BULL, MarketRegimeType.SIDEWAYS_CONSOLIDATION, MarketRegimeType.HIGH_VOLATILITY_BEAR]:
    sub = feat_df[feat_df["regime"] == reg]
    pts = sub[[x_col, y_col]].to_numpy() * 100.0
    mean_pt = np.mean(pts, axis=0)
    cov_pt = np.cov(pts, rowvar=False)
    draw_ellipse(mean_pt, cov_pt, ax, colors[reg], n_std=2.0)
    # Centroid marker
    ax.scatter(mean_pt[0], mean_pt[1], c=colors[reg], s=90, marker="X", edgecolors="black", linewidths=1.2, zorder=5)

ax.set_xlabel("20-Day Cumulative Log Return (%)")
ax.set_ylabel("20-Day Realized Annualized Volatility (%)")
ax.set_title("Unsupervised GMM Regime Clustering in Phase Space ($K=3$)", fontweight="bold")
ax.grid(True, linestyle=":", alpha=0.6)
ax.axvline(0, color="gray", linestyle="--", linewidth=0.8, alpha=0.7)
ax.legend(frameon=True, facecolor="white", edgecolor="#CBD5E1", loc="upper left")

plt.tight_layout()
plt.savefig("docs/research_paper/figures/fig2_gmm_regime_clusters.png", dpi=300, bbox_inches='tight')
plt.savefig("docs/research_paper/figures/fig2_gmm_regime_clusters.pdf", bbox_inches='tight')
print("Successfully generated Figure 2: fig2_gmm_regime_clusters")

# -------------------------------------------------------------
# Figure 3: NIFTY 50 Historical Timeline Colored by Regime
# -------------------------------------------------------------
fig, (ax_top, ax_bot) = plt.subplots(2, 1, figsize=(7.2, 4.4), dpi=300, sharex=True, gridspec_kw={'height_ratios': [2.5, 1]})

dates = feat_df.index
prices = feat_df["close"]

# Color segments
for i in range(len(dates) - 1):
    reg = feat_df["regime"].iloc[i]
    ax_top.plot(dates[i:i+2], prices.iloc[i:i+2], color=colors[reg], lw=1.6)

# Legend handles for top plot
for reg in [MarketRegimeType.LOW_VOLATILITY_BULL, MarketRegimeType.SIDEWAYS_CONSOLIDATION, MarketRegimeType.HIGH_VOLATILITY_BEAR]:
    ax_top.plot([], [], color=colors[reg], lw=2.5, label=labels[reg])

ax_top.set_ylabel("NIFTY 50 Index Level (INR)")
ax_top.set_title("Historical NIFTY 50 Trajectory Partitioned by Classified Macro Regimes", fontweight="bold")
ax_top.grid(True, linestyle=":", alpha=0.5)
ax_top.legend(loc="upper left", frameon=True, facecolor="white", edgecolor="#CBD5E1")

# Bottom plot: Regime Probability Stream
ax_bot.stackplot(
    dates,
    probas[MarketRegimeType.LOW_VOLATILITY_BULL.value],
    probas[MarketRegimeType.SIDEWAYS_CONSOLIDATION.value],
    probas[MarketRegimeType.HIGH_VOLATILITY_BEAR.value],
    labels=["P(Bull)", "P(Sideways)", "P(Bear)"],
    colors=[colors[MarketRegimeType.LOW_VOLATILITY_BULL],
            colors[MarketRegimeType.SIDEWAYS_CONSOLIDATION],
            colors[MarketRegimeType.HIGH_VOLATILITY_BEAR]],
    alpha=0.75
)
ax_bot.set_ylabel("Posterior P(k)")
ax_bot.set_ylim(0, 1.0)
ax_bot.set_xlabel("Historical Date")
ax_bot.grid(True, linestyle=":", alpha=0.5)

plt.tight_layout()
plt.savefig("docs/research_paper/figures/fig3_nifty_regime_timeline.png", dpi=300, bbox_inches='tight')
plt.savefig("docs/research_paper/figures/fig3_nifty_regime_timeline.pdf", bbox_inches='tight')
print("Successfully generated Figure 3: fig3_nifty_regime_timeline")
