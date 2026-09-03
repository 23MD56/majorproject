"""PortfolioService domain orchestrator for Virtual Paper Portfolio management."""

from typing import Any, Dict, List, Optional

from app.core.models import (
    BrokerOrderSheet,
    CreatePortfolioRequest,
    MarketRegimeType,
    PortfolioState,
    RebalanceAlert,
    RiskPersona,
)
from app.data.service import MarketDataService
from app.data.storage import PortfolioRepository
from app.ml.portfolio.service import GrowService
from app.ml.regime.service import RegimeService
from app.ml.simulation.portfolio import (
    create_portfolio_from_allocations,
    update_portfolio_mark_to_market,
)
from app.ml.simulation.rebalance import (
    compute_rebalance_diff,
    execute_rebalance,
    generate_broker_order_sheet,
)


class PortfolioService:
    """Core domain service for Virtual Paper Portfolio tracking and rebalancing."""

    def __init__(
        self,
        market_service: MarketDataService,
        regime_service: Optional[RegimeService] = None,
        grow_service: Optional[GrowService] = None,
        repository: Optional[PortfolioRepository] = None,
    ):
        self.market_service = market_service
        self.regime_service = regime_service or RegimeService(market_service=market_service)
        self.grow_service = grow_service or GrowService(
            market_service=market_service, regime_service=self.regime_service
        )
        self.repository = repository or PortfolioRepository()
        self._portfolios: Dict[str, PortfolioState] = {}

    def create_portfolio(self, request: CreatePortfolioRequest) -> PortfolioState:
        """Create a new virtual portfolio from a basket recommendation or custom allocations."""
        if request.custom_allocations:
            allocations = request.custom_allocations
            regime_info = self.regime_service.get_current_regime()
            active_regime = regime_info.regime
        else:
            rec = self.grow_service.recommend_basket(
                capital=request.capital,
                horizon=request.horizon,
                risk_persona=request.risk_persona,
            )
            active_regime = rec.active_regime
            allocations = [
                {
                    "symbol": item.symbol,
                    "name": item.name,
                    "sector": item.sector,
                    "weight": item.weight,
                    "price": item.current_price,
                    "shares": item.shares_approx,
                }
                for item in rec.allocations
            ]

        portfolio = create_portfolio_from_allocations(
            name=request.name,
            capital=request.capital,
            allocations=allocations,
            risk_persona=request.risk_persona,
            horizon=request.horizon,
            active_regime=active_regime,
        )

        self.repository.save_portfolio(portfolio)
        self._portfolios[portfolio.portfolio_id] = portfolio
        return portfolio

    def get_portfolio(self, portfolio_id: str) -> PortfolioState:
        """Retrieve portfolio and refresh mark-to-market valuations."""
        portfolio = self._portfolios.get(portfolio_id)
        if not portfolio:
            portfolio = self.repository.get_portfolio(portfolio_id)
            if not portfolio:
                raise KeyError(f"Portfolio '{portfolio_id}' not found.")

        # Fetch latest prices and previous close prices for all holdings
        latest_prices: Dict[str, float] = {}
        prev_prices: Dict[str, float] = {}
        for h in portfolio.holdings:
            try:
                q = self.market_service.get_latest_quote(h.symbol)
                latest_prices[h.symbol] = q.current_price
                prev_prices[h.symbol] = (
                    q.previous_close
                    if q.previous_close is not None
                    else (q.current_price - q.day_change)
                )
            except Exception:
                latest_prices[h.symbol] = h.current_price
                prev_prices[h.symbol] = (
                    h.prev_close_price
                    if h.prev_close_price is not None
                    else h.current_price
                )

        # Fetch benchmark index quotes
        nifty_curr_price = None
        nifty_init_price = None
        try:
            nifty_quote = self.market_service.get_latest_quote("^NSEI")
            nifty_curr_price = nifty_quote.current_price
            nifty_hist = self.market_service.get_history("^NSEI")
            if not nifty_hist.empty:
                nifty_init_price = float(nifty_hist["close"].iloc[-30])
        except Exception:
            pass

        current_regime = self.regime_service.get_current_regime().regime

        updated = update_portfolio_mark_to_market(
            portfolio=portfolio,
            latest_prices=latest_prices,
            previous_close_prices=prev_prices,
            benchmark_index_price=nifty_curr_price,
            benchmark_initial_price=nifty_init_price,
            elapsed_days=30,
            current_regime=current_regime,
        )

        self.repository.save_portfolio(updated)
        self._portfolios[portfolio_id] = updated
        return updated

    def get_rebalance_diff(self, portfolio_id: str) -> RebalanceAlert:
        """Evaluate and return regime-shift rebalance recommendations."""
        portfolio = self.get_portfolio(portfolio_id)
        active_regime = self.regime_service.get_current_regime().regime

        # Synthesize target basket for the current regime and current portfolio value
        rec = self.grow_service.recommend_basket(
            capital=portfolio.current_value,
            horizon=portfolio.horizon,
            risk_persona=portfolio.risk_persona,
        )

        target_allocations = [
            {
                "symbol": item.symbol,
                "name": item.name,
                "sector": item.sector,
                "weight": item.weight,
                "price": item.current_price,
            }
            for item in rec.allocations
        ]

        latest_prices: Dict[str, float] = {}
        for item in rec.allocations:
            latest_prices[item.symbol] = item.current_price
        for h in portfolio.holdings:
            if h.symbol not in latest_prices:
                latest_prices[h.symbol] = h.current_price

        return compute_rebalance_diff(
            portfolio=portfolio,
            target_allocations=target_allocations,
            current_regime=active_regime,
            latest_prices=latest_prices,
        )

    def apply_rebalance(self, portfolio_id: str) -> PortfolioState:
        """Apply recommended rebalance and update portfolio state."""
        diff_alert = self.get_rebalance_diff(portfolio_id)
        portfolio = self.get_portfolio(portfolio_id)

        rebalanced = execute_rebalance(portfolio=portfolio, rebalance_alert=diff_alert)
        self.repository.save_portfolio(rebalanced)
        self._portfolios[portfolio_id] = rebalanced
        return rebalanced

    def get_order_sheet(self, portfolio_id: str) -> BrokerOrderSheet:
        """Export 1-click broker order sheet."""
        portfolio = self.get_portfolio(portfolio_id)
        return generate_broker_order_sheet(portfolio=portfolio)

    def list_portfolios(self) -> List[PortfolioState]:
        """List all active simulated portfolios from persistent repository."""
        ports = self.repository.list_portfolios()
        if not ports and self._portfolios:
            for p in self._portfolios.values():
                self.repository.save_portfolio(p)
            ports = self.repository.list_portfolios()
        return ports

    def delete_portfolio(self, portfolio_id: str) -> bool:
        """Delete portfolio from persistent repository and in-memory cache."""
        self._portfolios.pop(portfolio_id, None)
        return self.repository.delete_portfolio(portfolio_id)
