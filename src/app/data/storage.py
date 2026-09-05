"""Persistent Multi-Portfolio Storage Engine (Ticket #19).

Provides SQLite relational schema and SQLAlchemy 2.0 repository for multi-portfolio
management, holdings tracking, ledger transactions, and daily MTM snapshots.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import (
    Column,
    Float,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    create_engine,
    event,
    inspect,
    select,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
)

from app.core.config import settings
from app.core.models import (
    BenchmarkComparisonLive,
    MarketRegimeType,
    PortfolioHolding,
    PortfolioState,
    RiskPersona,
)


class Base(DeclarativeBase):
    pass


class PortfolioRecord(Base):
    """Relational table storing top-level portfolio goals and valuation metrics."""

    __tablename__ = "portfolios"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    initial_capital: Mapped[float] = mapped_column(Float, default=0.0)
    cash: Mapped[float] = mapped_column(Float, default=0.0)
    invested_capital: Mapped[float] = mapped_column(Float, default=0.0)
    current_value: Mapped[float] = mapped_column(Float, default=0.0)
    total_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    total_pnl_pct: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_1d: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_1d_pct: Mapped[float] = mapped_column(Float, default=0.0)
    initial_regime: Mapped[str] = mapped_column(String(64), default="Low-Volatility Bull")
    current_regime: Mapped[str] = mapped_column(String(64), default="Low-Volatility Bull")
    risk_persona: Mapped[str] = mapped_column(String(32), default="Balanced")
    horizon: Mapped[str] = mapped_column(String(16), default="6M")
    benchmark_nifty_return: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    benchmark_fd_return: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    alpha_vs_nifty: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    alpha_vs_fd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[str] = mapped_column(String(32), default="")
    updated_at: Mapped[str] = mapped_column(String(32), default="")
    as_of_date: Mapped[str] = mapped_column(String(32), default="")

    holdings: Mapped[List["HoldingRecord"]] = relationship(
        "HoldingRecord", back_populates="portfolio", cascade="all, delete-orphan"
    )
    transactions: Mapped[List["TransactionRecord"]] = relationship(
        "TransactionRecord", back_populates="portfolio", cascade="all, delete-orphan"
    )
    daily_snapshots: Mapped[List["DailySnapshotRecord"]] = relationship(
        "DailySnapshotRecord", back_populates="portfolio", cascade="all, delete-orphan"
    )


class HoldingRecord(Base):
    """Relational table storing individual asset holdings within a portfolio."""

    __tablename__ = "holdings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    portfolio_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("portfolios.id", ondelete="CASCADE"), index=True
    )
    symbol: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    sector: Mapped[str] = mapped_column(String(64), default="Unknown")
    shares: Mapped[int] = mapped_column(Integer, default=0)
    buy_price: Mapped[float] = mapped_column(Float, default=0.0)
    current_price: Mapped[float] = mapped_column(Float, default=0.0)
    prev_close_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    invested_amount: Mapped[float] = mapped_column(Float, default=0.0)
    current_value: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_pnl_pct: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_1d: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_1d_pct: Mapped[float] = mapped_column(Float, default=0.0)
    weight: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[str] = mapped_column(String(32), default="")

    portfolio: Mapped["PortfolioRecord"] = relationship("PortfolioRecord", back_populates="holdings")


class TransactionRecord(Base):
    """Relational table storing ledger transactions (BUY, SELL, REBALANCE)."""

    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    portfolio_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("portfolios.id", ondelete="CASCADE"), index=True
    )
    symbol: Mapped[str] = mapped_column(String(32), nullable=False)
    action: Mapped[str] = mapped_column(String(16), nullable=False)  # BUY, SELL, DEPOSIT, WITHDRAW
    shares: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    fee: Mapped[float] = mapped_column(Float, default=0.0)
    timestamp: Mapped[str] = mapped_column(String(32), default="")
    notes: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    portfolio: Mapped["PortfolioRecord"] = relationship("PortfolioRecord", back_populates="transactions")


class DailySnapshotRecord(Base):
    """Relational table tracking historical daily mark-to-market snapshots."""

    __tablename__ = "daily_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    portfolio_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("portfolios.id", ondelete="CASCADE"), index=True
    )
    date: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    total_value: Mapped[float] = mapped_column(Float, default=0.0)
    invested_capital: Mapped[float] = mapped_column(Float, default=0.0)
    cash: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_1d: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_1d_pct: Mapped[float] = mapped_column(Float, default=0.0)
    total_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    total_pnl_pct: Mapped[float] = mapped_column(Float, default=0.0)
    benchmark_nifty_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    regime: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    portfolio: Mapped["PortfolioRecord"] = relationship("PortfolioRecord", back_populates="daily_snapshots")


class ReviewRecord(Base):
    """Relational table storing verified user reviews and fact-checking audit logs (Ticket #21)."""

    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    target_type: Mapped[str] = mapped_column(String(32), index=True)
    target_id: Mapped[str] = mapped_column(String(64), index=True)
    user_name: Mapped[str] = mapped_column(String(128), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    review_text: Mapped[str] = mapped_column(String(2048), nullable=False)
    claimed_return_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    claimed_duration: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    actual_return_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    return_discrepancy_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(32), index=True, default="APPROVED")
    verification_badge: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[str] = mapped_column(String(64), nullable=False)


class PortfolioRepository:
    """Relational persistence repository for QuantNiti Virtual Portfolios."""

    def __init__(self, database_url: Optional[str] = None):
        if not database_url:
            db_dir = Path(settings.data_dir)
            db_dir.mkdir(parents=True, exist_ok=True)
            db_path = db_dir / "quantniti.db"
            database_url = f"sqlite:///{db_path}"

        self.database_url = database_url
        self.engine = create_engine(
            self.database_url,
            connect_args={"check_same_thread": False} if "sqlite" in self.database_url else {},
        )

        # Enforce foreign key constraints on SQLite
        if "sqlite" in self.database_url:
            @event.listens_for(self.engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def get_table_names(self) -> List[str]:
        """Return list of existing database tables."""
        return inspect(self.engine).get_table_names()

    def save_portfolio(self, portfolio: PortfolioState) -> None:
        """Persist or update portfolio record, holdings, transactions, and daily snapshot."""
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        date_str = portfolio.as_of_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        with self.SessionLocal() as session:
            # Check if portfolio already exists
            record = session.get(PortfolioRecord, portfolio.portfolio_id)
            is_new = record is None

            if is_new:
                record = PortfolioRecord(
                    id=portfolio.portfolio_id,
                    name=portfolio.name,
                    initial_capital=portfolio.initial_capital,
                    cash=portfolio.cash,
                    invested_capital=portfolio.invested_capital,
                    current_value=portfolio.current_value,
                    total_pnl=portfolio.total_pnl,
                    total_pnl_pct=portfolio.total_pnl_pct,
                    pnl_1d=portfolio.pnl_1d,
                    pnl_1d_pct=portfolio.pnl_1d_pct,
                    initial_regime=getattr(portfolio.initial_regime, "value", str(portfolio.initial_regime)),
                    current_regime=getattr(portfolio.current_regime, "value", str(portfolio.current_regime)),
                    risk_persona=getattr(portfolio.risk_persona, "value", str(portfolio.risk_persona)),
                    horizon=portfolio.horizon,
                    benchmark_nifty_return=portfolio.benchmark_comparison.nifty_return_pct if portfolio.benchmark_comparison else None,
                    benchmark_fd_return=portfolio.benchmark_comparison.bank_fd_return_pct if portfolio.benchmark_comparison else None,
                    alpha_vs_nifty=portfolio.benchmark_comparison.alpha_vs_nifty if portfolio.benchmark_comparison else None,
                    alpha_vs_fd=portfolio.benchmark_comparison.alpha_vs_fd if portfolio.benchmark_comparison else None,
                    created_at=portfolio.created_at or now_str,
                    updated_at=now_str,
                    as_of_date=date_str,
                )
                session.add(record)
                session.flush()
            else:
                record.name = portfolio.name
                record.cash = portfolio.cash
                record.invested_capital = portfolio.invested_capital
                record.current_value = portfolio.current_value
                record.total_pnl = portfolio.total_pnl
                record.total_pnl_pct = portfolio.total_pnl_pct
                record.pnl_1d = portfolio.pnl_1d
                record.pnl_1d_pct = portfolio.pnl_1d_pct
                record.current_regime = getattr(portfolio.current_regime, "value", str(portfolio.current_regime))
                record.updated_at = now_str
                record.as_of_date = date_str
                if portfolio.benchmark_comparison:
                    record.benchmark_nifty_return = portfolio.benchmark_comparison.nifty_return_pct
                    record.benchmark_fd_return = portfolio.benchmark_comparison.bank_fd_return_pct
                    record.alpha_vs_nifty = portfolio.benchmark_comparison.alpha_vs_nifty
                    record.alpha_vs_fd = portfolio.benchmark_comparison.alpha_vs_fd

                # Remove existing holdings to replace with updated state
                session.query(HoldingRecord).filter_by(portfolio_id=portfolio.portfolio_id).delete()

            # Insert updated holdings
            for h in portfolio.holdings:
                h_rec = HoldingRecord(
                    portfolio_id=portfolio.portfolio_id,
                    symbol=h.symbol,
                    name=h.name,
                    sector=h.sector,
                    shares=h.shares,
                    buy_price=h.buy_price,
                    current_price=h.current_price,
                    prev_close_price=h.prev_close_price,
                    invested_amount=h.invested_amount,
                    current_value=h.current_value,
                    unrealized_pnl=h.unrealized_pnl,
                    unrealized_pnl_pct=h.unrealized_pnl_pct,
                    pnl_1d=h.pnl_1d,
                    pnl_1d_pct=h.pnl_1d_pct,
                    weight=h.weight,
                    updated_at=now_str,
                )
                session.add(h_rec)

            # Record initial BUY transactions for new portfolios
            if is_new:
                for h in portfolio.holdings:
                    if h.shares > 0:
                        tx = TransactionRecord(
                            id=f"tx_{uuid.uuid4().hex[:12]}",
                            portfolio_id=portfolio.portfolio_id,
                            symbol=h.symbol,
                            action="BUY",
                            shares=h.shares,
                            price=h.buy_price,
                            amount=h.invested_amount,
                            fee=0.0,
                            timestamp=now_str,
                            notes="Initial basket activation",
                        )
                        session.add(tx)

            # Capture Daily Snapshot
            existing_snap = (
                session.query(DailySnapshotRecord)
                .filter_by(portfolio_id=portfolio.portfolio_id, date=date_str)
                .first()
            )
            if existing_snap:
                existing_snap.total_value = portfolio.current_value
                existing_snap.invested_capital = portfolio.invested_capital
                existing_snap.cash = portfolio.cash
                existing_snap.pnl_1d = portfolio.pnl_1d
                existing_snap.pnl_1d_pct = portfolio.pnl_1d_pct
                existing_snap.total_pnl = portfolio.total_pnl
                existing_snap.total_pnl_pct = portfolio.total_pnl_pct
            else:
                snap = DailySnapshotRecord(
                    portfolio_id=portfolio.portfolio_id,
                    date=date_str,
                    total_value=portfolio.current_value,
                    invested_capital=portfolio.invested_capital,
                    cash=portfolio.cash,
                    pnl_1d=portfolio.pnl_1d,
                    pnl_1d_pct=portfolio.pnl_1d_pct,
                    total_pnl=portfolio.total_pnl,
                    total_pnl_pct=portfolio.total_pnl_pct,
                    regime=record.current_regime,
                )
                session.add(snap)

            session.commit()

    def get_portfolio(self, portfolio_id: str) -> Optional[PortfolioState]:
        """Fetch complete portfolio state by ID."""
        with self.SessionLocal() as session:
            record = session.get(PortfolioRecord, portfolio_id)
            if not record:
                return None

            holdings_recs = (
                session.query(HoldingRecord)
                .filter_by(portfolio_id=portfolio_id)
                .order_by(HoldingRecord.weight.desc())
                .all()
            )

            holdings = [
                PortfolioHolding(
                    symbol=h.symbol,
                    name=h.name,
                    sector=h.sector,
                    shares=h.shares,
                    buy_price=h.buy_price,
                    current_price=h.current_price,
                    prev_close_price=h.prev_close_price,
                    invested_amount=h.invested_amount,
                    current_value=h.current_value,
                    unrealized_pnl=h.unrealized_pnl,
                    unrealized_pnl_pct=h.unrealized_pnl_pct,
                    pnl_1d=h.pnl_1d,
                    pnl_1d_pct=h.pnl_1d_pct,
                    weight=h.weight,
                )
                for h in holdings_recs
            ]

            bench_comp = None
            if record.benchmark_nifty_return is not None:
                bench_comp = BenchmarkComparisonLive(
                    portfolio_return_pct=record.total_pnl_pct,
                    nifty_return_pct=record.benchmark_nifty_return or 0.0,
                    bank_fd_return_pct=record.benchmark_fd_return or 0.0,
                    alpha_vs_nifty=record.alpha_vs_nifty or 0.0,
                    alpha_vs_fd=record.alpha_vs_fd or 0.0,
                )

            # Match enum types safely
            reg_init = MarketRegimeType.LOW_VOLATILITY_BULL
            for r in MarketRegimeType:
                if r.value == record.initial_regime or r.name == record.initial_regime:
                    reg_init = r
                    break

            reg_curr = MarketRegimeType.LOW_VOLATILITY_BULL
            for r in MarketRegimeType:
                if r.value == record.current_regime or r.name == record.current_regime:
                    reg_curr = r
                    break

            persona = RiskPersona.BALANCED
            for p in RiskPersona:
                if p.value == record.risk_persona or p.name == record.risk_persona:
                    persona = p
                    break

            return PortfolioState(
                portfolio_id=record.id,
                name=record.name,
                initial_capital=record.initial_capital,
                cash=record.cash,
                invested_capital=record.invested_capital,
                current_value=record.current_value,
                total_pnl=record.total_pnl,
                total_pnl_pct=record.total_pnl_pct,
                pnl_1d=record.pnl_1d,
                pnl_1d_pct=record.pnl_1d_pct,
                holdings=holdings,
                benchmark_comparison=bench_comp,
                initial_regime=reg_init,
                current_regime=reg_curr,
                risk_persona=persona,
                horizon=record.horizon,
                created_at=record.created_at,
                as_of_date=record.as_of_date,
            )

    def list_portfolios(self) -> List[PortfolioState]:
        """List all active portfolios in the database."""
        with self.SessionLocal() as session:
            records = session.query(PortfolioRecord).order_by(PortfolioRecord.created_at.desc()).all()
            result = []
            for r in records:
                p = self.get_portfolio(r.id)
                if p:
                    result.append(p)
            return result

    def delete_portfolio(self, portfolio_id: str) -> bool:
        """Delete portfolio and all cascading child records."""
        with self.SessionLocal() as session:
            record = session.get(PortfolioRecord, portfolio_id)
            if not record:
                return False
            session.delete(record)
            session.commit()
            return True

    def record_transaction(
        self,
        portfolio_id: str,
        symbol: str,
        action: str,
        shares: int,
        price: float,
        amount: float,
        fee: float = 0.0,
        notes: Optional[str] = None,
    ) -> TransactionRecord:
        """Record an individual transaction entry in the ledger."""
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        with self.SessionLocal() as session:
            tx = TransactionRecord(
                id=f"tx_{uuid.uuid4().hex[:12]}",
                portfolio_id=portfolio_id,
                symbol=symbol,
                action=action,
                shares=shares,
                price=price,
                amount=amount,
                fee=fee,
                timestamp=now_str,
                notes=notes,
            )
            session.add(tx)
            session.commit()
            return tx

    def get_transactions(self, portfolio_id: str) -> List[Dict[str, Any]]:
        """Retrieve transaction history for a portfolio."""
        with self.SessionLocal() as session:
            txs = (
                session.query(TransactionRecord)
                .filter_by(portfolio_id=portfolio_id)
                .order_by(TransactionRecord.timestamp.asc())
                .all()
            )
            return [
                {
                    "id": t.id,
                    "symbol": t.symbol,
                    "action": t.action,
                    "shares": t.shares,
                    "price": t.price,
                    "amount": t.amount,
                    "fee": t.fee,
                    "timestamp": t.timestamp,
                    "notes": t.notes,
                }
                for t in txs
            ]

    def get_daily_snapshots(self, portfolio_id: str) -> List[Dict[str, Any]]:
        """Retrieve daily MTM snapshots for a portfolio."""
        with self.SessionLocal() as session:
            snaps = (
                session.query(DailySnapshotRecord)
                .filter_by(portfolio_id=portfolio_id)
                .order_by(DailySnapshotRecord.date.asc())
                .all()
            )
            return [
                {
                    "id": s.id,
                    "date": s.date,
                    "total_value": s.total_value,
                    "invested_capital": s.invested_capital,
                    "cash": s.cash,
                    "pnl_1d": s.pnl_1d,
                    "pnl_1d_pct": s.pnl_1d_pct,
                    "total_pnl": s.total_pnl,
                    "total_pnl_pct": s.total_pnl_pct,
                }
                for s in snaps
            ]
