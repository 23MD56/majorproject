"""Market tick streaming and synthetic generation engine."""

import asyncio
import json
import random
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.core.models import MarketTick
from app.data.service import MarketDataService
from app.universe import get_universe_symbols, normalize_symbol


# Default baseline prices for key assets if offline or cache uninitialized
_BASELINE_PRICES: Dict[str, float] = {
    "^NSEI": 24850.30,
    "^INDIAVIX": 13.45,
    "RELIANCE": 2980.50,
    "TCS": 4180.20,
    "HDFCBANK": 1640.75,
    "INFY": 1865.40,
    "ICICIBANK": 1210.30,
    "BHARTIARTL": 1425.60,
    "SBIN": 820.10,
    "ITC": 495.25,
    "LT": 3650.00,
    "HINDUNILVR": 2680.90,
    "GOLDBEES": 62.40,
    "SILVERBEES": 85.10,
    "NIFTYBEES": 265.80,
}


class MarketTickGenerator:
    """Generates continuous market price ticks with synthetic brownian motion or live broker fallback."""

    def __init__(
        self,
        market_service: Optional[MarketDataService] = None,
        mode: str = "synthetic",  # "synthetic" or "live"
    ):
        self.market_service = market_service
        self.mode = mode
        self._current_prices: Dict[str, float] = {}
        self._prev_closes: Dict[str, float] = {}
        self._highs: Dict[str, float] = {}
        self._lows: Dict[str, float] = {}
        self._volumes: Dict[str, float] = {}
        self._seed_data()

    def _seed_data(self) -> None:
        """Seed initial price, high, low, and volume states."""
        for sym, price in _BASELINE_PRICES.items():
            self._init_symbol_state(sym, price)

    def _init_symbol_state(self, symbol: str, base_price: float) -> None:
        prev_close = round(base_price * (1.0 - random.uniform(-0.01, 0.01)), 2)
        self._current_prices[symbol] = round(base_price, 2)
        self._prev_closes[symbol] = prev_close
        self._highs[symbol] = round(max(base_price, prev_close) * 1.005, 2)
        self._lows[symbol] = round(min(base_price, prev_close) * 0.995, 2)
        self._volumes[symbol] = float(random.randint(10000, 500000))

    def _get_base_price(self, symbol: str) -> float:
        """Retrieve initial price from service or baseline defaults."""
        canonical = normalize_symbol(symbol)
        if canonical in self._current_prices:
            return self._current_prices[canonical]

        if self.market_service:
            try:
                quote = self.market_service.get_latest_quote(canonical)
                if quote and quote.current_price > 0:
                    self._init_symbol_state(canonical, quote.current_price)
                    if quote.previous_close:
                        self._prev_closes[canonical] = quote.previous_close
                    if quote.day_high:
                        self._highs[canonical] = quote.day_high
                    if quote.day_low:
                        self._lows[canonical] = quote.day_low
                    if quote.volume:
                        self._volumes[canonical] = quote.volume
                    return quote.current_price
            except Exception:
                pass

        default_p = _BASELINE_PRICES.get(canonical, 1000.0)
        self._init_symbol_state(canonical, default_p)
        return default_p

    def generate_tick(self, symbol: str) -> MarketTick:
        """Generate a single real-time or synthetic tick for a given symbol."""
        canonical = normalize_symbol(symbol)

        # 1. Attempt live broker quote if in live mode
        if self.mode == "live" and self.market_service:
            try:
                quote = self.market_service.get_latest_quote(canonical)
                if quote and quote.current_price > 0:
                    self._current_prices[canonical] = quote.current_price
                    return MarketTick(
                        symbol=canonical,
                        price=quote.current_price,
                        change=quote.day_change,
                        change_pct=quote.day_change_pct,
                        high=quote.day_high,
                        low=quote.day_low,
                        volume=quote.volume,
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        previous_close=quote.previous_close,
                    )
            except Exception:
                # Fall through to synthetic generation on broker network failure or off-market
                pass

        # 2. Synthetic tick generation via micro-Brownian step
        curr_price = self._current_prices.get(canonical) or self._get_base_price(canonical)
        prev_close = self._prev_closes.get(canonical, curr_price)

        # Micro-step bounded to +-0.25%
        step_pct = random.gauss(0.0, 0.0012)
        step_pct = max(-0.0035, min(0.0035, step_pct))

        new_price = round(curr_price * (1.0 + step_pct), 2)
        if new_price <= 0.01:
            new_price = curr_price

        self._current_prices[canonical] = new_price

        # Update high, low, volume
        curr_high = max(self._highs.get(canonical, new_price), new_price)
        curr_low = min(self._lows.get(canonical, new_price), new_price)
        self._highs[canonical] = curr_high
        self._lows[canonical] = curr_low

        added_vol = float(random.randint(5, 250))
        new_vol = self._volumes.get(canonical, 10000.0) + added_vol
        self._volumes[canonical] = new_vol

        change = round(new_price - prev_close, 2)
        change_pct = round((change / prev_close) * 100.0, 2) if prev_close > 0 else 0.0

        return MarketTick(
            symbol=canonical,
            price=new_price,
            change=change,
            change_pct=change_pct,
            high=curr_high,
            low=curr_low,
            volume=new_vol,
            timestamp=datetime.now(timezone.utc).isoformat(),
            previous_close=prev_close,
        )

    def generate_batch(self, symbols: Optional[List[str]] = None) -> List[MarketTick]:
        """Generate ticks for a list of symbols (or top universe symbols by default)."""
        target_symbols = symbols or ["^NSEI", "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "GOLDBEES"]
        return [self.generate_tick(sym) for sym in target_symbols]

    @staticmethod
    def format_sse_event(event: str, data: Any) -> str:
        """Format an SSE frame conforming to the W3C EventSource standard."""
        serialized = json.dumps(data) if not isinstance(data, str) else data
        return f"event: {event}\ndata: {serialized}\n\n"

    async def stream_ticks(
        self,
        symbols: Optional[List[str]] = None,
        interval_seconds: float = 3.0,
        ping_interval_seconds: float = 15.0,
        max_ticks: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Async generator yielding SSE formatted chunks with ticks and periodic pings."""
        last_ping = datetime.now(timezone.utc).timestamp()
        target_symbols = symbols or ["^NSEI", "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "GOLDBEES"]
        ticks_yielded = 0

        while True:
            # Broadcast ticks
            for sym in target_symbols:
                tick = self.generate_tick(sym)
                yield self.format_sse_event("tick", tick.model_dump())
                ticks_yielded += 1
                if max_ticks is not None and ticks_yielded >= max_ticks:
                    return

            # Broadcast heartbeat ping
            now = datetime.now(timezone.utc).timestamp()
            if now - last_ping >= ping_interval_seconds:
                yield self.format_sse_event("ping", {"timestamp": datetime.now(timezone.utc).isoformat()})
                last_ping = now

            await asyncio.sleep(interval_seconds)
