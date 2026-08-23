"""Pydantic data models and schemas for QuantNiti."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class UniverseStock(BaseModel):
    symbol: str
    name: str
    sector: str
    is_benchmark: bool = False


class OHLCVBar(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: float
    return_pct: Optional[float] = None
    log_return: Optional[float] = None
    cumulative_return: Optional[float] = None


class StockQuote(BaseModel):
    symbol: str
    name: str
    sector: str
    current_price: float
    day_change: float
    day_change_pct: float
    day_high: float
    day_low: float
    volume: float
    timestamp: str
    previous_close: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None


class MarketHistoryResponse(BaseModel):
    symbol: str
    name: str
    sector: str
    count: int
    start_date: str
    end_date: str
    data: List[OHLCVBar]


class ReturnsMatrixResponse(BaseModel):
    symbols: List[str]
    start_date: str
    end_date: str
    dates: List[str]
    returns: Dict[str, List[float]]


class SyncResult(BaseModel):
    total_symbols: int
    successful_symbols: int
    failed_symbols: List[str] = Field(default_factory=list)
    cache_path: str
    synced_at: str


# ==========================================
# Market Regime Models (Ticket 02)
# ==========================================

class MarketRegimeType(str, Enum):
    LOW_VOLATILITY_BULL = "Low-Volatility Bull"
    HIGH_VOLATILITY_BEAR = "High-Volatility Bear"
    SIDEWAYS_CONSOLIDATION = "Sideways Consolidation"


class RegimeProbabilities(BaseModel):
    bull: float = Field(..., ge=0.0, le=1.0)
    bear: float = Field(..., ge=0.0, le=1.0)
    sideways: float = Field(..., ge=0.0, le=1.0)


class CurrentRegimeResponse(BaseModel):
    regime: MarketRegimeType
    regime_id: int
    probabilities: RegimeProbabilities
    confidence: float
    metrics: Dict[str, float]
    description: str
    recommended_strategy: str
    as_of_date: str


class RegimeHistoricalPoint(BaseModel):
    date: str
    regime: MarketRegimeType
    regime_id: int
    probabilities: RegimeProbabilities
    close_price: float
    realized_volatility: float


class RegimeHistoryResponse(BaseModel):
    start_date: str
    end_date: str
    count: int
    regime_distribution: Dict[str, float]
    data: List[RegimeHistoricalPoint]


class RegimeTrainResponse(BaseModel):
    samples_trained: int
    start_date: str
    end_date: str
    trained_at: str
    converged: bool


# ==========================================
# Probabilistic Growth Forecaster Models (Ticket 03)
# ==========================================

class HorizonForecastCone(BaseModel):
    horizon: str  # "1M", "3M", "6M", "12M"
    days: int
    pessimistic_pct: float  # 10th percentile
    base_pct: float         # 50th percentile
    optimistic_pct: float   # 90th percentile
    pessimistic_price: float
    base_price: float
    optimistic_price: float


class MultiHorizonGrowthForecast(BaseModel):
    symbol: str
    current_price: float
    as_of_date: str
    m1: HorizonForecastCone
    m3: HorizonForecastCone
    m6: HorizonForecastCone
    m12: HorizonForecastCone


class StockFactorSnapshot(BaseModel):
    rsi_14: float
    macd: float
    macd_hist: float
    bollinger_pct_b: float
    ema_20_50_spread: float
    ema_50_200_spread: float
    momentum_1m: float
    momentum_3m: float
    momentum_6m: float
    momentum_12m: float
    realized_vol_30d: float
    realized_vol_90d: float
    max_drawdown_1y: float
    beta: float
    alpha_annualized: float
    market_correlation: float


class RegimeSuitability(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0)
    badge: str
    primary_regime: MarketRegimeType
    description: str


class BenchmarkComparison(BaseModel):
    stock_3y_return: float
    benchmark_3y_return: float
    alpha: float
    beta: float
    correlation: float


class StockPeerSummary(BaseModel):
    symbol: str
    name: str
    sector: str
    current_price: float
    day_change_pct: float
    base_growth_6m: float


class StockIntelligenceProfile(BaseModel):
    symbol: str
    name: str
    sector: str
    current_price: float
    day_change: float
    day_change_pct: float
    day_high: float
    day_low: float
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    volume: float
    as_of_date: str
    forecast: MultiHorizonGrowthForecast
    suitability: RegimeSuitability
    factors: StockFactorSnapshot
    benchmark_comparison: BenchmarkComparison
    peers: List[StockPeerSummary]


class ExploreStockSummary(BaseModel):
    symbol: str
    name: str
    sector: str
    current_price: float
    day_change: float
    day_change_pct: float
    growth_6m_base_pct: float
    growth_6m_optimistic_pct: float
    growth_6m_pessimistic_pct: float
    regime_suitability_score: float
    regime_badge: str
    volume: float


# ==========================================
# AI Portfolio Basket & Trust Card Models (Ticket 04)
# ==========================================

class RiskPersona(str, Enum):
    CONSERVATIVE = "Conservative"
    BALANCED = "Balanced"
    AGGRESSIVE = "Aggressive"


class BasketAllocationItem(BaseModel):
    symbol: str
    name: str
    sector: str
    weight: float = Field(..., ge=0.0, le=1.0)
    target_amount: float
    shares_approx: int
    current_price: float
    growth_base_pct: float
    regime_suitability_score: float


class RupeeGrowthTier(BaseModel):
    tier: str  # "Optimistic (90th)", "Base Case (50th)", "Pessimistic (10th)"
    expected_return_pct: float
    projected_value: float
    projected_gain_rupees: float


class BasketGrowthProjections(BaseModel):
    capital: float
    horizon: str  # "1M", "3M", "6M", "12M"
    optimistic: RupeeGrowthTier
    base: RupeeGrowthTier
    pessimistic: RupeeGrowthTier
    max_stress_drawdown_pct: float
    max_stress_drawdown_rupees: float


class TrustCardPillarRegime(BaseModel):
    regime: MarketRegimeType
    confidence: float
    summary: str


class TrustCardPillarReliability(BaseModel):
    backtested_hit_rate_pct: float
    lookback_years: int
    summary: str


class TrustCardPillarDrawdown(BaseModel):
    max_drawdown_limit_pct: float
    stress_loss_rupees: float
    summary: str


class TrustCardPillarSavings(BaseModel):
    commission_fee_pct: float
    traditional_fee_pct: float
    estimated_annual_savings_rupees: float
    summary: str


class TrustCardPillars(BaseModel):
    regime_context: TrustCardPillarRegime
    model_reliability: TrustCardPillarReliability
    drawdown_guardrail: TrustCardPillarDrawdown
    disintermediation_savings: TrustCardPillarSavings


class BenchmarkComparisonItem(BaseModel):
    name: str  # "AI Optimized Basket", "NIFTY 50 Benchmark", "7% Bank Fixed Deposit"
    projected_return_pct: float
    projected_value: float
    projected_gain_rupees: float
    drawdown_risk_label: str
    summary: str


class BasketRecommendationRequest(BaseModel):
    capital: float = Field(default=50000.0, ge=1000.0, le=10000000.0)
    horizon: str = Field(default="6M", pattern="^(1M|3M|6M|12M)$")
    risk_persona: RiskPersona = Field(default=RiskPersona.BALANCED)


class BasketRecommendationResponse(BaseModel):
    basket_id: str
    capital: float
    horizon: str
    risk_persona: RiskPersona
    active_regime: MarketRegimeType
    created_at: str
    allocations: List[BasketAllocationItem]
    growth_projections: BasketGrowthProjections
    trust_card: TrustCardPillars
    benchmark_comparisons: List[BenchmarkComparisonItem]


# ==========================================
# Quant Lab Strategy Backtesting Models (Ticket 05)
# ==========================================

class StrategyType(str, Enum):
    BUY_AND_HOLD = "Buy & Hold"
    MA_CROSSOVER = "Moving Average Crossover"
    RSI_MEAN_REVERSION = "RSI Mean Reversion"
    BOLLINGER_BANDS = "Bollinger Band Breakout"
    DUAL_MOMENTUM = "Dual Momentum"


class BacktestTrade(BaseModel):
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    shares: float
    return_pct: float
    pnl: float
    bars_held: int
    trade_type: str = "LONG"


class BacktestDataPoint(BaseModel):
    date: str
    close_price: float
    signal: float
    strategy_equity: float
    benchmark_equity: float
    drawdown_pct: float
    regime: Optional[MarketRegimeType] = None


class BacktestMetrics(BaseModel):
    initial_capital: float
    final_equity: float
    total_return_pct: float
    cagr: float
    annualized_volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown_pct: float
    calmar_ratio: float
    win_rate_pct: float
    profit_factor: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    avg_trade_return_pct: float
    benchmark_total_return_pct: float
    benchmark_cagr: float
    benchmark_max_drawdown_pct: float
    alpha: float
    beta: float


class RegimePerformanceBreakdown(BaseModel):
    regime: MarketRegimeType
    days_count: int
    strategy_return_pct: float
    benchmark_return_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    win_rate_pct: float


class BacktestRequest(BaseModel):
    symbol: str = Field(default="^NSEI", description="NSE Symbol or Index")
    strategy: StrategyType = Field(default=StrategyType.BUY_AND_HOLD)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    initial_capital: float = Field(default=100000.0, ge=1000.0, le=100000000.0)
    cost_bps: float = Field(default=5.0, ge=0.0, le=100.0, description="Transaction fee in basis points")
    slippage_bps: float = Field(default=5.0, ge=0.0, le=100.0, description="Slippage in basis points")
    parameters: Optional[Dict[str, Any]] = None


class BacktestResponse(BaseModel):
    backtest_id: str
    symbol: str
    name: str
    strategy: StrategyType
    start_date: str
    end_date: str
    initial_capital: float
    metrics: BacktestMetrics
    equity_curve: List[BacktestDataPoint]
    trades: List[BacktestTrade]
    regime_breakdown: List[RegimePerformanceBreakdown]
    parameters_used: Dict[str, Any]


# ==========================================
# Virtual Portfolio & Rebalance Models (Ticket 06)
# ==========================================

class PortfolioHolding(BaseModel):
    symbol: str
    name: str
    sector: str
    shares: int
    buy_price: float
    current_price: float
    invested_amount: float
    current_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    weight: float


class BenchmarkComparisonLive(BaseModel):
    portfolio_return_pct: float
    nifty_return_pct: float
    bank_fd_return_pct: float
    alpha_vs_nifty: float
    alpha_vs_fd: float


class PortfolioState(BaseModel):
    portfolio_id: str
    name: str
    initial_capital: float
    cash: float
    invested_capital: float
    current_value: float
    total_pnl: float
    total_pnl_pct: float
    holdings: List[PortfolioHolding]
    benchmark_comparison: Optional[BenchmarkComparisonLive] = None
    initial_regime: MarketRegimeType
    current_regime: MarketRegimeType
    risk_persona: RiskPersona
    horizon: str
    created_at: str
    as_of_date: str


class RebalanceItemDiff(BaseModel):
    symbol: str
    name: str
    sector: str
    current_weight: float
    target_weight: float
    weight_diff: float
    current_shares: int
    target_shares: int
    shares_diff: int
    action: str  # "BUY", "SELL", "HOLD"
    current_price: float
    estimated_amount: float
    rationale: str


class RebalanceAlert(BaseModel):
    portfolio_id: str
    is_rebalance_recommended: bool
    previous_regime: MarketRegimeType
    new_regime: MarketRegimeType
    trigger_reason: str
    summary: str
    items: List[RebalanceItemDiff]


class BrokerOrderItem(BaseModel):
    symbol: str
    exchange: str = "NSE"
    action: str  # "BUY", "SELL"
    quantity: int
    price: float
    order_type: str = "MARKET"
    product_type: str = "CNC"
    estimated_total: float


class BrokerOrderSheet(BaseModel):
    portfolio_id: str
    total_orders: int
    total_estimated_amount: float
    orders: List[BrokerOrderItem]
    zerodha_csv_text: str
    groww_clipboard_text: str
    generated_at: str


class CreatePortfolioRequest(BaseModel):
    name: str = Field(default="My AI Portfolio", min_length=1)
    capital: float = Field(default=50000.0, ge=1000.0, le=100000000.0)
    basket_id: Optional[str] = None
    horizon: str = Field(default="6M", pattern="^(1M|3M|6M|12M)$")
    risk_persona: RiskPersona = Field(default=RiskPersona.BALANCED)
    custom_allocations: Optional[List[Dict[str, Any]]] = None



