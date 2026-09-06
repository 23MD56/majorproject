import React, { useState, useMemo } from "react";
import { Calculator, ArrowUpRight } from "lucide-react";
import { GlassCard, AnimatedNumber } from "../ui";

export interface CompoundingVisualizerProps {
  className?: string;
}

export const CompoundingVisualizer: React.FC<CompoundingVisualizerProps> = ({ className = "" }) => {
  const [sipAmount, setSipAmount] = useState(10000);
  const [tenureYears, setTenureYears] = useState(5);
  const [expectedReturn, setExpectedReturn] = useState(14);
  const [stepUp, setStepUp] = useState(false);

  const { totalInvested, futureValue, totalGain } = useMemo(() => {
    const monthlyRate = expectedReturn / 12 / 100;
    const totalMonths = tenureYears * 12;

    let invested = 0;
    let fv = 0;
    let currentMonthlySip = sipAmount;

    for (let m = 1; m <= totalMonths; m++) {
      if (stepUp && m > 1 && (m - 1) % 12 === 0) {
        currentMonthlySip *= 1.1; // 10% annual step-up
      }
      invested += currentMonthlySip;
      fv = (fv + currentMonthlySip) * (1 + monthlyRate);
    }

    const gain = Math.max(0, fv - invested);
    return {
      totalInvested: Math.round(invested),
      futureValue: Math.round(fv),
      totalGain: Math.round(gain),
    };
  }, [sipAmount, tenureYears, expectedReturn, stepUp]);

  const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <GlassCard className={`p-5 flex flex-col gap-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Calculator className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-[var(--text-main)]">
              Compounding Visualizer
            </h3>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              Systematic Wealth Projection Engine
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStepUp(!stepUp)}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
            stepUp
              ? "bg-accent text-white border-accent shadow-sm shadow-violet-500/25"
              : "bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]"
          }`}
        >
          +10% Annual Step-up
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="flex flex-col gap-4">
        {/* Monthly SIP */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <label htmlFor="sip-slider" className="text-[var(--text-muted)]">
              Monthly SIP
            </label>
            <span className="font-mono text-accent">₹{sipAmount.toLocaleString("en-IN")}</span>
          </div>
          <input
            id="sip-slider"
            type="range"
            min={1000}
            max={100000}
            step={1000}
            value={sipAmount}
            onChange={(e) => setSipAmount(Number(e.target.value))}
            className="w-full h-1.5 bg-violet-400/20 rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Tenure */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <label htmlFor="tenure-slider" className="text-[var(--text-muted)]">
              Tenure
            </label>
            <span className="font-mono text-accent">{tenureYears} Years</span>
          </div>
          <input
            id="tenure-slider"
            type="range"
            min={1}
            max={30}
            step={1}
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="w-full h-1.5 bg-violet-400/20 rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Expected Return */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <label htmlFor="return-slider" className="text-[var(--text-muted)]">
              Expected Return
            </label>
            <span className="font-mono text-accent">{expectedReturn}% p.a.</span>
          </div>
          <input
            id="return-slider"
            type="range"
            min={6}
            max={25}
            step={0.5}
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(Number(e.target.value))}
            className="w-full h-1.5 bg-violet-400/20 rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>
      </div>

      {/* Projection Results */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex flex-col gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Projected Total Wealth
          </span>
          <span
            data-testid="compounding-future-value"
            className="text-2xl font-black font-mono tracking-tight text-accent"
          >
            ₹
            <AnimatedNumber
              value={futureValue}
              formatter={(v) => Math.round(v).toLocaleString("en-IN")}
            />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Invested Capital</span>
            <span className="text-xs font-bold font-mono text-[var(--text-main)]">
              ₹{totalInvested.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Wealth Created (Gain)</span>
            <span className="text-xs font-bold font-mono text-emerald-500 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              ₹{totalGain.toLocaleString("en-IN")} (+{gainPercentage.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Wealth Ratio Bar */}
        <div className="h-2 w-full rounded-full bg-violet-400/20 flex overflow-hidden mt-1">
          <div
            style={{ width: `${Math.round((totalInvested / (futureValue || 1)) * 100)}%` }}
            className="h-full bg-indigo-500/80"
            title="Invested Capital"
          />
          <div
            style={{ width: `${Math.round((totalGain / (futureValue || 1)) * 100)}%` }}
            className="h-full bg-emerald-500"
            title="Estimated Wealth Created"
          />
        </div>
      </div>
    </GlassCard>
  );
};
