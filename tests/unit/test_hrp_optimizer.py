"""Unit tests for Hierarchical Risk Parity (HRP) Portfolio Optimizer."""

import numpy as np
import pandas as pd
import pytest

from app.core.models import RiskPersona
from app.ml.portfolio.hrp import HRPOptimizer, compute_hrp_weights


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
