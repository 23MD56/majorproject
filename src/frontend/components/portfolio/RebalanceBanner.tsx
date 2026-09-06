import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { PrimaryButton } from "../ui/PrimaryButton";

interface RebalanceBannerProps {
  portfolioId: string;
  isRebalanceRecommended: boolean;
  triggerReason?: string;
  onApplyRebalance: () => Promise<void> | void;
  isApplying?: boolean;
}

export const RebalanceBanner: React.FC<RebalanceBannerProps> = ({
  isRebalanceRecommended,
  triggerReason = "Market regime drift detected. Rebalancing can optimize risk-adjusted returns.",
  onApplyRebalance,
  isApplying = false,
}) => {
  if (!isRebalanceRecommended) return null;

  return (
    <GlassCard className="p-4 bg-amber-950/30 border-amber-500/40 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Regime-Shift Rebalance Recommended
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {triggerReason}
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <PrimaryButton
          onClick={onApplyRebalance}
          disabled={isApplying}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isApplying ? "animate-spin" : ""}`} />}
          className="text-xs py-2 px-3.5 bg-amber-600 hover:bg-amber-500 text-white"
        >
          {isApplying ? "Rebalancing..." : "Apply Rebalance"}
        </PrimaryButton>
      </div>
    </GlassCard>
  );
};
