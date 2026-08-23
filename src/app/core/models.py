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
