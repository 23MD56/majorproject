"""Pydantic data models and schemas for QuantNiti."""

from datetime import datetime
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
