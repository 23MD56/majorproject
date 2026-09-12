import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, Check, Clock, Star } from "lucide-react";
import { TimeHorizon } from "../../store/useAppStore";
import { PrimaryButton } from "../ui/PrimaryButton";
import { GhostButton } from "../ui/GhostButton";

export interface Step2HorizonProps {
  horizon: TimeHorizon;
  onHorizonChange: (horizon: TimeHorizon) => void;
  onNext: () => void;
  onBack: () => void;
}

interface HorizonOption {
  id: TimeHorizon;
  title: string;
  durationLabel: string;
  stance: string;
  description: string;
  recommended?: boolean;
}

const HORIZON_OPTIONS: HorizonOption[] = [
  {
    id: "1M",
    title: "1 Month",
    durationLabel: "30 Days",
    stance: "Tactical Stance",
    description: "Short-term liquidity preservation and fast regime-shift protection.",
  },
  {
    id: "3M",
    title: "3 Months",
    durationLabel: "Quarterly",
    stance: "Cyclical Focus",
    description: "Captures intermediate factor momentum without locking capital.",
  },
  {
    id: "6M",
    title: "6 Months",
    durationLabel: "Half-Year",
    stance: "Strategic Stance",
    description: "Balances market volatility with regime alpha and factor diversification.",
    recommended: true,
  },
  {
    id: "12M",
    title: "12 Months",
    durationLabel: "Annual",
    stance: "Compounding Horizon",
    description: "Long-term wealth compounding across full market regime cycles.",
  },
];

export const Step2Horizon: React.FC<Step2HorizonProps> = ({
  horizon,
  onHorizonChange,
  onNext,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Step 2: Time Horizon</span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
          Choose your investment horizon
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          QuantNiti adjusts risk factor weights and quantile projections based on your timeframe.
        </p>
      </div>

      {/* 2x2 Grid of Horizon Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {HORIZON_OPTIONS.map((opt) => {
          const isSelected = horizon === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onHorizonChange(opt.id)}
              aria-label={`${opt.title} - ${opt.stance}`}
              className={`relative p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-violet-600/20 border-violet-500 shadow-md shadow-violet-500/20 text-[var(--text-main)]"
                  : "bg-[var(--bg-card-subtle)] hover:border-violet-500/40 border-[var(--border-subtle)] text-[var(--text-main)]"
              }`}
            >
              {/* Top Row: Title + Badge/Check */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[var(--text-main)]">{opt.title}</span>
                    {opt.recommended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/25 border border-violet-400/30 text-[10px] font-semibold text-violet-600 dark:text-violet-300">
                        <Star className="w-2.5 h-2.5 fill-violet-600 dark:fill-violet-300" />
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400">{opt.stance}</span>
                </div>

                {/* Radio checkmark */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-violet-400 bg-violet-600 text-white"
                      : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {opt.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <GhostButton onClick={onBack} icon={<ChevronLeft className="w-4 h-4" />}>
          Back
        </GhostButton>

        <PrimaryButton onClick={onNext} icon={<ArrowRight className="w-4 h-4" />}>
          Continue to Persona
        </PrimaryButton>
      </div>
    </div>
  );
};
