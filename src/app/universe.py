"""NIFTY 50 Universe and Constituent Definitions for QuantNiti.

Provides canonical list of NIFTY 50 constituents, sector mapping, benchmark
indices, and normalization helpers across data providers (e.g. Yahoo Finance .NS suffix).
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union

from app.core.models import AssetClass

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

# Commodity ETFs (Gold and Silver)
COMMODITY_ETF_CONSTITUENTS: List[Dict[str, Any]] = [
    {
        "symbol": "GOLDBEES",
        "name": "Nippon India ETF Gold BeES",
        "sector": "Commodities",
        "asset_class": AssetClass.COMMODITY_ETF,
    },
    {
        "symbol": "SILVERBEES",
        "name": "Nippon India ETF Silver BeES",
        "sector": "Commodities",
        "asset_class": AssetClass.COMMODITY_ETF,
    },
]

# Indian Defense Equities
DEFENSE_CONSTITUENTS: List[Dict[str, Any]] = [
    {
        "symbol": "HAL",
        "name": "Hindustan Aeronautics Ltd.",
        "sector": "Defense",
        "asset_class": AssetClass.SECTORAL,
    },
    {
        "symbol": "BEL",
        "name": "Bharat Electronics Ltd.",
        "sector": "Defense",
        "asset_class": AssetClass.SECTORAL,
    },
    {
        "symbol": "BDL",
        "name": "Bharat Dynamics Ltd.",
        "sector": "Defense",
        "asset_class": AssetClass.SECTORAL,
    },
    {
        "symbol": "MAZDOCK",
        "name": "Mazagon Dock Shipbuilders Ltd.",
        "sector": "Defense",
        "asset_class": AssetClass.SECTORAL,
    },
    {
        "symbol": "COCHINSHIP",
        "name": "Cochin Shipyard Ltd.",
        "sector": "Defense",
        "asset_class": AssetClass.SECTORAL,
    },
]

# Metals Leaders
METALS_CONSTITUENTS: List[Dict[str, Any]] = [
    {
        "symbol": "TATASTEEL",
        "name": "Tata Steel Ltd.",
        "sector": "Metals",
        "asset_class": AssetClass.SECTORAL,
    },
    {
        "symbol": "HINDALCO",
        "name": "Hindalco Industries Ltd.",
        "sector": "Metals",
        "asset_class": AssetClass.SECTORAL,
    },
    {
        "symbol": "JSWSTEEL",
        "name": "JSW Steel Ltd.",
        "sector": "Metals",
        "asset_class": AssetClass.SECTORAL,
    },
    {
        "symbol": "VEDL",
        "name": "Vedanta Ltd.",
        "sector": "Metals",
        "asset_class": AssetClass.SECTORAL,
    },
    {
        "symbol": "JINDALSTEL",
        "name": "Jindal Steel & Power Ltd.",
        "sector": "Metals",
        "asset_class": AssetClass.SECTORAL,
    },
]

# Set default asset_class for NIFTY 50
for item in NIFTY50_CONSTITUENTS:
    if "asset_class" not in item:
        item["asset_class"] = AssetClass.EQUITY

# Build canonical 58-asset Investment Universe
INVESTMENT_UNIVERSE: List[Dict[str, Any]] = []
_seen_symbols: Set[str] = set()

# First add Sectoral and Commodity ETFs so specific sectoral classifications take precedence
for item in COMMODITY_ETF_CONSTITUENTS + DEFENSE_CONSTITUENTS + METALS_CONSTITUENTS:
    if item["symbol"] not in _seen_symbols:
        INVESTMENT_UNIVERSE.append(dict(item))
        _seen_symbols.add(item["symbol"])

# Then add the remaining NIFTY 50 equities
for item in NIFTY50_CONSTITUENTS:
    if item["symbol"] not in _seen_symbols:
        c_item = dict(item)
        if "asset_class" not in c_item:
            c_item["asset_class"] = AssetClass.EQUITY
        INVESTMENT_UNIVERSE.append(c_item)
        _seen_symbols.add(item["symbol"])

EXPANDED_CONSTITUENTS = INVESTMENT_UNIVERSE

# Load curated ESG scores dataset
_ESG_DATA_PATH = Path(__file__).resolve().parent / "data" / "esg_scores.json"
ESG_DATA: Dict[str, Dict[str, Any]] = {}
if _ESG_DATA_PATH.exists():
    try:
        with open(_ESG_DATA_PATH, "r", encoding="utf-8") as f:
            ESG_DATA = json.load(f)
    except Exception:
        ESG_DATA = {}

# Enrich constituents with ESG scores
for col_list in (NIFTY50_CONSTITUENTS, INVESTMENT_UNIVERSE):
    for item in col_list:
        sym = item["symbol"]
        if sym in ESG_DATA:
            esg = ESG_DATA[sym]
            item["esg_composite"] = esg.get("esg_composite")
            item["esg_environment"] = esg.get("esg_environment")
            item["esg_social"] = esg.get("esg_social")
            item["esg_governance"] = esg.get("esg_governance")

# Lookup map from symbol to metadata dict
_SYMBOL_MAP: Dict[str, Dict[str, Any]] = {
    item["symbol"]: item for item in INVESTMENT_UNIVERSE
}
for bm in BENCHMARK_METADATA:
    _SYMBOL_MAP[bm["symbol"]] = bm


def get_esg_badge(score: float) -> str:
    """Return ESG badge with color indicator based on composite score."""
    if score >= 70.0:
        return "🟢 High ESG"
    elif score >= 40.0:
        return "🟡 Moderate ESG"
    else:
        return "🔴 Low ESG"


def get_esg_score_for_symbol(symbol: str) -> Optional[Dict[str, Any]]:
    """Retrieve curated ESG score dictionary for a canonical symbol."""
    canonical = normalize_symbol(symbol)
    if canonical in ESG_DATA:
        esg = dict(ESG_DATA[canonical])
        esg["badge"] = get_esg_badge(esg.get("esg_composite", 50.0))
        return esg
    return None


def normalize_symbol(symbol: str) -> str:
    """Normalize input ticker string to standard uppercase canonical symbol.

    Examples:
        'reliance' -> 'RELIANCE'
        'RELIANCE.NS' -> 'RELIANCE'
        'TCS.BO' -> 'TCS'
        'goldbees.ns' -> 'GOLDBEES'
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

    For Yahoo Finance on Indian markets, equity/ETF stocks require '.NS' suffix,
    while index tickers (starting with '^') remain unchanged.
    """
    canonical = normalize_symbol(symbol)
    if canonical in BENCHMARK_SYMBOLS:
        return canonical
    if provider == "yahoo":
        return f"{canonical}.NS"
    return canonical


def get_asset_class_for_symbol(symbol: str) -> Optional[AssetClass]:
    """Retrieve the asset class taxonomy for a given symbol."""
    canonical = normalize_symbol(symbol)
    meta = _SYMBOL_MAP.get(canonical)
    if not meta:
        return None
    ac = meta.get("asset_class", AssetClass.EQUITY)
    return AssetClass(ac) if isinstance(ac, str) else ac


def get_universe_symbols(
    include_benchmarks: bool = False,
    include_expanded: bool = True,
    asset_classes: Optional[List[Union[AssetClass, str]]] = None,
) -> List[str]:
    """Return list of canonical symbols in the universe."""
    base = INVESTMENT_UNIVERSE if include_expanded else NIFTY50_CONSTITUENTS
    if asset_classes:
        str_classes = {(ac.value if hasattr(ac, "value") else str(ac)) for ac in asset_classes}
        symbols = [
            item["symbol"]
            for item in base
            if (item.get("asset_class").value if hasattr(item.get("asset_class"), "value") else str(item.get("asset_class", "EQUITY"))) in str_classes
        ]
    else:
        symbols = [item["symbol"] for item in base]

    if include_benchmarks:
        symbols.extend(sorted(list(BENCHMARK_SYMBOLS)))
    return symbols


def get_universe_metadata(
    include_benchmarks: bool = False,
    include_expanded: bool = True,
    asset_classes: Optional[List[Union[AssetClass, str]]] = None,
) -> List[Dict[str, Any]]:
    """Return list of metadata dictionaries for all stocks in the universe."""
    base = list(INVESTMENT_UNIVERSE if include_expanded else NIFTY50_CONSTITUENTS)
    if asset_classes:
        str_classes = {(ac.value if hasattr(ac, "value") else str(ac)) for ac in asset_classes}
        result = [
            dict(item)
            for item in base
            if (item.get("asset_class").value if hasattr(item.get("asset_class"), "value") else str(item.get("asset_class", "EQUITY"))) in str_classes
        ]
    else:
        result = [dict(item) for item in base]

    if include_benchmarks:
        result.extend(BENCHMARK_METADATA)
    return result


def get_sector_for_symbol(symbol: str) -> Optional[str]:
    """Retrieve sector name for a given ticker, or None if unknown."""
    canonical = normalize_symbol(symbol)
    meta = _SYMBOL_MAP.get(canonical)
    return meta["sector"] if meta else None


def is_valid_symbol(symbol: str) -> bool:
    """Check whether a symbol belongs to the investment universe or benchmarks."""
    canonical = normalize_symbol(symbol)
    return canonical in _SYMBOL_MAP
