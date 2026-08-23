"""Market Data REST API Routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from app.core.models import (
    MarketHistoryResponse,
    OHLCVBar,
    ReturnsMatrixResponse,
    StockQuote,
    SyncResult,
    UniverseStock,
)
from app.data.service import MarketDataService
from app.universe import is_valid_symbol, normalize_symbol, _SYMBOL_MAP

router = APIRouter(prefix="/market", tags=["Market Data"])


def get_market_service(request: Request) -> MarketDataService:
    """Dependency provider for MarketDataService attached to application state."""
    return request.app.state.market_service


class SyncRequest(BaseModel):
    symbols: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.get("/universe", response_model=List[UniverseStock])
def get_universe(
    include_benchmarks: bool = Query(True, description="Include ^NSEI and ^INDIAVIX"),
    sector: Optional[str] = Query(None, description="Filter universe by sector name"),
    service: MarketDataService = Depends(get_market_service),
):
    """Retrieve NIFTY 50 universe constituents and benchmarks."""
    stocks = service.get_universe(include_benchmarks=include_benchmarks)
    if sector:
        stocks = [s for s in stocks if s.sector.lower() == sector.strip().lower()]
    return stocks


@router.get("/history", response_model=MarketHistoryResponse)
def get_history(
    symbol: str = Query(..., description="Stock symbol (e.g. RELIANCE, TCS, ^NSEI)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    force_refresh: bool = Query(False, description="Bypass local cache and re-fetch"),
    service: MarketDataService = Depends(get_market_service),
):
    """Retrieve historical daily OHLCV bars and returns for a symbol."""
    canonical = normalize_symbol(symbol)
    if not is_valid_symbol(canonical):
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found in NIFTY 50 universe")

    df = service.get_history(canonical, start_date=start_date, end_date=end_date, force_refresh=force_refresh)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No price history found for '{symbol}'")

    meta = _SYMBOL_MAP.get(canonical, {"name": canonical, "sector": "Unknown"})

    bars: List[OHLCVBar] = []
    for dt, row in df.iterrows():
        date_str = dt.strftime("%Y-%m-%d") if hasattr(dt, "strftime") else str(dt)[:10]
        bars.append(
            OHLCVBar(
                date=date_str,
                open=round(float(row["open"]), 2),
                high=round(float(row["high"]), 2),
                low=round(float(row["low"]), 2),
                close=round(float(row["close"]), 2),
                adj_close=round(float(row["adj_close"]), 2),
                volume=float(row["volume"]),
                return_pct=round(float(row["daily_return"]), 5) if "daily_return" in row else None,
                log_return=round(float(row["log_return"]), 5) if "log_return" in row else None,
                cumulative_return=round(float(row["cumulative_return"]), 5) if "cumulative_return" in row else None,
            )
        )

    start_str = bars[0].date if bars else (start_date or "")
    end_str = bars[-1].date if bars else (end_date or "")

    return MarketHistoryResponse(
        symbol=canonical,
        name=meta.get("name", canonical),
        sector=meta.get("sector", "Unknown"),
        count=len(bars),
        start_date=start_str,
        end_date=end_str,
        data=bars,
    )


@router.get("/quote/{symbol}", response_model=StockQuote)
def get_quote(
    symbol: str,
    service: MarketDataService = Depends(get_market_service),
):
    """Retrieve real-time/latest quote and day statistics."""
    canonical = normalize_symbol(symbol)
    if not is_valid_symbol(canonical):
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found in NIFTY 50 universe")

    try:
        return service.get_latest_quote(canonical)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote for '{symbol}': {str(e)}")


@router.get("/returns", response_model=ReturnsMatrixResponse)
def get_returns_matrix(
    symbols: str = Query(..., description="Comma-separated list of symbols (e.g. RELIANCE,TCS,INFY)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    service: MarketDataService = Depends(get_market_service),
):
    """Retrieve aligned daily returns matrix for multiple assets."""
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        raise HTTPException(status_code=400, detail="Must provide at least one valid symbol")

    aligned_df = service.get_aligned_dataset(symbol_list, start_date=start_date, end_date=end_date, field="adj_close")
    if aligned_df.empty:
        raise HTTPException(status_code=404, detail="No aligned data found for specified symbols and range")

    # Compute daily return on aligned prices
    returns_df = aligned_df.pct_change().fillna(0.0)

    dates = [
        dt.strftime("%Y-%m-%d") if hasattr(dt, "strftime") else str(dt)[:10]
        for dt in returns_df.index
    ]
    returns_dict = {
        col: [round(float(val), 5) for val in returns_df[col].tolist()]
        for col in returns_df.columns
    }

    start_str = dates[0] if dates else (start_date or "")
    end_str = dates[-1] if dates else (end_date or "")

    return ReturnsMatrixResponse(
        symbols=list(returns_df.columns),
        start_date=start_str,
        end_date=end_str,
        dates=dates,
        returns=returns_dict,
    )


@router.post("/sync", response_model=SyncResult)
def sync_universe(
    payload: Optional[SyncRequest] = None,
    service: MarketDataService = Depends(get_market_service),
):
    """Trigger ingestion and caching for universe stocks."""
    syms = payload.symbols if payload and payload.symbols else None
    start = payload.start_date if payload else None
    end = payload.end_date if payload else None

    return service.sync_universe(symbols=syms, start_date=start, end_date=end)
