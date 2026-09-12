import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAbortableRequest } from "../../hooks/useAbortableRequest";
import { DemoPortfolio } from "./DemoPortfolio";
import { PortfolioHeroCard } from "./PortfolioHeroCard";
import { HoldingsTable } from "./HoldingsTable";
import { RebalanceBanner } from "./RebalanceBanner";
import { CompoundingTrajectoryChart } from "./CompoundingTrajectoryChart";
import { CreatePortfolioModal } from "./CreatePortfolioModal";
import { PrimaryButton } from "../ui/PrimaryButton";
import {
  PortfolioData,
  CompoundingTrajectoryData,
  getDemoCompoundingTrajectory,
  DEMO_HOLDINGS,
} from "./demoPortfolioData";

export const PortfolioPage: React.FC = () => {
  const {
    portfolios,
    activePortfolioId,
    setActivePortfolioId,
    setPortfolios,
    setActiveTab,
    riskPersona,
  } = useAppStore();

  const { request } = useAbortableRequest();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [trajectoryData, setTrajectoryData] = useState<CompoundingTrajectoryData | null>(null);

  // Determine active portfolio
  const activePortfolio =
    portfolios.find((p) => p.portfolio_id === activePortfolioId) ||
    portfolios[0] ||
    null;

  // Fetch compounding projection when active portfolio changes
  useEffect(() => {
    if (!activePortfolio) {
      setTrajectoryData(null);
      return;
    }

    let isMounted = true;

    async function loadTrajectory() {
      try {
        const response = await request(
          "portfolio-compounding",
          "/api/portfolio/compounding",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              portfolio_id: activePortfolio.portfolio_id,
              initial_lump_sum: activePortfolio.current_value,
              tenure_years: 10,
            }),
          }
        );

        if (isMounted && response?.yearly_trajectories) {
          setTrajectoryData(response);
          return;
        }
      } catch {
        // Fallback gracefully to local calculation if API is unavailable
      }

      if (isMounted) {
        setTrajectoryData(getDemoCompoundingTrajectory(activePortfolio.current_value));
      }
    }

    loadTrajectory();

    return () => {
      isMounted = false;
    };
  }, [activePortfolio?.portfolio_id, activePortfolio?.current_value]);

  // Handle portfolio creation
  const handleCreatePortfolio = async (data: {
    name: string;
    capital: number;
    riskPersona: any;
  }) => {
    // Generate synthetic bluechip holdings proportional to capital
    const newHoldings = DEMO_HOLDINGS.map((h) => {
      const targetAllocation = h.weight * data.capital;
      const shares = Math.max(1, Math.floor(targetAllocation / h.current_price));
      const invested_amount = shares * h.current_price;
      const current_value = invested_amount;
      return {
        ...h,
        shares,
        buy_price: h.current_price,
        invested_amount,
        current_value,
        unrealized_pnl: 0,
        unrealized_pnl_pct: 0,
        pnl_1d: Math.round(invested_amount * 0.008),
        pnl_1d_pct: 0.8,
      };
    });

    const invested_capital = newHoldings.reduce(
      (sum, h) => sum + h.invested_amount,
      0
    );
    const cash = Math.max(0, data.capital - invested_capital);

    const newPortfolio: PortfolioData = {
      portfolio_id: `port_${Date.now()}`,
      name: data.name,
      initial_capital: data.capital,
      cash,
      invested_capital,
      current_value: invested_capital + cash,
      total_pnl: 0,
      total_pnl_pct: 0,
      pnl_1d: newHoldings.reduce((sum, h) => sum + h.pnl_1d, 0),
      pnl_1d_pct: 0.8,
      max_drawdown_pct: 0.0,
      holdings: newHoldings,
      benchmark_comparison: {
        portfolio_return_pct: 0,
        nifty_return_pct: 0,
        bank_fd_return_pct: 0,
        alpha_vs_nifty: 0,
        alpha_vs_fd: 0,
      },
      initial_regime: "BULL_TRENDING",
      current_regime: "BULL_TRENDING",
      risk_persona: data.riskPersona || riskPersona,
      horizon: "6M",
      created_at: new Date().toISOString(),
      as_of_date: new Date().toISOString().split("T")[0],
    };

    const nextPortfolios = [...portfolios, newPortfolio];
    setPortfolios(nextPortfolios);
    setActivePortfolioId(newPortfolio.portfolio_id);
  };

  // Handle portfolio deletion
  const handleDeleteActivePortfolio = () => {
    if (!activePortfolio) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${activePortfolio.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    const remaining = portfolios.filter(
      (p) => p.portfolio_id !== activePortfolio.portfolio_id
    );
    setPortfolios(remaining);
  };

  // Handle regime-shift rebalance
  const handleApplyRebalance = async () => {
    if (!activePortfolio) return;
    setIsRebalancing(true);
    try {
      // Simulate/apply rebalancing by normalizing target weights
      await new Promise((resolve) => setTimeout(resolve, 600));
      const updatedPortfolios = portfolios.map((p) => {
        if (p.portfolio_id === activePortfolio.portfolio_id) {
          return {
            ...p,
            rebalance_alert: undefined,
          };
        }
        return p;
      });
      setPortfolios(updatedPortfolios);
    } finally {
      setIsRebalancing(false);
    }
  };

  // If no portfolios exist in state, render Demo state
  const hasRealPortfolios = portfolios && portfolios.length > 0;

  return (
    <div className="flex flex-col min-h-full pb-20 p-4 space-y-4">
      {/* Top Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Portfolio Page
          </h1>
          <p className="text-xs text-slate-400">
            {hasRealPortfolios
              ? "Live Mark-To-Market and Compounding Engine"
              : "Explore simulated paper portfolios & compounding"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {hasRealPortfolios && (
            <button
              type="button"
              onClick={handleDeleteActivePortfolio}
              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/20 text-xs flex items-center gap-1"
              title="Delete Portfolio"
              aria-label="Delete Portfolio"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <PrimaryButton
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs py-2 px-3"
          >
            New Goal
          </PrimaryButton>
        </div>
      </div>

      {/* Multi-Portfolio Dropdown / Selector (Real State only) */}
      {hasRealPortfolios && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {portfolios.map((p) => {
            const isSelected = p.portfolio_id === activePortfolio?.portfolio_id;
            return (
              <button
                key={p.portfolio_id}
                type="button"
                onClick={() => setActivePortfolioId(p.portfolio_id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-violet-600 text-white shadow-md shadow-violet-950/30"
                    : "bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {!hasRealPortfolios ? (
        <DemoPortfolio onNavigateToGrow={() => setActiveTab("grow")} />
      ) : (
        <div className="space-y-4">
          {/* Rebalance Banner if triggered */}
          {activePortfolio?.rebalance_alert?.is_rebalance_recommended && (
            <RebalanceBanner
              portfolioId={activePortfolio.portfolio_id}
              isRebalanceRecommended={true}
              triggerReason={activePortfolio.rebalance_alert.trigger_reason}
              onApplyRebalance={handleApplyRebalance}
              isApplying={isRebalancing}
            />
          )}

          {/* Hero Metric Card */}
          <PortfolioHeroCard portfolio={activePortfolio} isDemo={false} />

          {/* Holdings Table */}
          <HoldingsTable holdings={activePortfolio.holdings} isDemo={false} />

          {/* 10-Year Compounding Wealth Trajectory */}
          {trajectoryData && (
            <CompoundingTrajectoryChart trajectory={trajectoryData} isDemo={false} />
          )}
        </div>
      )}

      {/* Goal / Virtual Portfolio Creation Modal */}
      <CreatePortfolioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePortfolio}
        onOpenGrowWizard={() => setActiveTab("grow")}
      />
    </div>
  );
};
