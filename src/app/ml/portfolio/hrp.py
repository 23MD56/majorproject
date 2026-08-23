"""Hierarchical Risk Parity (HRP) Portfolio Allocation Engine.

Implements the Lopez de Prado (2016) Hierarchical Risk Parity algorithm:
1. Tree Clustering via Correlation Distance Matrix.
2. Quasi-Diagonalization of the Covariance Matrix.
3. Recursive Bisection using Inverse Cluster Variance.
4. Risk-Persona Concentration Capping and Rebalancing.
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage, to_tree
from scipy.spatial.distance import squareform

from app.core.models import RiskPersona


def get_quasi_diag_order(link_matrix: np.ndarray) -> List[int]:
    """Extract leaf order from hierarchical cluster linkage matrix."""
    root = to_tree(link_matrix, rd=False)
    
    order: List[int] = []
    
    def _traverse(node):
        if node.is_leaf():
            order.append(node.id)
        else:
            if node.left:
                _traverse(node.left)
            if node.right:
                _traverse(node.right)
                
    _traverse(root)
    return order


def get_cluster_variance(cov: np.ndarray, cluster_indices: List[int]) -> float:
    """Compute variance of an inverse-variance weighted sub-cluster."""
    sub_cov = cov[np.ix_(cluster_indices, cluster_indices)]
    inv_diag = 1.0 / np.diag(sub_cov)
    # Handle zero or infinite variance edge cases
    inv_diag = np.nan_to_num(inv_diag, nan=1.0, posinf=1.0, neginf=1.0)
    if np.sum(inv_diag) == 0:
        w = np.ones(len(cluster_indices)) / len(cluster_indices)
    else:
        w = inv_diag / np.sum(inv_diag)
    var = float(w @ sub_cov @ w)
    return max(var, 1e-8)


def recursive_bisection(cov: np.ndarray, sort_order: List[int]) -> np.ndarray:
    """Perform recursive bisection to compute HRP portfolio weights."""
    weights = pd.Series(1.0, index=sort_order)
    clusters = [sort_order]

    while len(clusters) > 0:
        new_clusters = []
        for cluster in clusters:
            if len(cluster) > 1:
                mid = len(cluster) // 2
                left_cluster = cluster[:mid]
                right_cluster = cluster[mid:]

                left_var = get_cluster_variance(cov, left_cluster)
                right_var = get_cluster_variance(cov, right_cluster)

                # Inverse variance allocation factor
                alpha = 1.0 - left_var / (left_var + right_var)

                # Update weights
                weights[left_cluster] *= alpha
                weights[right_cluster] *= (1.0 - alpha)

                if len(left_cluster) > 1:
                    new_clusters.append(left_cluster)
                if len(right_cluster) > 1:
                    new_clusters.append(right_cluster)

        clusters = new_clusters

    return weights.sort_index().values


def apply_weight_caps(
    raw_weights: Dict[str, float],
    max_cap: float,
    max_iter: int = 50,
) -> Dict[str, float]:
    """Iteratively apply single-asset maximum concentration cap and re-normalize."""
    n_assets = len(raw_weights)
    if n_assets == 0:
        return {}
    
    # Cap cannot be lower than 1 / n_assets
    effective_cap = max(max_cap, 1.0 / n_assets)
    
    weights = dict(raw_weights)
    
    for _ in range(max_iter):
        excess = 0.0
        uncapped_symbols = []
        
        for sym, w in weights.items():
            if w > effective_cap:
                excess += (w - effective_cap)
                weights[sym] = effective_cap
            else:
                uncapped_symbols.append(sym)
                
        if excess <= 1e-7 or not uncapped_symbols:
            break
            
        uncapped_sum = sum(weights[sym] for sym in uncapped_symbols)
        if uncapped_sum > 0:
            for sym in uncapped_symbols:
                weights[sym] += excess * (weights[sym] / uncapped_sum)
        else:
            share = excess / len(uncapped_symbols)
            for sym in uncapped_symbols:
                weights[sym] += share

    # Final normalization
    total = sum(weights.values())
    if total > 0:
        weights = {sym: float(w / total) for sym, w in weights.items()}
    return weights


def compute_hrp_weights(
    cov_matrix: np.ndarray,
    symbols: List[str],
    max_cap: Optional[float] = None,
) -> Dict[str, float]:
    """Compute HRP weights from a covariance matrix and asset symbols."""
    n_assets = len(symbols)
    if n_assets == 0:
        return {}
    if n_assets == 1:
        return {symbols[0]: 1.0}

    # 1. Correlation Matrix
    diag_std = np.sqrt(np.diag(cov_matrix))
    diag_std[diag_std == 0] = 1e-4
    corr_matrix = cov_matrix / np.outer(diag_std, diag_std)
    corr_matrix = np.clip(corr_matrix, -1.0, 1.0)
    np.fill_diagonal(corr_matrix, 1.0)

    # 2. Distance Matrix D_i,j = sqrt(0.5 * (1 - rho_i,j))
    dist_matrix = np.sqrt(np.clip(0.5 * (1.0 - corr_matrix), 0.0, 1.0))
    np.fill_diagonal(dist_matrix, 0.0)

    # 3. Tree Clustering Linkage
    condensed_dist = squareform(dist_matrix, checks=False)
    link_matrix = linkage(condensed_dist, method="single")

    # 4. Quasi-Diagonalization
    sort_order = get_quasi_diag_order(link_matrix)

    # 5. Recursive Bisection
    raw_weights_arr = recursive_bisection(cov_matrix, sort_order)
    
    weights_dict = {
        symbols[i]: float(raw_weights_arr[i])
        for i in range(n_assets)
    }

    # 6. Apply concentration cap if specified
    if max_cap is not None:
        weights_dict = apply_weight_caps(weights_dict, max_cap=max_cap)
    else:
        total = sum(weights_dict.values())
        weights_dict = {sym: float(w / total) for sym, w in weights_dict.items()}

    return weights_dict


class HRPOptimizer:
    """Hierarchical Risk Parity Optimizer configured with Risk Persona profiles."""

    PERSONA_MAX_CAPS = {
        RiskPersona.CONSERVATIVE: 0.15,
        RiskPersona.BALANCED: 0.22,
        RiskPersona.AGGRESSIVE: 0.32,
    }

    def optimize(
        self,
        returns_df: pd.DataFrame,
        risk_persona: RiskPersona = RiskPersona.BALANCED,
        max_weight_cap: Optional[float] = None,
    ) -> Dict[str, float]:
        """Optimize portfolio allocation across assets in returns_df."""
        symbols = list(returns_df.columns)
        if not symbols:
            return {}
        if len(symbols) == 1:
            return {symbols[0]: 1.0}

        cov_matrix = returns_df.cov().to_numpy(copy=True)
        # Add small ridge regularization to prevent singular covariance
        cov_matrix += np.eye(len(symbols)) * 1e-7

        if max_weight_cap is not None:
            cap = max_weight_cap
        elif len(symbols) < 5:
            cap = None
        else:
            cap = self.PERSONA_MAX_CAPS.get(risk_persona, 0.22)

        weights = compute_hrp_weights(cov_matrix, symbols=symbols, max_cap=cap)
        return weights
