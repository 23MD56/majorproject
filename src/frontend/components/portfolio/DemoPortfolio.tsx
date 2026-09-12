import React from "react";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { PortfolioHeroCard } from "./PortfolioHeroCard";
import { HoldingsTable } from "./HoldingsTable";
import { CompoundingTrajectoryChart } from "./CompoundingTrajectoryChart";
import { PrimaryButton } from "../ui/PrimaryButton";
import { GlassCard } from "../ui/GlassCard";
import {
  getDemoPortfolio,
  getDemoCompoundingTrajectory,
} from "./demoPortfolioData";

interface DemoPortfolioProps {
  onNavigateToGrow: () => void;
}

export const DemoPortfolio: React.FC<DemoPortfolioProps> = ({
  onNavigateToGrow,
}) => {
  const demoPortfolio = getDemoPortfolio();
  const demoTrajectory = getDemoCompoundingTrajectory(demoPortfolio.current_value);

  return (
    <div className="space-y-5">
      {/* 1. Prominent persistent visual banner */}
      <GlassCard className="p-4 bg-violet-500/10 dark:bg-gradient-to-r dark:from-violet-950/50 dark:via-purple-950/40 dark:to-slate-900/60 border border-violet-500/25 dark:border-violet-500/40 shadow-lg shadow-violet-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-accent shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                This is a demo portfolio
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                See what automated MTM tracking and compounding trajectories look like.
              </p>
            </div>
          </div>

          <PrimaryButton
            onClick={onNavigateToGrow}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs py-2 px-3.5 shrink-0 self-start sm:self-center whitespace-nowrap"
          >
            Build Your Own →
          </PrimaryButton>
        </div>
      </GlassCard>

      {/* 2. Hero Card */}
      <PortfolioHeroCard portfolio={demoPortfolio} isDemo={true} />

      {/* 3. Holdings Table */}
      <HoldingsTable holdings={demoPortfolio.holdings} isDemo={true} />

      {/* 4. Compounding Trajectory Chart */}
      <CompoundingTrajectoryChart trajectory={demoTrajectory} isDemo={true} />

      {/* 5. Bottom CTA card */}
      <GlassCard className="p-6 text-center space-y-3 bg-violet-500/5 dark:bg-violet-950/20 border-violet-500/20">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-500/20 flex items-center justify-center text-accent">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[var(--text-main)]">
            Ready to track your own investments?
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            Run the Grow tab wizard to discover an AI-tailored equity basket or create a custom virtual paper portfolio in 1-click.
          </p>
        </div>
        <div className="pt-2">
          <PrimaryButton
            onClick={onNavigateToGrow}
            icon={<ArrowRight className="w-4 h-4" />}
            className="mx-auto"
          >
            Start Building with Grow
          </PrimaryButton>
        </div>
      </GlassCard>
    </div>
  );
};
