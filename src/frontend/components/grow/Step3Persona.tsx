import React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Scale,
  Rocket,
  Leaf,
  Check,
  ChevronLeft,
  ArrowRight,
  Sliders,
  Info,
} from "lucide-react";
import { RiskPersona } from "../../store/useAppStore";
import { PrimaryButton } from "../ui/PrimaryButton";
import { GhostButton } from "../ui/GhostButton";

export interface Step3PersonaProps {
  riskPersona: RiskPersona;
  onPersonaChange: (persona: RiskPersona) => void;
  onNext: () => void;
  onBack: () => void;
}

interface PersonaCardDef {
  id: RiskPersona;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tolerance: string;
  guardrail: string;
  colorClass: string;
}

const PERSONAS: PersonaCardDef[] = [
  {
    id: "Conservative",
    name: "Conservative",
    icon: ShieldCheck,
    tolerance:
      "Capital preservation first. Allocates heavily to G-Secs, Debt ETFs, and low-beta equities.",
    guardrail: "< 6% Max Drawdown",
    colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "Balanced",
    name: "Balanced",
    icon: Scale,
    tolerance:
      "Disciplined regime adaptation seeking solid risk-adjusted returns with balanced equity weights.",
    guardrail: "8–12% Max Drawdown",
    colorClass: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  },
  {
    id: "Aggressive",
    name: "Aggressive",
    icon: Rocket,
    tolerance:
      "Maximum upside compounding. High tolerance for cyclical volatility and aggressive factor tilts.",
    guardrail: "15–20% Max Drawdown",
    colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "ESG-Conscious",
    name: "ESG-Conscious",
    icon: Leaf,
    tolerance:
      "Sustainable factor investing filtering strictly for top-tier ESG scores and clean governance.",
    guardrail: "10–14% Max Drawdown",
    colorClass: "text-teal-400 bg-teal-500/10 border-teal-500/30",
  },
];

export const Step3Persona: React.FC<Step3PersonaProps> = ({
  riskPersona,
  onPersonaChange,
  onNext,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5" />
          <span>Step 3: Risk Persona</span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
          Select your risk tolerance
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          Dictates asset allocation bounds and maximum tolerable drawdown thresholds.
        </p>
      </div>

      {/* Advisory notice */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-700 dark:text-violet-300">
        <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
        <span>Pre-selected from your onboarding preferences. Feel free to adjust anytime.</span>
      </div>

      {/* 4 Vertical Persona Cards */}
      <div className="space-y-3">
        {PERSONAS.map((p) => {
          const isSelected = riskPersona === p.id;
          const IconComp = p.icon;
          return (
            <motion.button
              key={p.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onPersonaChange(p.id)}
              aria-label={`${p.name} - ${p.guardrail}`}
              className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between gap-3.5 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-violet-600/20 border-violet-500 shadow-md shadow-violet-500/20 text-[var(--text-main)]"
                  : "bg-[var(--bg-card-subtle)] hover:border-violet-500/40 border-[var(--border-subtle)] text-[var(--text-main)]"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${p.colorClass}`}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[var(--text-main)]">{p.name}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {p.guardrail}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm">
                    {p.tolerance}
                  </p>
                </div>
              </div>

              {/* Selection radio check */}
              <div
                className={`w-5 h-5 mt-1 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "border-violet-400 bg-violet-600 text-white"
                    : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
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
          Review & Generate
        </PrimaryButton>
      </div>
    </div>
  );
};
