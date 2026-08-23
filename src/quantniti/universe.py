"""NIFTY 50 Universe and Constituent Definitions for QuantNiti.

Provides canonical list of NIFTY 50 constituents, sector mapping, benchmark
indices, and normalization helpers across data providers (e.g. Yahoo Finance .NS suffix).
"""

from typing import Any, Dict, List, Optional, Set

# Benchmark indices tracked by QuantNiti
BENCHMARK_SYMBOLS: Set[str] = {
    "^NSEI",      # NIFTY 50 Index (Benchmark)
    "^INDIAVIX",  # India Volatility Index (Regime Detection)
}

BENCHMARK_METADATA: List[Dict[str, Any]] = [
    {
        "symbol": "^NSEI",
        "name": "NIFTY 50 Index",
        "sector": "Benchmark Index",
        "is_benchmark": True,
    },
    {
        "symbol": "^INDIAVIX",
        "name": "India Volatility Index",
        "sector": "Volatility Index",
        "is_benchmark": True,
    },
]

# Canonical NIFTY 50 constituents list (50 large-cap Indian companies)
NIFTY50_CONSTITUENTS: List[Dict[str, Any]] = [
    {"symbol": "ADANIENT", "name": "Adani Enterprises Ltd.", "sector": "Metals & Mining"},
    {"symbol": "ADANIPORTS", "name": "Adani Ports and Special Economic Zone Ltd.", "sector": "Services & Logistics"},
    {"symbol": "APOLLOHOSP", "name": "Apollo Hospitals Enterprise Ltd.", "sector": "Healthcare"},
    {"symbol": "ASIANPAINT", "name": "Asian Paints Ltd.", "sector": "Consumer Goods"},
    {"symbol": "AXISBANK", "name": "Axis Bank Ltd.", "sector": "Financial Services"},
    {"symbol": "BAJAJ-AUTO", "name": "Bajaj Auto Ltd.", "sector": "Automobile"},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance Ltd.", "sector": "Financial Services"},
    {"symbol": "BAJAJFINSV", "name": "Bajaj Finserv Ltd.", "sector": "Financial Services"},
    {"symbol": "BEL", "name": "Bharat Electronics Ltd.", "sector": "Capital Goods"},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd.", "sector": "Telecommunication"},
    {"symbol": "BPCL", "name": "Bharat Petroleum Corporation Ltd.", "sector": "Energy & Oil"},
    {"symbol": "BRITANNIA", "name": "Britannia Industries Ltd.", "sector": "Consumer Goods"},
    {"symbol": "CIPLA", "name": "Cipla Ltd.", "sector": "Healthcare"},
    {"symbol": "COALINDIA", "name": "Coal India Ltd.", "sector": "Energy & Mining"},
    {"symbol": "DRREDDY", "name": "Dr. Reddy's Laboratories Ltd.", "sector": "Healthcare"},
    {"symbol": "EICHERMOT", "name": "Eicher Motors Ltd.", "sector": "Automobile"},
    {"symbol": "GRASIM", "name": "Grasim Industries Ltd.", "sector": "Materials & Chemicals"},
    {"symbol": "HCLTECH", "name": "HCL Technologies Ltd.", "sector": "Information Technology"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd.", "sector": "Financial Services"},
    {"symbol": "HDFCLIFE", "name": "HDFC Life Insurance Company Ltd.", "sector": "Financial Services"},
    {"symbol": "HEROMOTOCO", "name": "Hero MotoCorp Ltd.", "sector": "Automobile"},
    {"symbol": "HINDALCO", "name": "Hindalco Industries Ltd.", "sector": "Metals & Mining"},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd.", "sector": "Consumer Goods"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd.", "sector": "Financial Services"},
    {"symbol": "INDUSINDBK", "name": "IndusInd Bank Ltd.", "sector": "Financial Services"},
    {"symbol": "INFY", "name": "Infosys Ltd.", "sector": "Information Technology"},
    {"symbol": "ITC", "name": "ITC Ltd.", "sector": "Consumer Goods"},
    {"symbol": "JSWSTEEL", "name": "JSW Steel Ltd.", "sector": "Metals & Mining"},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank Ltd.", "sector": "Financial Services"},
    {"symbol": "LT", "name": "Larsen & Toubro Ltd.", "sector": "Construction & Engineering"},
    {"symbol": "M&M", "name": "Mahindra & Mahindra Ltd.", "sector": "Automobile"},
    {"symbol": "MARUTI", "name": "Maruti Suzuki India Ltd.", "sector": "Automobile"},
    {"symbol": "NESTLEIND", "name": "Nestle India Ltd.", "sector": "Consumer Goods"},
    {"symbol": "NTPC", "name": "NTPC Ltd.", "sector": "Power & Energy"},
    {"symbol": "ONGC", "name": "Oil & Natural Gas Corporation Ltd.", "sector": "Energy & Oil"},
    {"symbol": "POWERGRID", "name": "Power Grid Corporation of India Ltd.", "sector": "Power & Energy"},
    {"symbol": "RELIANCE", "name": "Reliance Industries Ltd.", "sector": "Energy & Oil"},
    {"symbol": "SBILIFE", "name": "SBI Life Insurance Company Ltd.", "sector": "Financial Services"},
    {"symbol": "SBIN", "name": "State Bank of India", "sector": "Financial Services"},
    {"symbol": "SHRIRAMFIN", "name": "Shriram Finance Ltd.", "sector": "Financial Services"},
    {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical Industries Ltd.", "sector": "Healthcare"},
    {"symbol": "TATACONSUM", "name": "Tata Consumer Products Ltd.", "sector": "Consumer Goods"},
    {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd.", "sector": "Automobile"},
    {"symbol": "TATASTEEL", "name": "Tata Steel Ltd.", "sector": "Metals & Mining"},
    {"symbol": "TCS", "name": "Tata Consultancy Services Ltd.", "sector": "Information Technology"},
    {"symbol": "TECHM", "name": "Tech Mahindra Ltd.", "sector": "Information Technology"},
    {"symbol": "TITAN", "name": "Titan Company Ltd.", "sector": "Consumer Goods"},
    {"symbol": "TRENT", "name": "Trent Ltd.", "sector": "Consumer Retail"},
    {"symbol": "ULTRACEMCO", "name": "UltraTech Cement Ltd.", "sector": "Materials & Construction"},
    {"symbol": "WIPRO", "name": "Wipro Ltd.", "sector": "Information Technology"},
]

# Lookup map from symbol to metadata dict
_SYMBOL_MAP: Dict[str, Dict[str, Any]] = {
    item["symbol"]: item for item in NIFTY50_CONSTITUENTS
}
for bm in BENCHMARK_METADATA:
    _SYMBOL_MAP[bm["symbol"]] = bm


def normalize_symbol(symbol: str) -> str:
    """Normalize input ticker string to standard uppercase canonical symbol.

    Examples:
        'reliance' -> 'RELIANCE'
        'RELIANCE.NS' -> 'RELIANCE'
        'TCS.BO' -> 'TCS'
        '^NSEI' -> '^NSEI'
    """
    cleaned = symbol.strip().upper()
    if cleaned in BENCHMARK_SYMBOLS:
        return cleaned
    if cleaned.endswith(".NS") or cleaned.endswith(".BO"):
        cleaned = cleaned[:-3]
    return cleaned


def denormalize_symbol(symbol: str, provider: str = "yahoo") -> str:
    """Convert canonical symbol into provider-specific symbol format.

    For Yahoo Finance on Indian markets, equity stocks require '.NS' suffix,
    while index tickers (starting with '^') remain unchanged.
    """
    canonical = normalize_symbol(symbol)
    if canonical in BENCHMARK_SYMBOLS:
        return canonical
    if provider == "yahoo":
        return f"{canonical}.NS"
    return canonical


def get_universe_symbols(include_benchmarks: bool = False) -> List[str]:
    """Return list of canonical symbols in the universe."""
    symbols = [item["symbol"] for item in NIFTY50_CONSTITUENTS]
    if include_benchmarks:
        symbols.extend(sorted(list(BENCHMARK_SYMBOLS)))
    return symbols


def get_universe_metadata(include_benchmarks: bool = False) -> List[Dict[str, Any]]:
    """Return list of metadata dictionaries for all stocks in the universe."""
    result = list(NIFTY50_CONSTITUENTS)
    if include_benchmarks:
        result.extend(BENCHMARK_METADATA)
    return result


def get_sector_for_symbol(symbol: str) -> Optional[str]:
    """Retrieve sector name for a given ticker, or None if unknown."""
    canonical = normalize_symbol(symbol)
    meta = _SYMBOL_MAP.get(canonical)
    return meta["sector"] if meta else None


def is_valid_symbol(symbol: str) -> bool:
    """Check whether a symbol belongs to the NIFTY 50 universe or benchmarks."""
    canonical = normalize_symbol(symbol)
    return canonical in _SYMBOL_MAP
