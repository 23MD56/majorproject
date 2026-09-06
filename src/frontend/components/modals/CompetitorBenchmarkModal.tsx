import React, { useState } from "react";
import { Check, X, Layers, Calculator, ArrowRight } from "lucide-react";
import { ModalSheet } from "../ui/ModalSheet";
import { PrimaryButton } from "../ui/PrimaryButton";

interface CompetitorBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToGrow?: () => void;
}

const COMPARISON_ROWS = [
  {
    feature: "Dynamic Regime Adaptation",
    quantniti: true,
    smallcase: false,
    groww: false,
    mutualFunds: false,
    detail: "Switches allocations during Bull, Volatile, or Correction regimes automatically.",
  },
  {
    feature: "4-Pillar Explainable AI Trust Card",
    quantniti: true,
    smallcase: false,
    groww: false,
    mutualFunds: false,
    detail: "Complete transparency into data sources, training recency, and Monte Carlo envelope.",
  },
  {
    feature: "Broker-Agnostic 1-Click Order Sheet",
    quantniti: true,
    smallcase: false,
    groww: false,
    mutualFunds: false,
    detail: "Exports Zerodha CSV / Groww text orders. You keep assets in your own demat account.",
  },
  {
    feature: "Zero Commission / No Hidden Expense Ratio",
    quantniti: true,
    smallcase: true,
    groww: true,
    mutualFunds: false,
    detail: "Mutual fund TERs silently consume 1.0% to 2.2% every year regardless of performance.",
  },
  {
    feature: "Real-Time 10Y GBM Compounding Simulation",
    quantniti: true,
    smallcase: false,
    groww: false,
    mutualFunds: false,
    detail: "Monte Carlo quantile cones (Q10, Q50, Q90) vs 7% Bank FD hurdle.",
  },
];

export const CompetitorBenchmarkModal: React.FC<CompetitorBenchmarkModalProps> = ({
  isOpen,
  onClose,
  onNavigateToGrow,
}) => {
  const [capital, setCapital] = useState(100000);
  const [expenseRatioPct, setExpenseRatioPct] = useState(1.5);
  const years = 10;

  // Fee drag calculation
  const grossValue = capital * Math.pow(1 + 0.13, years);
  const netValueWithFee = capital * Math.pow(1 + (0.13 - expenseRatioPct / 100), years);
  const totalFeeLost = Math.round(grossValue - netValueWithFee);

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">QuantNiti vs Competitors</h3>
            <p className="text-[11px] text-slate-400">Algorithmic Advantage & Fee Drag Calculator</p>
          </div>
        </div>
      }
      className="max-h-[90vh]"
    >
      <div className="space-y-5 pt-1">
        {/* Comparison Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-violet-500/20 bg-slate-900/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-violet-500/20 bg-slate-950/60 text-slate-400">
                <th className="py-2.5 px-3">Capability</th>
                <th className="py-2.5 px-2 text-center text-violet-300 font-bold bg-violet-950/40">
                  QuantNiti
                </th>
                <th className="py-2.5 px-2 text-center">Smallcase</th>
                <th className="py-2.5 px-2 text-center">Groww</th>
                <th className="py-2.5 px-2 text-center">Active MFs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-500/10">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-violet-950/20 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-semibold text-white block">{row.feature}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">
                      {row.detail}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center bg-violet-950/30">
                    {row.quantniti ? (
                      <span className="inline-flex w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 items-center justify-center">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {row.smallcase ? (
                      <Check className="w-3.5 h-3.5 mx-auto text-slate-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 mx-auto text-slate-600" />
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {row.groww ? (
                      <Check className="w-3.5 h-3.5 mx-auto text-slate-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 mx-auto text-slate-600" />
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {row.mutualFunds ? (
                      <Check className="w-3.5 h-3.5 mx-auto text-slate-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 mx-auto text-slate-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Fee Drag Calculator */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 to-slate-900/60 border border-violet-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              10-Year Mutual Fund Fee Drag Calculator
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-medium">Invested Capital (₹)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                step={10000}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-violet-500/20 text-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-medium">MF Expense Ratio (%)</label>
              <input
                type="number"
                value={expenseRatioPct}
                onChange={(e) => setExpenseRatioPct(Number(e.target.value))}
                step={0.1}
                min={0.5}
                max={3.0}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-violet-500/20 text-white text-xs"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-rose-300 font-medium block">
                Estimated Wealth Siphoned by Fund Fees
              </span>
              <span className="text-lg font-black text-rose-400">
                ₹{totalFeeLost.toLocaleString("en-IN")}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 text-right max-w-[140px]">
              Direct stock baskets via QuantNiti charge zero ongoing AUM fee drag.
            </span>
          </div>
        </div>

        {/* Action Button */}
        {onNavigateToGrow && (
          <div className="pt-1">
            <PrimaryButton
              fullWidth
              onClick={() => {
                onClose();
                onNavigateToGrow();
              }}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Discover Your Zero-Commission AI Basket
            </PrimaryButton>
          </div>
        )}
      </div>
    </ModalSheet>
  );
};
