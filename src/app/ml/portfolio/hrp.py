"""Hierarchical Risk Parity (HRP) Portfolio Allocation Engine.

Implements the Lopez de Prado (2016) Hierarchical Risk Parity algorithm:
1. Tree Clustering via Correlation Distance Matrix.
2. Quasi-Diagonalization of the Covariance Matrix.
3. Recursive Bisection using Inverse Cluster Variance.
4. Risk-Persona Concentration Capping and Rebalancing.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage, to_tree
from scipy.spatial.distance import squareform
from sklearn.covariance import LedoitWolf

from app.core.models import RiskPersona
from app.universe import get_esg_score_for_symbol


def compute_shrunk_covariance(
    returns_df: pd.DataFrame,
    use_shrinkage: bool = True,
) -> Tuple[np.ndarray, float]:
    """Compute regularized covariance matrix with Ledoit-Wolf shrinkage and automated fallback.
    
    Args:
        returns_df: DataFrame of asset return series (columns as symbols).
        use_shrinkage: Whether to apply Ledoit-Wolf shrinkage. Defaults to True.
        
    Returns:
        Tuple of (covariance_matrix, shrinkage_intensity).
    """
    n_samples, n_features = returns_df.shape
    if n_features == 0:
        return np.empty((0, 0)), 0.0
    if n_features == 1:
        var = float(returns_df.iloc[:, 0].var(ddof=1)) if n_samples > 1 else 1e-4
        if not np.isfinite(var) or var <= 0:
            var = 1e-4
        return np.array([[max(var, 1e-8)]]), 0.0

    if use_shrinkage and n_samples >= 2:
        try:
            X = returns_df.to_numpy(dtype=np.float64, copy=True)
            if np.all(np.isfinite(X)):
                lw = LedoitWolf(assume_centered=False)
                lw.fit(X)
                cov = lw.covariance_
                shrinkage = float(lw.shrinkage_)
                
                # Verify symmetry, finiteness, non-negative shrinkage
                if np.all(np.isfinite(cov)) and not np.isnan(shrinkage):
                    cov = 0.5 * (cov + cov.T)
                    # Add ridge regularization to guarantee strictly positive-definite conditioning
                    cov += np.eye(n_features) * 1e-7
                    return cov, float(np.clip(shrinkage, 0.0, 1.0))
        except Exception:
            # Automated fallback to empirical sample covariance
            pass

    # Fallback: Empirical sample covariance with ridge regularization
    try:
        cov = returns_df.cov().to_numpy(dtype=np.float64, copy=True)
        cov = np.nan_to_num(cov, nan=0.0, posinf=0.0, neginf=0.0)
    except Exception:
        cov = np.zeros((n_features, n_features))
        
    cov = 0.5 * (cov + cov.T)
    cov += np.eye(n_features) * 1e-7
    return cov, 0.0


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
    inv_diag = 1.0 / np.maximum(np.diag(sub_cov), 1e-8)
    # Handle zero or infinite variance edge cases
    inv_diag = np.nan_to_num(inv_diag, nan=1.0, posinf=1.0, neginf=1.0)
    if np.sum(inv_diag) == 0:
        w = np.ones(len(cluster_indices)) / len(cluster_indices)
    else:
        w = inv_diag / np.sum(inv_diag)
    var = float(w @ sub_cov @ w)
    return max(var, 1e-8)


def recursive_bisection(
    cov: np.ndarray,
    sort_order: List[int],
    initial_weights: Optional[np.ndarray] = None,
) -> np.ndarray:
    """Perform recursive bisection to compute HRP portfolio weights."""
    if initial_weights is not None:
        weights = pd.Series(initial_weights[sort_order], index=sort_order)
    else:
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

    raw_vals = weights.sort_index().values
    total = np.sum(raw_vals)
    if total > 0:
        return raw_vals / total
    return raw_vals


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
    initial_weights: Optional[np.ndarray] = None,
) -> Dict[str, float]:
    """Compute HRP weights from a covariance matrix and asset symbols."""
    n_assets = len(symbols)
    if n_assets == 0:
        return {}
    if n_assets == 1:
        return {symbols[0]: 1.0}

    # 1. Correlation Matrix
    diag_std = np.sqrt(np.maximum(np.diag(cov_matrix), 1e-8))
    outer_std = np.maximum(np.outer(diag_std, diag_std), 1e-8)
    corr_matrix = np.clip(cov_matrix / outer_std, -1.0, 1.0)
    np.fill_diagonal(corr_matrix, 1.0)

    # 2. Distance Matrix D_i,j = sqrt(0.5 * (1 - rho_i,j))
    dist_matrix = np.sqrt(np.clip(0.5 * (1.0 - corr_matrix), 0.0, 1.0))
    dist_matrix = np.nan_to_num(dist_matrix, nan=0.0, posinf=0.0, neginf=0.0)
    dist_matrix = 0.5 * (dist_matrix + dist_matrix.T)
    np.fill_diagonal(dist_matrix, 0.0)

    # 3. Tree Clustering Linkage
    condensed_dist = squareform(dist_matrix, checks=False)
    link_matrix = linkage(condensed_dist, method="single")

    # 4. Quasi-Diagonalization
    sort_order = get_quasi_diag_order(link_matrix)

    # 5. Recursive Bisection
    raw_weights_arr = recursive_bisection(cov_matrix, sort_order, initial_weights=initial_weights)
    
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
        RiskPersona.ESG_CONSCIOUS: 0.22,
    }

    def optimize(
        self,
        returns_df: pd.DataFrame,
        risk_persona: RiskPersona = RiskPersona.BALANCED,
        max_weight_cap: Optional[float] = None,
        use_shrinkage: bool = True,
        esg_scores: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """Optimize portfolio allocation across assets in returns_df."""
        symbols = list(returns_df.columns)
        if not symbols:
            return {}
        if len(symbols) == 1:
            return {symbols[0]: 1.0}

        cov_matrix, _ = compute_shrunk_covariance(returns_df, use_shrinkage=use_shrinkage)

        if max_weight_cap is not None:
            cap = max_weight_cap
        elif len(symbols) < 5:
            cap = None
        else:
            cap = self.PERSONA_MAX_CAPS.get(risk_persona, 0.22)

        initial_weights = None
        if risk_persona == RiskPersona.ESG_CONSCIOUS:
            init_w_list = []
            for sym in symbols:
                esg_val = 50.0
                if esg_scores and sym in esg_scores:
                    esg_val = float(esg_scores[sym])
                else:
                    esg_meta = get_esg_score_for_symbol(sym)
                    if esg_meta:
                        esg_val = float(esg_meta.get("esg_composite", 50.0))
                # Additive weight bias toward stocks with esg_composite >= 70 before HRP bisection
                bias = 0.50 if esg_val >= 70.0 else 0.0
                init_w_list.append(1.0 + bias)
            initial_weights = np.array(init_w_list, dtype=np.float64)

        weights = compute_hrp_weights(
            cov_matrix,
            symbols=symbols,
            max_cap=cap,
            initial_weights=initial_weights,
        )
        return weights
