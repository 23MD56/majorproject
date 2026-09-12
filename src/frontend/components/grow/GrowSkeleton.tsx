import React from "react";
import { Loader2 } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

export const GrowSkeleton: React.FC = () => {
  return (
    <div data-testid="grow-skeleton" className="space-y-6 py-4 animate-pulse">
      {/* Header status */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-semibold">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600 dark:text-violet-400" />
          <span>Hierarchical Risk Parity Optimizing...</span>
        </div>
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800/80 rounded-lg"></div>
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>

      {/* Donut placeholder */}
      <GlassCard className="p-6 flex flex-col items-center justify-center bg-[var(--bg-card)] border-[var(--border-subtle)] min-h-[220px]">
        <div className="w-40 h-40 rounded-full border-8 border-violet-500/20 border-t-violet-500/60 animate-spin"></div>
        <div className="mt-4 h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </GlassCard>

      {/* Stats placeholder */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
        <div className="h-20 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
      </div>

      {/* Stock pills placeholder */}
      <div className="space-y-2">
        <div className="h-12 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800/60"></div>
        <div className="h-12 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800/60"></div>
        <div className="h-12 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800/60"></div>
      </div>
    </div>
  );
};
