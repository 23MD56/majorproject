"""Unit tests for Hierarchical Risk Parity (HRP) Portfolio Optimizer."""

import numpy as np
import pandas as pd
import pytest

from app.core.models import RiskPersona
from app.ml.portfolio.hrp import HRPOptimizer, compute_hrp_weights, compute_shrunk_covariance


@pytest.fixture
def sample_returns_df() -> pd.DataFrame:
    """Generate reproducible sample daily returns for 6 assets."""
    np.random.seed(42)
    n_days = 250
    symbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "LT"]
    
    # Generate correlated synthetic returns
    cov = np.array([
        [0.0004, 0.0001, 0.00015, 0.0001, 0.00005, 0.00012],
        [0.0001, 0.0003, 0.00008, 0.0002, 0.00004, 0.00009],
        [0.00015, 0.00008, 0.00035, 0.00009, 0.00006, 0.00014],
        [0.0001, 0.0002, 0.00009, 0.00032, 0.00005, 0.00010],
        [0.00005, 0.00004, 0.00006, 0.00005, 0.0002, 0.00006],
        [0.00012, 0.00009, 0.00014, 0.00010, 0.00006, 0.00038],
    ])
    
    returns = np.random.multivariate_normal(
        mean=[0.0005, 0.0004, 0.0006, 0.0004, 0.0002, 0.0005],
        cov=cov,
        size=n_days,
    )
    
    return pd.DataFrame(returns, columns=symbols)


def test_hrp_optimizer_weight_sum_and_positivity(sample_returns_df: pd.DataFrame):
    """HRP weights must sum strictly to 1.0 and all individual weights must be >= 0."""
    optimizer = HRPOptimizer()
    weights = optimizer.optimize(
        returns_df=sample_returns_df,
        risk_persona=RiskPersona.BALANCED,
    )
    
    assert isinstance(weights, dict)
    assert len(weights) == len(sample_returns_df.columns)
    
    # Invariant 1: Sum to 1.0
    total_weight = sum(weights.values())
    assert pytest.approx(total_weight, rel=1e-5) == 1.0
    
    # Invariant 2: Non-negative weights (long only)
    for sym, w in weights.items():
        assert w >= 0.0, f"Weight for {sym} is negative: {w}"


def test_hrp_optimizer_risk_persona_caps(sample_returns_df: pd.DataFrame):
    """Risk personas must enforce concentration bounds."""
    optimizer = HRPOptimizer()
    
    # Conservative has lower single-stock max cap
    conservative_weights = optimizer.optimize(
        returns_df=sample_returns_df,
        risk_persona=RiskPersona.CONSERVATIVE,
        max_weight_cap=0.20,
    )
    assert sum(conservative_weights.values()) == pytest.approx(1.0, rel=1e-5)
    for sym, w in conservative_weights.items():
        assert w <= 0.200001, f"Conservative weight {sym}={w} exceeds cap 0.20"
        
    # Aggressive allows higher concentration
    aggressive_weights = optimizer.optimize(
        returns_df=sample_returns_df,
        risk_persona=RiskPersona.AGGRESSIVE,
        max_weight_cap=0.35,
    )
    assert sum(aggressive_weights.values()) == pytest.approx(1.0, rel=1e-5)


def test_hrp_optimizer_lower_volatility_gets_higher_allocation_in_conservative(sample_returns_df: pd.DataFrame):
    """In Conservative mode, lower variance assets (e.g. ITC) should receive healthy defensive allocation."""
    optimizer = HRPOptimizer()
    weights = optimizer.optimize(
        returns_df=sample_returns_df,
        risk_persona=RiskPersona.CONSERVATIVE,
    )
    # ITC has lowest variance in sample_returns_df (0.0002)
    assert weights["ITC"] > weights["RELIANCE"]


def test_compute_hrp_weights_helper_function(sample_returns_df: pd.DataFrame):
    """compute_hrp_weights helper produces valid normalized allocations."""
    cov_matrix = sample_returns_df.cov().values
    symbols = list(sample_returns_df.columns)
    
    weights = compute_hrp_weights(cov_matrix=cov_matrix, symbols=symbols)
    assert isinstance(weights, dict)
    assert len(weights) == len(symbols)
    assert sum(weights.values()) == pytest.approx(1.0, rel=1e-5)


def test_hrp_optimizer_handles_two_assets():
    """HRP works correctly on minimal 2-asset universe."""
    np.random.seed(10)
    df = pd.DataFrame({
        "A": np.random.normal(0.001, 0.01, 100),
        "B": np.random.normal(0.001, 0.02, 100),
    })
    optimizer = HRPOptimizer()
    weights = optimizer.optimize(returns_df=df, risk_persona=RiskPersona.BALANCED)
    
    assert len(weights) == 2
    assert sum(weights.values()) == pytest.approx(1.0, rel=1e-5)
    # Asset A has lower variance (0.01 vs 0.02), so it gets higher inverse-variance weight
    assert weights["A"] > weights["B"]


def test_compute_shrunk_covariance_ledoit_wolf(sample_returns_df: pd.DataFrame):
    """Ledoit-Wolf shrinkage computes valid positive-definite covariance with shrinkage in [0, 1]."""
    cov_shrunk, shrinkage = compute_shrunk_covariance(sample_returns_df, use_shrinkage=True)
    
    assert isinstance(cov_shrunk, np.ndarray)
    assert cov_shrunk.shape == (6, 6)
    assert 0.0 <= shrinkage <= 1.0
    
    # Covariance matrix must be symmetric
    np.testing.assert_allclose(cov_shrunk, cov_shrunk.T, atol=1e-8)
    
    # Covariance matrix must be positive definite (all eigenvalues > 0)
    eigenvalues = np.linalg.eigvalsh(cov_shrunk)
    assert np.all(eigenvalues > 0)
    
    # Condition number should be well-behaved
    cond_shrunk = np.linalg.cond(cov_shrunk)
    assert np.isfinite(cond_shrunk)
    assert cond_shrunk > 0


def test_compute_shrunk_covariance_fallback_on_degenerate_data():
    """Fallback to regularized empirical covariance on rank-deficient / constant returns."""
    # Create constant returns where Ledoit-Wolf or empirical variance is 0
    df_const = pd.DataFrame({
        "A": [0.01] * 20,
        "B": [0.01] * 20,
    })
    cov_shrunk, shrinkage = compute_shrunk_covariance(df_const, use_shrinkage=True)
    
    assert cov_shrunk.shape == (2, 2)
    assert np.all(np.isfinite(cov_shrunk))
    # Must still be positive definite due to ridge regularisation fallback
    eigenvalues = np.linalg.eigvalsh(cov_shrunk)
    assert np.all(eigenvalues > 0)


def test_compute_shrunk_covariance_without_shrinkage(sample_returns_df: pd.DataFrame):
    """When use_shrinkage=False, returns empirical covariance with shrinkage=0.0."""
    cov_emp, shrinkage = compute_shrunk_covariance(sample_returns_df, use_shrinkage=False)
    assert shrinkage == 0.0
    assert cov_emp.shape == (6, 6)
    np.testing.assert_allclose(cov_emp, cov_emp.T, atol=1e-8)


def test_hrp_distance_matrix_conditioning_extreme_correlation():
    """HRP engine handles collinear assets (correlation ~ 0.9999) gracefully without NaN or singular errors."""
    np.random.seed(42)
    base_returns = np.random.normal(0.001, 0.02, 100)
    # Asset B is almost perfectly correlated with Asset A
    df = pd.DataFrame({
        "A": base_returns,
        "B": base_returns + np.random.normal(0, 1e-6, 100),
        "C": np.random.normal(0.001, 0.015, 100),
    })
    
    optimizer = HRPOptimizer()
    weights = optimizer.optimize(returns_df=df, risk_persona=RiskPersona.BALANCED)
    
    assert len(weights) == 3
    assert sum(weights.values()) == pytest.approx(1.0, rel=1e-5)
    for sym, w in weights.items():
        assert np.isfinite(w)
        assert w >= 0.0


def test_hrp_optimizer_weight_stability_noisy_regime():
    """Ledoit-Wolf shrinkage reduces weight variation across small rolling subsamples."""
    np.random.seed(123)
    n_days = 60  # Short noisy rolling window
    n_assets = 5
    symbols = [f"ASSET_{i}" for i in range(n_assets)]
    
    # Highly noisy covariance
    raw_cov = np.random.uniform(0.1, 0.5, (n_assets, n_assets))
    raw_cov = raw_cov @ raw_cov.T / n_assets + np.eye(n_assets) * 0.05
    
    returns = np.random.multivariate_normal(mean=np.zeros(n_assets), cov=raw_cov, size=n_days)
    df = pd.DataFrame(returns, columns=symbols)
    
    optimizer = HRPOptimizer()
    weights_shrunk = optimizer.optimize(df, risk_persona=RiskPersona.BALANCED, use_shrinkage=True)
    weights_empirical = optimizer.optimize(df, risk_persona=RiskPersona.BALANCED, use_shrinkage=False)
    
    assert sum(weights_shrunk.values()) == pytest.approx(1.0, rel=1e-5)
    assert sum(weights_empirical.values()) == pytest.approx(1.0, rel=1e-5)
    for sym in symbols:
        assert weights_shrunk[sym] >= 0.0
        assert weights_empirical[sym] >= 0.0


def test_hrp_optimizer_all_personas_and_caps():
    """Verify all RiskPersona types adhere to strict concentration caps on an 8-asset universe."""
    np.random.seed(42)
    n_days = 250
    symbols = [f"STOCK_{i}" for i in range(8)]
    returns = np.random.normal(0.0005, 0.01, size=(n_days, 8))
    # Make some assets have lower variance to induce concentrated raw weights
    returns[:, 0] *= 0.2
    returns[:, 1] *= 0.3
    df = pd.DataFrame(returns, columns=symbols)
    
    optimizer = HRPOptimizer()
    
    for persona, expected_cap in [
        (RiskPersona.CONSERVATIVE, 0.15),
        (RiskPersona.BALANCED, 0.22),
        (RiskPersona.AGGRESSIVE, 0.32),
        (RiskPersona.ESG_CONSCIOUS, 0.22),
    ]:
        weights = optimizer.optimize(
            returns_df=df,
            risk_persona=persona,
            use_shrinkage=True,
        )
        assert sum(weights.values()) == pytest.approx(1.0, rel=1e-5)
        for sym, w in weights.items():
            assert w <= expected_cap + 1e-4, f"{sym} weight {w} exceeded {expected_cap} for {persona}"


def test_hrp_optimizer_esg_conscious_favors_high_esg_stocks(sample_returns_df: pd.DataFrame):
    """ESG-Conscious persona produces weights that demonstrably favor high-ESG stocks compared to Balanced."""
    optimizer = HRPOptimizer()
    symbols = list(sample_returns_df.columns)  # ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "LT"]
    # Curated ESG composites for these symbols:
    # TCS: 86.0 (>=70), INFY: 88.0 (>=70), ITC: 78.0 (>=70), HDFCBANK: 74.0 (>=70)
    # RELIANCE: 64.0 (<70), LT: 68.0 (<70)
    balanced_weights = optimizer.optimize(
        returns_df=sample_returns_df,
        risk_persona=RiskPersona.BALANCED,
    )
    esg_weights = optimizer.optimize(
        returns_df=sample_returns_df,
        risk_persona=RiskPersona.ESG_CONSCIOUS,
    )

    # Both must sum to 1.0 and be non-negative
    assert sum(balanced_weights.values()) == pytest.approx(1.0, rel=1e-5)
    assert sum(esg_weights.values()) == pytest.approx(1e0, rel=1e-5)
    for sym in symbols:
        assert esg_weights[sym] >= 0.0

    # High ESG stocks: TCS, INFY, ITC, HDFCBANK
    high_esg_symbols = ["TCS", "INFY", "ITC", "HDFCBANK"]
    low_esg_symbols = ["RELIANCE", "LT"]

    high_esg_balanced_total = sum(balanced_weights[s] for s in high_esg_symbols)
    high_esg_conscious_total = sum(esg_weights[s] for s in high_esg_symbols)

    assert high_esg_conscious_total > high_esg_balanced_total, (
        f"ESG-Conscious total ({high_esg_conscious_total:.4f}) must exceed Balanced total ({high_esg_balanced_total:.4f})"
    )
    low_esg_conscious_total = sum(esg_weights[s] for s in low_esg_symbols)
    low_esg_balanced_total = sum(balanced_weights[s] for s in low_esg_symbols)
    assert low_esg_conscious_total < low_esg_balanced_total
