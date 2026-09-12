import React from "react";
import { TrendingUp, TrendingDown, Layers } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { PortfolioHoldingItem } from "./demoPortfolioData";

interface HoldingsTableProps {
  holdings: PortfolioHoldingItem[];
  isDemo?: boolean;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  isDemo = false,
}) => {
  if (!holdings || holdings.length === 0) {
    return (
      <GlassCard className="p-8 text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
          <Layers className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-300">
          No holdings in this portfolio yet.
        </p>
        <p className="text-xs text-slate-400">
          Add assets or allocate an AI basket from the Grow tab to start tracking.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Holdings & Allocations ({holdings.length})
          </h3>
          {isDemo && (
            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
              Simulated NIFTY 50
            </span>
          )}
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] text-[var(--text-muted)] font-semibold">
                <th className="py-3 px-4">Asset / Sector</th>
                <th className="py-3 px-3 text-right">Allocation</th>
                <th className="py-3 px-3 text-right">Qty & Avg</th>
                <th className="py-3 px-3 text-right">LTP / 1D</th>
                <th className="py-3 px-4 text-right">Returns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {holdings.map((holding) => {
                const is1DUp = holding.pnl_1d >= 0;
                const isTotalUp = holding.unrealized_pnl >= 0;
                const weightPct = (holding.weight * 100).toFixed(1);

                return (
                  <tr
                    key={holding.symbol}
                    className="hover:bg-violet-500/5 transition-colors"
                  >
                    {/* Symbol & Name/Sector */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[var(--text-main)] text-sm">
                        {holding.symbol}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                        {holding.name || holding.sector}
                      </div>
                    </td>

                    {/* Weight & Progress Bar */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold text-[var(--text-main)]">{weightPct}%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${Math.min(100, holding.weight * 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* Quantity & Buy Price */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-semibold text-[var(--text-main)]">
                        {holding.shares} shares
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        @ ₹{(holding.buy_price ?? holding.avg_price ?? 0).toLocaleString("en-IN")}
                      </div>
                    </td>

                    {/* LTP and 1D Change */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-[var(--text-main)]">
                        ₹{(holding.current_price ?? 0).toLocaleString("en-IN")}
                      </div>
                      <div
                        className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                          is1DUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {is1DUp ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {is1DUp ? "+" : ""}
                          {(holding.pnl_1d_pct ?? holding.day_change_pct ?? 0).toFixed(2)}%
                        </span>
                      </div>
                    </td>

                    {/* Total Unrealized P&L */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-[var(--text-main)]">
                        ₹{(holding.current_value ?? (holding.shares * (holding.current_price ?? 0))).toLocaleString("en-IN")}
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${
                          isTotalUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isTotalUp ? "+" : ""}₹
                        {Math.abs(holding.unrealized_pnl ?? holding.pnl ?? 0).toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}{" "}
                        ({isTotalUp ? "+" : ""}
                        {(holding.unrealized_pnl_pct ?? holding.pnl_pct ?? 0).toFixed(1)}%)
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
