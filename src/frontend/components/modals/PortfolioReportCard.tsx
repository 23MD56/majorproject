import React from "react";
import { Award, ShieldCheck, TrendingUp, CheckCircle2 } from "lucide-react";
import { ModalSheet } from "../ui/ModalSheet";
import { PrimaryButton } from "../ui/PrimaryButton";
import { PortfolioData } from "../portfolio/demoPortfolioData";
import { formatRupees } from "../../utils/formatters";

interface PortfolioReportCardProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioData | null;
}

export const PortfolioReportCard: React.FC<PortfolioReportCardProps> = ({
  isOpen,
  onClose,
  portfolio,
}) => {
  if (!isOpen || !portfolio) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] text-base">QuantNiti Portfolio Audit Card</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Quantitative Legitimacy & Performance Certificate</p>
          </div>
        </div>
      }
      className="max-h-[92vh]"
    >
      <div className="space-y-4 pt-1">
        {/* Printable Card Area */}
        <div
          id="quantniti-printable-report"
          className="p-5 rounded-3xl bg-[var(--bg-card)] dark:bg-slate-950 border-2 border-violet-500/30 space-y-4 shadow-xl text-[var(--text-main)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                Certified Strategy
              </span>
              <h4 className="text-base font-black text-[var(--text-main)]">{portfolio.name}</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[var(--text-muted)] block">Report As Of</span>
              <span className="text-xs font-semibold text-[var(--text-main)]">
                {portfolio.as_of_date || new Date().toISOString().split("T")[0]}
              </span>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)] block">Current Valuation</span>
              <span className="text-sm font-bold text-[var(--text-main)]">
                {formatRupees(portfolio.current_value)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)] block">Total Return</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                +{(portfolio.total_pnl_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)] block">Alpha vs NIFTY</span>
              <span className="text-sm font-bold text-accent">
                +{(portfolio.benchmark_comparison?.alpha_vs_nifty ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)] block">Max Drawdown</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {(portfolio.max_drawdown_pct ?? 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 4-Pillar Algorithmic Trust Attestation */}
          <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>Algorithmic Trust & Audit Attestation</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)]">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Zero Commission Drag</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Regime-Aware Optimization</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Self-Custody Execution</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Verified Backtest Envelopes</span>
              </div>
            </div>
          </div>

          {/* Allocation Snapshot */}
          <div className="space-y-1">
            <span className="text-[11px] text-[var(--text-muted)] font-medium block">
              Holdings Snapshot ({portfolio.holdings.length} Assets)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {portfolio.holdings.map((h) => (
                <span
                  key={h.symbol}
                  className="px-2 py-0.5 rounded-lg bg-[var(--bg-card-subtle)] text-[11px] text-[var(--text-main)] border border-[var(--border-subtle)] font-medium shadow-sm"
                >
                  {h.symbol} ({(h.weight * 100).toFixed(0)}%)
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <PrimaryButton fullWidth onClick={handlePrint} icon={<TrendingUp className="w-4 h-4" />}>
            Print or Save PDF Report Card
          </PrimaryButton>
        </div>
      </div>
    </ModalSheet>
  );
};
