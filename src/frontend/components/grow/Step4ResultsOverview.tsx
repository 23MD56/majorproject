import React from "react";
import {
  ArrowRight,
  ChevronLeft,
  Wallet,
  Briefcase,
} from "lucide-react";
import { AllocationDonut } from "./AllocationDonut";
import { GlassCard } from "../ui/GlassCard";
import { PrimaryButton } from "../ui/PrimaryButton";
import { GhostButton } from "../ui/GhostButton";
import { formatRupees } from "../../utils/formatters";

export interface Step4ResultsOverviewProps {
  basket: any;
  onTrackInPortfolio: () => void;
  onSeeDeepDive: () => void;
  onBackToWizard: () => void;
}

export const Step4ResultsOverview: React.FC<Step4ResultsOverviewProps> = ({
  basket,
  onTrackInPortfolio,
  onSeeDeepDive,
  onBackToWizard,
}) => {
  const allocations: any[] = basket?.allocations || [];
  const growth = basket?.growth_projections || {};

  const totalInvested =
    basket?.total_invested ||
    (basket?.capital && basket?.unallocated_cash
      ? basket.capital - basket.unallocated_cash
      : basket?.capital || 0);

  const cashBuffer = basket?.unallocated_cash || 0;
  const cashBufferPct =
    basket?.cash_buffer_pct ||
    (basket?.capital > 0 ? (cashBuffer / basket.capital) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-violet-400">
          <span className="uppercase tracking-wider">Step 4: Results Overview</span>
          <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
            {basket?.active_regime || "Low-Volatility Bull"}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
          Your Optimized AI Basket
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          Curated across {allocations.length} assets tailored to your {basket?.risk_persona || "Balanced"} persona and {basket?.horizon || "6M"} horizon.
        </p>
      </div>

      {/* Donut Chart & Overview */}
      <GlassCard className="p-4 sm:p-6 bg-[var(--bg-card)] border-[var(--border-subtle)] flex flex-col items-center">
        <AllocationDonut allocations={allocations} totalInvested={totalInvested} />

        {/* Discrete Allocation & Cash Buffer Summary */}
        <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
              <Briefcase className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>Total Invested</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-[var(--text-main)]">
              {formatRupees(totalInvested)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cash Buffer</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupees(cashBuffer)} ({cashBufferPct.toFixed(1)}%)
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Scrollable Stock Pills List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
          Asset Allocations ({allocations.length})
        </h3>
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {allocations.map((item, index) => {
            const weightPct = item.weight > 1 ? item.weight : item.weight * 100;
            const shares = item.shares || item.shares_approx || 0;
            const allocatedAmt = item.allocated_amount || item.target_amount || 0;

            return (
              <div
                key={item.symbol || index}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:border-violet-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-300">
                    {item.symbol?.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[var(--text-main)]">{item.symbol}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {shares > 0 ? `${shares} shares • ` : ""}{formatRupees(allocatedAmt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-300">
                    {weightPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-Tier Probabilistic Rupee Growth Scenarios */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
            Probabilistic Growth Scenarios ({basket?.horizon || "6M"})
          </h3>
          <span className="text-[10px] text-[var(--text-muted)] font-medium">Quantile Regression (ML)</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Pessimistic Q10 */}
          <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-center">
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              Pessimistic (Q10)
            </span>
            <p className="text-xs sm:text-sm font-bold text-[var(--text-main)] mt-1">
              {growth?.pessimistic_q10?.final_value
                ? formatRupees(growth.pessimistic_q10.final_value)
                : formatRupees(basket?.capital * 0.96)}
            </p>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium block">
              {growth?.pessimistic_q10?.return_pct
                ? `${growth.pessimistic_q10.return_pct > 0 ? "+" : ""}${growth.pessimistic_q10.return_pct.toFixed(1)}%`
                : "-4.0%"}
            </span>
          </div>

          {/* Base Q50 */}
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/40 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-violet-500/10 rounded-bl-xl pointer-events-none" />
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-300 uppercase tracking-wider block">
              Base Case (Q50)
            </span>
            <p className="text-xs sm:text-sm font-bold text-[var(--text-main)] mt-1">
              {growth?.base_q50?.final_value
                ? formatRupees(growth.base_q50.final_value)
                : formatRupees(basket?.capital * 1.08)}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
              {growth?.base_q50?.return_pct
                ? `+${growth.base_q50.return_pct.toFixed(1)}%`
                : "+8.2%"}
            </span>
          </div>

          {/* Optimistic Q90 */}
          <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-center">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Optimistic (Q90)
            </span>
            <p className="text-xs sm:text-sm font-bold text-[var(--text-main)] mt-1">
              {growth?.optimistic_q90?.final_value
                ? formatRupees(growth.optimistic_q90.final_value)
                : formatRupees(basket?.capital * 1.16)}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
              {growth?.optimistic_q90?.return_pct
                ? `+${growth.optimistic_q90.return_pct.toFixed(1)}%`
                : "+16.5%"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <PrimaryButton
          fullWidth
          onClick={onTrackInPortfolio}
          icon={<Briefcase className="w-4 h-4" />}
        >
          Track in Virtual Paper Portfolio
        </PrimaryButton>

        <div className="flex items-center justify-between gap-3">
          <GhostButton onClick={onBackToWizard} icon={<ChevronLeft className="w-4 h-4" />}>
            Edit Inputs
          </GhostButton>

          <GhostButton
            onClick={onSeeDeepDive}
            className="text-violet-400 hover:text-violet-300"
          >
            <span>See Deep Dive</span>
            <ArrowRight className="w-4 h-4 ml-1 inline" />
          </GhostButton>
        </div>
      </div>
    </div>
  );
};
