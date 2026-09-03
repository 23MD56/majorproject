"""Unit tests for SQLite Relational Multi-Portfolio Storage (Ticket #19)."""

import pytest
from app.core.models import (
    BenchmarkComparisonLive,
    MarketRegimeType,
    PortfolioHolding,
    PortfolioState,
    RiskPersona,
)
from app.data.storage import (
    DailySnapshotRecord,
    HoldingRecord,
    PortfolioRecord,
    PortfolioRepository,
    TransactionRecord,
)


@pytest.fixture
def repo():
    """Create in-memory SQLite PortfolioRepository."""
    return PortfolioRepository(database_url="sqlite:///:memory:")


@pytest.fixture
def sample_portfolio_state():
    """Create a sample PortfolioState for storage tests."""
    holdings = [
        PortfolioHolding(
            symbol="RELIANCE",
            name="Reliance Industries Ltd.",
            sector="Energy",
            shares=10,
            buy_price=2500.0,
            current_price=2600.0,
            prev_close_price=2550.0,
            invested_amount=25000.0,
            current_value=26000.0,
            unrealized_pnl=1000.0,
            unrealized_pnl_pct=4.0,
            pnl_1d=500.0,
            pnl_1d_pct=1.96,
            weight=0.52,
        ),
        PortfolioHolding(
            symbol="TCS",
            name="Tata Consultancy Services Ltd.",
            sector="Information Technology",
            shares=6,
            buy_price=3500.0,
            current_price=3600.0,
            prev_close_price=3580.0,
            invested_amount=21000.0,
            current_value=21600.0,
            unrealized_pnl=600.0,
            unrealized_pnl_pct=2.86,
            pnl_1d=120.0,
            pnl_1d_pct=0.56,
            weight=0.43,
        ),
    ]
    return PortfolioState(
        portfolio_id="port_test_001",
        name="Retirement SIP",
        initial_capital=50000.0,
        cash=2400.0,
        invested_capital=46000.0,
        current_value=50000.0,
        total_pnl=1600.0,
        total_pnl_pct=3.2,
        pnl_1d=620.0,
        pnl_1d_pct=1.25,
        holdings=holdings,
        benchmark_comparison=BenchmarkComparisonLive(
            portfolio_return_pct=3.2,
            nifty_return_pct=2.1,
            bank_fd_return_pct=0.58,
            alpha_vs_nifty=1.1,
            alpha_vs_fd=2.62,
        ),
        initial_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        current_regime=MarketRegimeType.LOW_VOLATILITY_BULL,
        risk_persona=RiskPersona.BALANCED,
        horizon="6M",
        created_at="2026-09-01",
        as_of_date="2026-09-03",
    )


def test_portfolio_schema_creation(repo):
    """Verify that portfolios, holdings, transactions, and daily_snapshots tables are created."""
    tables = repo.get_table_names()
    assert "portfolios" in tables
    assert "holdings" in tables
    assert "transactions" in tables
    assert "daily_snapshots" in tables


def test_save_and_get_portfolio(repo, sample_portfolio_state):
    """Saving a portfolio persists portfolio record, holdings, transactions, and initial snapshot."""
    repo.save_portfolio(sample_portfolio_state)

    fetched = repo.get_portfolio("port_test_001")
    assert fetched is not None
    assert fetched.portfolio_id == "port_test_001"
    assert fetched.name == "Retirement SIP"
    assert fetched.initial_capital == 50000.0
    assert fetched.current_value == 50000.0
    assert fetched.pnl_1d == 620.0
    assert fetched.pnl_1d_pct == 1.25
    assert len(fetched.holdings) == 2

    # Check holding details
    rel = next(h for h in fetched.holdings if h.symbol == "RELIANCE")
    assert rel.shares == 10
    assert rel.pnl_1d == 500.0
    assert rel.prev_close_price == 2550.0

    # Verify transactions ledger recorded BUY actions
    txs = repo.get_transactions("port_test_001")
    assert len(txs) >= 2
    assert all(tx["action"] == "BUY" for tx in txs)

    # Verify daily snapshot was recorded
    snapshots = repo.get_daily_snapshots("port_test_001")
    assert len(snapshots) >= 1
    assert snapshots[0]["total_value"] == 50000.0


def test_list_portfolios(repo, sample_portfolio_state):
    """Listing portfolios returns all saved goal portfolios."""
    repo.save_portfolio(sample_portfolio_state)

    # Save a second portfolio
    port2 = sample_portfolio_state.model_copy(
        update={"portfolio_id": "port_test_002", "name": "Emergency Buffer"}
    )
    repo.save_portfolio(port2)

    all_ports = repo.list_portfolios()
    assert len(all_ports) == 2
    names = [p.name for p in all_ports]
    assert "Retirement SIP" in names
    assert "Emergency Buffer" in names


def test_delete_portfolio_cascades(repo, sample_portfolio_state):
    """Deleting a portfolio removes portfolio record, holdings, transactions, and snapshots."""
    repo.save_portfolio(sample_portfolio_state)
    assert repo.get_portfolio("port_test_001") is not None

    deleted = repo.delete_portfolio("port_test_001")
    assert deleted is True
    assert repo.get_portfolio("port_test_001") is None
    assert len(repo.get_transactions("port_test_001")) == 0
    assert len(repo.get_daily_snapshots("port_test_001")) == 0
