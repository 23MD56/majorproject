import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, X, Compass, Layers } from "lucide-react";
import { StockCard, ExploreStockItem } from "../components/explore/StockCard";
import { StockProfileModal } from "../components/explore/StockProfileModal";
import { useAppStore } from "../store/useAppStore";

import { ProToolsBacktester } from "../components/explore/ProToolsBacktester";
import { abortRegistry } from "../services/abortRegistry";
import { ChipButton } from "../components/ui/ChipButton";

const SECTORS = [
  "All",
  "Technology",
  "Banking",
  "Energy",
  "Auto",
  "Healthcare",
  "FMCG",
  "Metal",
  "Finance",
];

const DEFAULT_STOCKS: ExploreStockItem[] = [
  {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries",
    sector: "Energy",
    current_price: 2980.5,
    day_change: 35.2,
    day_change_pct: 1.19,
    growth_6m_base_pct: 14.5,
    growth_6m_optimistic_pct: 22.0,
    growth_6m_pessimistic_pct: 4.2,
    regime_suitability_score: 88.5,
    regime_badge: "Strong Buy",
    volume: 12500000,
    asset_class: "EQUITY",
    esg_composite: 74.0,
    esg_badge: "Leader",
  },
  {
    symbol: "TCS.NS",
    name: "Tata Consultancy Services",
    sector: "Technology",
    current_price: 4120.0,
    day_change: -18.5,
    day_change_pct: -0.45,
    growth_6m_base_pct: 11.2,
    growth_6m_optimistic_pct: 18.4,
    growth_6m_pessimistic_pct: 2.1,
    regime_suitability_score: 72.0,
    regime_badge: "Hold",
    volume: 3800000,
    asset_class: "EQUITY",
    esg_composite: 82.5,
    esg_badge: "Leader",
  },
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank",
    sector: "Banking",
    current_price: 1640.25,
    day_change: 8.75,
    day_change_pct: 0.54,
    growth_6m_base_pct: 13.8,
    growth_6m_optimistic_pct: 20.5,
    growth_6m_pessimistic_pct: 3.5,
    regime_suitability_score: 82.0,
    regime_badge: "Strong Buy",
    volume: 18200000,
    asset_class: "EQUITY",
    esg_composite: 78.0,
    esg_badge: "Leader",
  },
  {
    symbol: "INFY.NS",
    name: "Infosys Ltd",
    sector: "Technology",
    current_price: 1845.5,
    day_change: 14.2,
    day_change_pct: 0.78,
    growth_6m_base_pct: 12.4,
    growth_6m_optimistic_pct: 19.8,
    growth_6m_pessimistic_pct: 3.0,
    regime_suitability_score: 78.0,
    regime_badge: "Strong Buy",
    volume: 8200000,
    asset_class: "EQUITY",
    esg_composite: 85.0,
    esg_badge: "Leader",
  },
  {
    symbol: "ICICIBANK.NS",
    name: "ICICI Bank",
    sector: "Banking",
    current_price: 1210.8,
    day_change: 11.4,
    day_change_pct: 0.95,
    growth_6m_base_pct: 15.1,
    growth_6m_optimistic_pct: 23.5,
    growth_6m_pessimistic_pct: 5.2,
    regime_suitability_score: 85.0,
    regime_badge: "Strong Buy",
    volume: 14500000,
    asset_class: "EQUITY",
    esg_composite: 76.5,
    esg_badge: "Leader",
  },
  {
    symbol: "TATAMOTORS.NS",
    name: "Tata Motors",
    sector: "Auto",
    current_price: 980.0,
    day_change: -12.0,
    day_change_pct: -1.21,
    growth_6m_base_pct: 6.5,
    growth_6m_optimistic_pct: 12.0,
    growth_6m_pessimistic_pct: -2.0,
    regime_suitability_score: 55.0,
    regime_badge: "Caution",
    volume: 9500000,
    asset_class: "EQUITY",
    esg_composite: 68.0,
    esg_badge: "Average",
  },
  {
    symbol: "SUNPHARMA.NS",
    name: "Sun Pharmaceutical",
    sector: "Healthcare",
    current_price: 1720.0,
    day_change: 18.0,
    day_change_pct: 1.06,
    growth_6m_base_pct: 10.8,
    growth_6m_optimistic_pct: 16.5,
    growth_6m_pessimistic_pct: 3.2,
    regime_suitability_score: 75.0,
    regime_badge: "Hold",
    volume: 4200000,
    asset_class: "EQUITY",
    esg_composite: 71.0,
    esg_badge: "Leader",
  },
  {
    symbol: "ITC.NS",
    name: "ITC Ltd",
    sector: "FMCG",
    current_price: 505.2,
    day_change: 2.1,
    day_change_pct: 0.42,
    growth_6m_base_pct: 9.4,
    growth_6m_optimistic_pct: 14.8,
    growth_6m_pessimistic_pct: 2.5,
    regime_suitability_score: 70.0,
    regime_badge: "Hold",
    volume: 11200000,
    asset_class: "EQUITY",
    esg_composite: 83.0,
    esg_badge: "Leader",
  },
];

export const ExplorePage: React.FC = () => {
  const { allExploreStocks, setAllExploreStocks, setSelectedStockSymbol } =
    useAppStore();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeModalSymbol, setActiveModalSymbol] = useState<string | null>(null);

  // Fetch stocks on mount with async cancellation seam
  useEffect(() => {
    const signal = abortRegistry.register("explore-stocks");

    fetch("/api/explore/stocks", { signal })
      .then((res) => {
        if (!res.ok) throw new Error("Explore stocks API failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllExploreStocks(data);
        } else if (allExploreStocks.length === 0) {
          setAllExploreStocks(DEFAULT_STOCKS);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (allExploreStocks.length === 0) {
          setAllExploreStocks(DEFAULT_STOCKS);
        }
      });

    return () => {
      abortRegistry.abort("explore-stocks");
    };
  }, [setAllExploreStocks]);

  const stockList = allExploreStocks.length > 0 ? allExploreStocks : DEFAULT_STOCKS;

  // In-memory search and sector filtering
  const filteredStocks = useMemo(() => {
    return stockList.filter((stock) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSector =
        selectedSector === "All" ||
        stock.sector.toLowerCase() === selectedSector.toLowerCase();

      return matchesSearch && matchesSector;
    });
  }, [stockList, searchQuery, selectedSector]);

  const handleSelectStock = (stock: ExploreStockItem) => {
    setActiveModalSymbol(stock.symbol);
    setSelectedStockSymbol(stock.symbol);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveModalSymbol(null);
    setSelectedStockSymbol(null);
  };

  // Staggered motion container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-[520px] mx-auto">
      <h1 className="sr-only">Explore Page</h1>
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <div className="flex items-center gap-1.5 text-accent mb-0.5">
            <Compass className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Market Intelligence
            </span>
          </div>
          <h1 className="text-xl font-black text-[var(--text-main)] tracking-tight">
            Explore Universe
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-semibold text-[var(--text-muted)]">
            {filteredStocks.length} Assets
          </span>
        </div>
      </div>

      {/* In-Memory Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search stocks or symbols (e.g. RELIANCE, TCS)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500 transition-colors shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-accent rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Sector Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {SECTORS.map((sector) => (
          <ChipButton
            key={sector}
            active={selectedSector === sector}
            onClick={() => setSelectedSector(sector)}
            className="shrink-0"
          >
            {sector}
          </ChipButton>
        ))}
      </div>

      {/* Redesigned Stock Cards Grid */}
      {filteredStocks.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
        >
          {filteredStocks.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              onSelect={handleSelectStock}
            />
          ))}
        </motion.div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <Layers className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
          <h3 className="font-bold text-sm text-[var(--text-main)]">
            No matching assets found
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Try adjusting your search query or switching sector filters.
          </p>
        </div>
      )}

      {/* Pro Tools: Strategy Backtester Toggle */}
      <ProToolsBacktester />

      {/* 360 Stock Intelligence Profile Modal */}
      <StockProfileModal
        symbol={activeModalSymbol}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};
