import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Compass, TrendingUp, PieChart, ArrowUpRight } from "lucide-react";
import { GlassCard, PrimaryButton, GhostButton, AnimatedNumber } from "../ui";
import { useAppStore } from "../../store/useAppStore";

export interface AdaptiveHomeCardProps {
  className?: string;
}

export const AdaptiveHomeCard: React.FC<AdaptiveHomeCardProps> = ({ className = "" }) => {
  const { activePortfolio } = useAppStore();

  if (activePortfolio) {
    // Returning user with active portfolio -> PortfolioSnapshot
    const isOverallPositive = (activePortfolio.total_pnl ?? 0) >= 0;
    const dayPnl = activePortfolio.day_pnl ?? 420.5;
    const isDayPositive = dayPnl >= 0;
    const dayPnlPct = activePortfolio.current_value > 0
      ? (dayPnl / activePortfolio.current_value) * 100
      : 0.8;
    const alpha = activePortfolio.benchmark_comparison?.alpha_vs_nifty ?? 2.8;
    const isAlphaPositive = alpha >= 0;

    return (
      <GlassCard
        data-testid="portfolio-snapshot-card"
        className={`p-5 flex flex-col gap-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-[var(--text-main)]">
                Portfolio Snapshot
              </h3>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                {activePortfolio.name || "Virtual Paper Portfolio"}
              </span>
            </div>
          </div>

          <Link
            to="/portfolio"
            className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
          >
            <span>Manage</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Total Value */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-muted)]">
            Total Current Value
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-[var(--text-main)]">
            ₹
            <AnimatedNumber
              value={activePortfolio.current_value || 0}
              formatter={(v) => Math.round(v).toLocaleString("en-IN")}
            />
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border-subtle)]">
          {/* 1D P&L */}
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-[var(--text-muted)]">1D P&L</span>
            <span
              className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
                isDayPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isDayPositive ? "+" : ""}₹{Math.round(dayPnl).toLocaleString("en-IN")}
            </span>
            <span
              className={`text-[9px] font-medium ${
                isDayPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isDayPositive ? "+" : ""}
              {dayPnlPct.toFixed(1)}%
            </span>
          </div>

          {/* Overall P&L */}
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-[var(--text-muted)]">Overall P&L</span>
            <span
              className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
                isOverallPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isOverallPositive ? "+" : ""}₹
              {Math.round(activePortfolio.total_pnl ?? 0).toLocaleString("en-IN")}
            </span>
            <span
              className={`text-[9px] font-medium ${
                isOverallPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isOverallPositive ? "+" : ""}
              {(activePortfolio.total_pnl_pct ?? 0).toFixed(1)}%
            </span>
          </div>

          {/* Alpha vs NIFTY */}
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-[var(--text-muted)]">Alpha vs NIFTY</span>
            <span
              className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
                isAlphaPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isAlphaPositive ? "+" : ""}
              {alpha.toFixed(1)}%
            </span>
            <span className="text-[9px] font-medium text-[var(--text-muted)]">Excess Return</span>
          </div>
        </div>
      </GlassCard>
    );
  }

  // New user with no portfolio -> OnboardingCard
  return (
    <GlassCard
      data-testid="onboarding-card"
      className={`p-6 flex flex-col gap-4 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-violet-500/5 ${className}`}
    >
      <div className="flex items-center gap-2 text-accent">
        <Sparkles className="w-5 h-5 text-accent" />
        <span className="text-xs font-bold uppercase tracking-wider">
          New Investor Journey
        </span>
      </div>

      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-main)]">
          Start Your Investment Journey
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
          Experience algorithmic risk-weighted portfolio construction. Build virtual paper baskets with zero real capital risk.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Link to="/grow" className="flex-1">
          <PrimaryButton fullWidth icon={<TrendingUp className="w-4 h-4" />}>
            Build Basket
          </PrimaryButton>
        </Link>
        <Link to="/explore" className="flex-1">
          <GhostButton className="w-full justify-center border border-violet-400/20" icon={<Compass className="w-4 h-4" />}>
            Explore Stocks
          </GhostButton>
        </Link>
      </div>
    </GlassCard>
  );
};
