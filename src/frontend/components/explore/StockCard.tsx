import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles, AlertCircle, MinusCircle } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { AnimatedNumber } from "../ui/AnimatedNumber";

export interface ExploreStockItem {
  symbol: string;
  name: string;
  sector: string;
  current_price: number;
  day_change: number;
  day_change_pct: number;
  growth_6m_base_pct: number;
  growth_6m_optimistic_pct: number;
  growth_6m_pessimistic_pct: number;
  regime_suitability_score: number;
  regime_badge: string;
  volume?: number;
  asset_class?: string;
  esg_composite?: number;
  esg_badge?: string;
}

export interface StockCardProps {
  stock: ExploreStockItem;
  onSelect: (stock: ExploreStockItem) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onSelect }) => {
  const dayChangePct = stock?.day_change_pct ?? 0;
  const isPositive = dayChangePct >= 0;

  // Normalized badge styling
  const badgeLower = (stock?.regime_badge || "").toLowerCase();
  let badgeConfig = {
    label: stock?.regime_badge || "Hold",
    bgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    icon: MinusCircle,
  };

  if (badgeLower.includes("strong buy") || badgeLower.includes("buy")) {
    badgeConfig = {
      label: "Strong Buy",
      bgClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      icon: Sparkles,
    };
  } else if (badgeLower.includes("caution") || badgeLower.includes("reduce") || badgeLower.includes("sell")) {
    badgeConfig = {
      label: "Caution",
      bgClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
      icon: AlertCircle,
    };
  } else {
    badgeConfig = {
      label: "Hold",
      bgClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
      icon: MinusCircle,
    };
  }

  const BadgeIcon = badgeConfig.icon;

  // Calculate 6M forecast bar percentage bounds (0 to 100% scale for visualization)
  const pessimisticPct = stock?.growth_6m_pessimistic_pct ?? 0;
  const optimisticPct = stock?.growth_6m_optimistic_pct ?? 20;
  const basePct = stock?.growth_6m_base_pct ?? 10;

  const minRange = Math.min(0, pessimisticPct);
  const maxRange = Math.max(30, optimisticPct);
  const rangeSpan = Math.max(1, maxRange - minRange);
  const baseOffsetPct = Math.max(
    10,
    Math.min(90, ((basePct - minRange) / rangeSpan) * 100)
  );

  return (
    <motion.div
      data-testid={`stock-card-${stock.symbol}`}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18 }}
      onClick={() => onSelect(stock)}
      className="cursor-pointer select-none"
    >
      <GlassCard className="rounded-2xl p-4 flex flex-col justify-between h-full hover:border-violet-500/40 transition-colors duration-200 group">
        {/* Top Row: Symbol, Sector, and Regime Suitability Badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold tracking-tight text-[var(--text-muted)] group-hover:text-accent transition-colors">
                {stock.symbol}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 font-medium">
                {stock.sector}
              </span>
            </div>
            <h3 className="font-bold text-base text-[var(--text-main)] mt-0.5 leading-snug line-clamp-1">
              {stock.name}
            </h3>
          </div>

          {/* Color-coded Regime Suitability Badge */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${badgeConfig.bgClass}`}
          >
            <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{badgeConfig.label}</span>
          </div>
        </div>

        {/* Middle Row: Price & Day Change */}
        <div className="my-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-[var(--text-main)] tracking-tight">
              ₹<AnimatedNumber value={stock.current_price} formatter={(v) => v.toFixed(2)} />
            </span>
          </div>

          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {dayChangePct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Bottom Row: 6M Forecast Range Visual Bar */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent" />
              6M Forecast Range
            </span>
            <span className="font-semibold text-accent">
              {basePct >= 0 ? "+" : ""}
              {basePct.toFixed(1)}% base
            </span>
          </div>

          {/* Visual Progress / Range Bar */}
          <div
            data-testid="forecast-6m-bar"
            className="w-full h-2 rounded-full bg-violet-500/10 dark:bg-violet-950/40 relative overflow-hidden flex items-center"
            title={`6M Forecast: Pessimistic ${pessimisticPct}% to Optimistic ${optimisticPct}%`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${baseOffsetPct}%` }}
            />
            {/* Base indicator pin */}
            <div
              className="absolute w-1.5 h-3 bg-white dark:bg-violet-200 rounded-full shadow-sm"
              style={{ left: `calc(${baseOffsetPct}% - 3px)` }}
            />
          </div>

          {/* Range Labels */}
          <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-1 font-mono">
            <span>Low: {pessimisticPct.toFixed(0)}%</span>
            <span>High: +{optimisticPct.toFixed(0)}%</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
