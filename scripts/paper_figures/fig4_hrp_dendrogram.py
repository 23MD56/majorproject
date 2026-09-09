"""
Generate Figure 4: HRP Correlation Distance Dendrogram and Asset Clustering.
Redesigned with increased width, readable font sizes, proper label margins, and no overlap.
Outputs to docs/research_paper/figures/fig4_hrp_dendrogram.png and .pdf
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.cluster.hierarchy import dendrogram, linkage
from scipy.spatial.distance import squareform

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

from app.data.service import MarketDataService
from app.ml.portfolio.hrp import compute_shrunk_covariance

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 9.0,
    "axes.labelsize": 9.5,
    "axes.titlesize": 10.5
})

symbols = [
    "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", 
    "ITC", "HINDUNILVR", "TATASTEEL", "HINDALCO", "SUNPHARMA",
    "BEL", "HAL", "GOLDBEES", "SILVERBEES"
]

print(f"Fetching returns for representative portfolio universe: {symbols}...")
service = MarketDataService()
returns_dict = {}

for sym in symbols:
    df = service.get_history(sym)
    if not df.empty:
        returns_dict[sym] = df["close"].pct_change().dropna()

returns_df = pd.DataFrame(returns_dict).dropna()

# Compute regularized covariance via Ledoit-Wolf
cov_matrix, shrinkage = compute_shrunk_covariance(returns_df, use_shrinkage=True)

# Correlation matrix
diag_std = np.sqrt(np.maximum(np.diag(cov_matrix), 1e-8))
outer_std = np.maximum(np.outer(diag_std, diag_std), 1e-8)
corr_matrix = np.clip(cov_matrix / outer_std, -1.0, 1.0)
np.fill_diagonal(corr_matrix, 1.0)

# Distance matrix: d_ij = sqrt(0.5 * (1 - rho_ij))
dist_matrix = np.sqrt(np.clip(0.5 * (1.0 - corr_matrix), 0.0, 1.0))
np.fill_diagonal(dist_matrix, 0.0)

# Hierarchical Single-Linkage Clustering
condensed_dist = squareform(dist_matrix, checks=False)
link_matrix = linkage(condensed_dist, method="single")

# Expanded figure width and height for crystal-clear label legibility
fig, (ax_dendro, ax_heat) = plt.subplots(1, 2, figsize=(10.5, 4.8), dpi=300, gridspec_kw={'width_ratios': [1.15, 1.0], 'wspace': 0.28})

# Dendrogram
dendro = dendrogram(
    link_matrix,
    labels=list(returns_df.columns),
    leaf_rotation=45,
    leaf_font_size=8.5,
    ax=ax_dendro,
    color_threshold=0.55,
    above_threshold_color="#475569"
)
ax_dendro.set_title("Hierarchical Risk Parity: Asset Dendrogram Tree", fontweight="bold", pad=10)
ax_dendro.set_ylabel("Correlation Distance $d_{i,j} = \\sqrt{0.5(1 - \\rho_{i,j})}$")
ax_dendro.grid(axis='y', linestyle=':', alpha=0.6)
ax_dendro.tick_params(axis='x', which='both', bottom=True, top=False, labelbottom=True)

# Reordered Correlation Heatmap (Quasi-Diagonalization)
order = dendro['leaves']
reordered_corr = corr_matrix[np.ix_(order, order)]
reordered_labels = [returns_df.columns[i] for i in order]

im = ax_heat.imshow(reordered_corr, cmap="coolwarm", vmin=-0.2, vmax=1.0)
ax_heat.set_xticks(range(len(order)))
ax_heat.set_yticks(range(len(order)))
ax_heat.set_xticklabels(reordered_labels, rotation=45, ha="right", fontsize=8.2)
ax_heat.set_yticklabels(reordered_labels, fontsize=8.2)
ax_heat.set_title("Quasi-Diagonalized Correlation", fontweight="bold", pad=10)

cbar = fig.colorbar(im, ax=ax_heat, fraction=0.046, pad=0.05)
cbar.ax.tick_params(labelsize=8.0)
cbar.set_label("Pearson Correlation ($\\rho_{i,j}$)", fontsize=8.5)

plt.tight_layout()
plt.savefig("docs/research_paper/figures/fig4_hrp_dendrogram.png", dpi=300, bbox_inches='tight')
plt.savefig("docs/research_paper/figures/fig4_hrp_dendrogram.pdf", bbox_inches='tight')
print("Successfully regenerated Figure 4 with high readability and 45-degree angled labels!")
