"""Discrete Integer Allocation and Cash Buffer Engine.

Converts continuous theoretical portfolio weights into whole-share quantities
(n_i in Z_>=0) given a target capital amount, calculating the exact remaining
unallocated cash buffer.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import numpy as np
from scipy.optimize import LinearConstraint, milp


@dataclass
class DiscreteAllocationResult:
    """Result of discrete portfolio allocation."""

    shares: Dict[str, int]
    allocated_amounts: Dict[str, float]
    actual_weights: Dict[str, float]
    total_invested: float
    unallocated_cash: float
    cash_buffer_pct: float


class DiscreteAllocationEngine:
    """Integer programming and greedy discrete portfolio allocation engine."""

    def allocate_greedy(
        self,
        weights: Dict[str, float],
        prices: Dict[str, float],
        capital: float,
    ) -> DiscreteAllocationResult:
        """Allocate discrete whole shares using a greedy deficit-minimization algorithm.

        Parameters
        ----------
        weights : Dict[str, float]
            Target continuous weights summing to ~1.0.
        prices : Dict[str, float]
            Latest asset prices in INR.
        capital : float
            Total investment capital available.

        Returns
        -------
        DiscreteAllocationResult
            Integer shares, allocated amounts, actual weights, and unallocated cash buffer.
        """
        if capital <= 0:
            return self._empty_result(weights, capital)

        # Filter valid assets with positive price
        valid_symbols = [
            s for s in weights
            if s in prices and prices[s] > 0 and weights.get(s, 0.0) > 0
        ]

        if not valid_symbols:
            return self._empty_result(weights, capital)

        # Normalize weights for valid assets
        total_w = sum(weights[s] for s in valid_symbols)
        norm_w = {s: weights[s] / total_w for s in valid_symbols}

        shares: Dict[str, int] = {s: 0 for s in weights}
        
        # 1. Base allocation: floor(target_amount / price)
        allocated_cash = 0.0
        for s in valid_symbols:
            target_amount = norm_w[s] * capital
            price = prices[s]
            n = int(target_amount // price)
            shares[s] = n
            allocated_cash += n * price

        remaining_cash = round(capital - allocated_cash, 4)

        # 2. Greedily allocate remaining cash to asset with largest weight deficit
        while remaining_cash > 0:
            affordable = [s for s in valid_symbols if prices[s] <= remaining_cash]
            if not affordable:
                break

            # Find affordable asset with the largest deficit: target_weight - current_weight
            def deficit(s: str) -> float:
                curr_w = (shares[s] * prices[s]) / capital
                return norm_w[s] - curr_w

            best_sym = max(affordable, key=deficit)
            
            # If even the best asset is already over target weight significantly, check if we can still improve
            shares[best_sym] += 1
            remaining_cash = round(remaining_cash - prices[best_sym], 4)

        return self._build_result(shares, prices, capital)

    def allocate_lp(
        self,
        weights: Dict[str, float],
        prices: Dict[str, float],
        capital: float,
    ) -> DiscreteAllocationResult:
        """Allocate discrete whole shares using Mixed-Integer Linear Programming (MILP).

        Minimizes total absolute tracking error: sum |w_i * capital - n_i * p_i|
        Subject to: sum (n_i * p_i) <= capital, n_i in Z_>=0.
        """
        if capital <= 0:
            return self._empty_result(weights, capital)

        valid_symbols = [
            s for s in weights
            if s in prices and prices[s] > 0 and weights.get(s, 0.0) > 0
        ]

        if not valid_symbols:
            return self._empty_result(weights, capital)

        m = len(valid_symbols)
        p = np.array([prices[s] for s in valid_symbols], dtype=float)
        w = np.array([weights[s] for s in valid_symbols], dtype=float)
        w = w / np.sum(w)
        target_amt = w * capital

        # Decision variables x = [n_0, ..., n_{m-1}, u_0, ..., u_{m-1}]
        # n_i: integer share counts (0 <= n_i <= floor(capital / p_i))
        # u_i: continuous tracking error slack variables (u_i >= |target_amt_i - n_i * p_i|)
        c = np.zeros(2 * m)
        c[m:] = 1.0  # Minimize sum(u_i)

        # Integrality: 1 for integer (n_i), 0 for continuous (u_i)
        integrality = np.zeros(2 * m)
        integrality[:m] = 1

        # Bounds
        upper_bounds_n = np.floor(capital / p)
        lb = np.zeros(2 * m)
        ub = np.full(2 * m, np.inf)
        ub[:m] = upper_bounds_n

        # Constraints:
        # 1. Budget constraint: sum(p_i * n_i) <= capital
        # 2. Slack 1: u_i + p_i * n_i >= target_amt_i  =>  p_i * n_i + u_i >= target_amt_i
        # 3. Slack 2: u_i - p_i * n_i >= -target_amt_i => -p_i * n_i + u_i >= -target_amt_i
        num_constraints = 1 + 2 * m
        A = np.zeros((num_constraints, 2 * m))
        lhs = np.zeros(num_constraints)
        rhs = np.zeros(num_constraints)

        # Constraint 0: Budget
        A[0, :m] = p
        lhs[0] = 0.0
        rhs[0] = capital

        # Slack constraints
        for i in range(m):
            # p_i * n_i + u_i >= target_amt_i
            A[1 + i, i] = p[i]
            A[1 + i, m + i] = 1.0
            lhs[1 + i] = target_amt[i]
            rhs[1 + i] = np.inf

            # -p_i * n_i + u_i >= -target_amt_i
            A[1 + m + i, i] = -p[i]
            A[1 + m + i, m + i] = 1.0
            lhs[1 + m + i] = -target_amt[i]
            rhs[1 + m + i] = np.inf

        constraints = LinearConstraint(A, lhs, rhs)

        try:
            res = milp(c=c, integrality=integrality, bounds=(lb, ub), constraints=constraints)
            if res.success and res.x is not None:
                raw_n = np.round(res.x[:m]).astype(int)
                # Verify budget constraint strictly
                if np.sum(raw_n * p) <= capital:
                    shares: Dict[str, int] = {s: 0 for s in weights}
                    for i, s in enumerate(valid_symbols):
                        shares[s] = int(raw_n[i])
                    return self._build_result(shares, prices, capital)
        except Exception:
            pass

        # Fallback to greedy if MILP did not find valid solution
        return self.allocate_greedy(weights=weights, prices=prices, capital=capital)

    def allocate(
        self,
        weights: Dict[str, float],
        prices: Dict[str, float],
        capital: float,
        method: str = "ilp",
    ) -> DiscreteAllocationResult:
        """Allocate discrete whole shares with automatic solver selection."""
        if method.lower() == "greedy":
            return self.allocate_greedy(weights=weights, prices=prices, capital=capital)
        return self.allocate_lp(weights=weights, prices=prices, capital=capital)

    def _build_result(
        self,
        shares: Dict[str, int],
        prices: Dict[str, float],
        capital: float,
    ) -> DiscreteAllocationResult:
        """Construct DiscreteAllocationResult from shares, prices, and capital."""
        allocated_amounts: Dict[str, float] = {}
        actual_weights: Dict[str, float] = {}
        total_invested = 0.0

        for sym, n in shares.items():
            price = prices.get(sym, 0.0)
            amt = round(n * price, 2)
            allocated_amounts[sym] = amt
            total_invested += amt

        total_invested = round(total_invested, 2)
        unallocated_cash = max(0.0, round(capital - total_invested, 2))
        cash_buffer_pct = round((unallocated_cash / capital) * 100.0, 2) if capital > 0 else 0.0

        for sym, amt in allocated_amounts.items():
            actual_weights[sym] = round(amt / capital, 4) if capital > 0 else 0.0

        return DiscreteAllocationResult(
            shares=shares,
            allocated_amounts=allocated_amounts,
            actual_weights=actual_weights,
            total_invested=total_invested,
            unallocated_cash=unallocated_cash,
            cash_buffer_pct=cash_buffer_pct,
        )

    def _empty_result(
        self,
        weights: Dict[str, float],
        capital: float,
    ) -> DiscreteAllocationResult:
        """Return zero allocation with all cash unallocated."""
        shares = {s: 0 for s in weights}
        amounts = {s: 0.0 for s in weights}
        act_w = {s: 0.0 for s in weights}
        cash = max(0.0, round(capital, 2))
        return DiscreteAllocationResult(
            shares=shares,
            allocated_amounts=amounts,
            actual_weights=act_w,
            total_invested=0.0,
            unallocated_cash=cash,
            cash_buffer_pct=100.0 if capital > 0 else 0.0,
        )
