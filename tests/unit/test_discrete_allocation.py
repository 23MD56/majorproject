"""Unit tests for Discrete Integer Allocation & Cash Buffer Engine."""

import pytest
from app.ml.portfolio.allocation import DiscreteAllocationEngine, DiscreteAllocationResult


class TestDiscreteAllocationEngine:
    """Test suite for DiscreteAllocationEngine."""

    @pytest.fixture
    def allocator(self):
        return DiscreteAllocationEngine()

    def test_greedy_allocation_basic(self, allocator):
        """Test greedy allocation on standard 4-stock basket with ₹50,000 capital."""
        weights = {
            "RELIANCE": 0.35,
            "TCS": 0.25,
            "HDFCBANK": 0.25,
            "INFY": 0.15,
        }
        prices = {
            "RELIANCE": 2500.0,
            "TCS": 3500.0,
            "HDFCBANK": 1600.0,
            "INFY": 1500.0,
        }
        capital = 50000.0

        result = allocator.allocate_greedy(weights=weights, prices=prices, capital=capital)

        assert isinstance(result, DiscreteAllocationResult)
        assert isinstance(result.shares, dict)
        
        # Verify integer shares >= 0
        for sym, shares in result.shares.items():
            assert isinstance(shares, int)
            assert shares >= 0

        # Verify total invested <= capital
        assert result.total_invested <= capital
        assert result.total_invested > 0

        # Verify cash buffer calculation
        assert result.unallocated_cash >= 0.0
        assert round(result.total_invested + result.unallocated_cash, 2) == round(capital, 2)
        assert result.cash_buffer_pct >= 0.0
        assert round(result.cash_buffer_pct, 2) == round((result.unallocated_cash / capital) * 100.0, 2)

        # Check calculated allocated amounts match shares * price
        for sym, shares in result.shares.items():
            expected_amt = round(shares * prices[sym], 2)
            assert result.allocated_amounts[sym] == expected_amt

    def test_milp_allocation_basic(self, allocator):
        """Test MILP discrete allocation on standard 4-stock basket with ₹50,000 capital."""
        weights = {
            "RELIANCE": 0.35,
            "TCS": 0.25,
            "HDFCBANK": 0.25,
            "INFY": 0.15,
        }
        prices = {
            "RELIANCE": 2500.0,
            "TCS": 3500.0,
            "HDFCBANK": 1600.0,
            "INFY": 1500.0,
        }
        capital = 50000.0

        result = allocator.allocate_lp(weights=weights, prices=prices, capital=capital)

        assert isinstance(result, DiscreteAllocationResult)
        # Verify integer shares
        for sym, shares in result.shares.items():
            assert isinstance(shares, int)
            assert shares >= 0

        # Verify total spend does not exceed available capital
        assert result.total_invested <= capital
        assert result.unallocated_cash >= 0.0
        assert round(result.total_invested + result.unallocated_cash, 2) == round(capital, 2)

    def test_unified_allocate_method_default(self, allocator):
        """Test default allocate() method returns valid discrete result."""
        weights = {"TCS": 0.6, "INFY": 0.4}
        prices = {"TCS": 3400.0, "INFY": 1500.0}
        capital = 20000.0

        result = allocator.allocate(weights=weights, prices=prices, capital=capital)

        assert result.total_invested <= capital
        assert result.unallocated_cash >= 0.0
        assert round(result.total_invested + result.unallocated_cash, 2) == round(capital, 2)
        assert sum(result.actual_weights.values()) <= 1.0001

    def test_edge_case_capital_less_than_cheapest_stock(self, allocator):
        """When capital is strictly less than cheapest stock price, shares should be 0 and cash=capital."""
        weights = {"MRF": 1.0}
        prices = {"MRF": 130000.0}
        capital = 50000.0

        result = allocator.allocate(weights=weights, prices=prices, capital=capital)

        assert result.shares["MRF"] == 0
        assert result.total_invested == 0.0
        assert result.unallocated_cash == 50000.0
        assert result.cash_buffer_pct == 100.0

    def test_edge_case_zero_weights_or_prices(self, allocator):
        """Test handling of 0 weights or invalid input."""
        weights = {"RELIANCE": 0.0, "TCS": 1.0}
        prices = {"RELIANCE": 2500.0, "TCS": 3500.0}
        capital = 10000.0

        result = allocator.allocate(weights=weights, prices=prices, capital=capital)

        assert result.shares["RELIANCE"] == 0
        assert result.shares["TCS"] == 2  # 2 * 3500 = 7000 <= 10000
        assert result.total_invested == 7000.0
        assert result.unallocated_cash == 3000.0

    def test_large_capital_and_many_assets(self, allocator):
        """Test allocation for ₹10,00,000 across 8 assets."""
        weights = {
            "RELIANCE": 0.20,
            "TCS": 0.15,
            "HDFCBANK": 0.15,
            "INFY": 0.10,
            "ICICIBANK": 0.10,
            "BHARTIARTL": 0.10,
            "ITC": 0.10,
            "LT": 0.10,
        }
        prices = {
            "RELIANCE": 2950.0,
            "TCS": 4120.0,
            "HDFCBANK": 1650.0,
            "INFY": 1820.0,
            "ICICIBANK": 1180.0,
            "BHARTIARTL": 1540.0,
            "ITC": 490.0,
            "LT": 3650.0,
        }
        capital = 1000000.0

        result = allocator.allocate(weights=weights, prices=prices, capital=capital)

        assert result.total_invested <= capital
        assert result.unallocated_cash >= 0.0
        assert round(result.total_invested + result.unallocated_cash, 2) == round(capital, 2)
        # With 10L capital, cash buffer should be very small (< 1%)
        assert result.cash_buffer_pct < 1.0
