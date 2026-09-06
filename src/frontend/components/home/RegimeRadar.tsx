import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Radar, Sparkles } from "lucide-react";
import { GlassCard, RegimeBadge } from "../ui";
import { useAppStore } from "../../store/useAppStore";
import { useAbortableRequest } from "../../hooks/useAbortableRequest";

export interface RegimeRadarProps {
  className?: string;
}

export const RegimeRadar: React.FC<RegimeRadarProps> = ({ className = "" }) => {
  const { activeRegime, setActiveRegime } = useAppStore();
  const { request } = useAbortableRequest();

  useEffect(() => {
    if (!activeRegime) {
      const fetchRegime = async () => {
        try {
          const data = await request<any>("home-regime", "/api/v1/regime/current");
          if (data) {
            setActiveRegime(data);
          }
        } catch {
          // Store default fallback
          setActiveRegime({
            regime: "BULL",
            probabilities: { BULL: 0.65, SIDEWAYS: 0.25, BEAR: 0.1 },
            confidence: 0.82,
            description: "Macro momentum strong with sustained institutional buying.",
          });
        }
      };
      fetchRegime();
    }
  }, [activeRegime, setActiveRegime, request]);

  const regimeName = activeRegime?.regime || "BULL";
  const probs = activeRegime?.probabilities || { BULL: 0.65, SIDEWAYS: 0.25, BEAR: 0.1 };
  const bullPct = Math.round((probs.BULL || 0.65) * 100);
  const sidewaysPct = Math.round((probs.SIDEWAYS || 0.25) * 100);
  const bearPct = Math.round((probs.BEAR || 0.1) * 100);
  const description =
    activeRegime?.description ||
    "Algorithmic classifier identifies active expansion regime. High growth probability with controlled macro volatility.";

  return (
    <GlassCard className={`p-5 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Radar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-[var(--text-main)]">
              Market Regime Radar
            </h3>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              4-State Machine Learning Classifier
            </span>
          </div>
        </div>

        <RegimeBadge regime={regimeName} size="sm" />
      </div>

      {/* Probability Bars */}
      <div className="flex flex-col gap-2.5 pt-1">
        {/* Bull Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">Bull Market</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{bullPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-emerald-500/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${bullPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-emerald-500"
            />
          </div>
        </div>

        {/* Sideways Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-amber-600 dark:text-amber-400">Sideways / Neutral</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">{sidewaysPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-amber-500/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sidewaysPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="h-full rounded-full bg-amber-500"
            />
          </div>
        </div>

        {/* Bear Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-rose-600 dark:text-rose-400">Bear Market</span>
            <span className="font-mono text-rose-600 dark:text-rose-400">{bearPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-rose-500/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${bearPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full bg-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Description Snippet */}
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] leading-relaxed">
        <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <span>{description}</span>
      </div>
    </GlassCard>
  );
};
