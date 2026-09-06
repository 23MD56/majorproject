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
            <h3 className="font-bold text-white text-base">QuantNiti Portfolio Audit Card</h3>
            <p className="text-[11px] text-slate-400">Quantitative Legitimacy & Performance Certificate</p>
          </div>
        </div>
      }
      className="max-h-[92vh]"
    >
      <div className="space-y-4 pt-1">
        {/* Printable Card Area */}
        <div
          id="quantniti-printable-report"
          className="p-5 rounded-3xl bg-slate-950 border-2 border-violet-500/30 space-y-4 shadow-xl text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-violet-500/20 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                Certified Strategy
              </span>
              <h4 className="text-base font-black text-white">{portfolio.name}</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Report As Of</span>
              <span className="text-xs font-semibold text-slate-300">
                {portfolio.as_of_date || new Date().toISOString().split("T")[0]}
              </span>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-violet-500/20">
              <span className="text-[10px] text-slate-400 block">Current Valuation</span>
              <span className="text-sm font-bold text-white">
                {formatRupees(portfolio.current_value)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-violet-500/20">
              <span className="text-[10px] text-slate-400 block">Total Return</span>
              <span className="text-sm font-bold text-emerald-400">
                +{(portfolio.total_pnl_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-violet-500/20">
              <span className="text-[10px] text-slate-400 block">Alpha vs NIFTY</span>
              <span className="text-sm font-bold text-violet-300">
                +{(portfolio.benchmark_comparison?.alpha_vs_nifty ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-violet-500/20">
              <span className="text-[10px] text-slate-400 block">Max Drawdown</span>
              <span className="text-sm font-bold text-slate-200">
                {(portfolio.max_drawdown_pct ?? 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 4-Pillar Algorithmic Trust Attestation */}
          <div className="p-3 rounded-2xl bg-violet-950/30 border border-violet-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span>Algorithmic Trust & Audit Attestation</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Zero Commission Drag</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Regime-Aware Optimization</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Self-Custody Execution</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Verified Backtest Envelopes</span>
              </div>
            </div>
          </div>

          {/* Allocation Snapshot */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium block">
              Holdings Snapshot ({portfolio.holdings.length} Assets)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {portfolio.holdings.map((h) => (
                <span
                  key={h.symbol}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 text-[11px] text-slate-300 border border-violet-500/10 font-medium"
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
