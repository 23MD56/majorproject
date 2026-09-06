import React from "react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { PortfolioData } from "./demoPortfolioData";

interface PortfolioHeroCardProps {
  portfolio: PortfolioData;
  isDemo?: boolean;
}

export const PortfolioHeroCard: React.FC<PortfolioHeroCardProps> = ({
  portfolio,
  isDemo = false,
}) => {
  const is1DPositive = portfolio.pnl_1d >= 0;
  const isTotalPositive = portfolio.total_pnl >= 0;
  const alpha = portfolio.benchmark_comparison?.alpha_vs_nifty ?? 0;
  const isAlphaPositive = alpha >= 0;

  return (
    <GlassCard className="p-5 sm:p-6 space-y-5 relative overflow-hidden">
      {/* Top Banner/Header within card */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Value
            </h2>
            {isDemo && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                DEMO PREVIEW
              </span>
            )}
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
            ₹{portfolio.current_value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Alpha Badge */}
        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-medium">
            Alpha vs NIFTY
          </span>
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md mt-1 ${
              isAlphaPositive
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}
          >
            {isAlphaPositive ? "+" : ""}
            {alpha.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Dual Return Metrics & Capital Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-violet-500/20">
        {/* 1D Returns */}
        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 font-medium block">
            1D Returns
          </span>
          <div
            className={`flex items-center gap-1 text-sm font-bold ${
              is1DPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {is1DPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {is1DPositive ? "+" : ""}₹
              {Math.abs(portfolio.pnl_1d).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-semibold opacity-90">
              ({is1DPositive ? "+" : ""}
              {portfolio.pnl_1d_pct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Total Returns */}
        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 font-medium block">
            Total Returns
          </span>
          <div
            className={`flex items-center gap-1 text-sm font-bold ${
              isTotalPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isTotalPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {isTotalPositive ? "+" : ""}₹
              {Math.abs(portfolio.total_pnl).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-semibold opacity-90">
              ({isTotalPositive ? "+" : ""}
              {portfolio.total_pnl_pct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Invested Capital */}
        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 font-medium block">
            Invested Capital
          </span>
          <span className="text-sm font-bold text-slate-200">
            ₹{portfolio.invested_capital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Cash Reserve */}
        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 font-medium block">
            Cash Buffer
          </span>
          <span className="text-sm font-bold text-violet-300">
            ₹{portfolio.cash.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
