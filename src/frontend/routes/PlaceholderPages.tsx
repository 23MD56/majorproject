import { Sparkles, Compass, TrendingUp, PieChart } from "lucide-react";

export function HomePage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-squircle-lg p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
        <div className="flex items-center gap-2 text-accent mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">QuantNiti Dashboard</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
          Home Page
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
          Welcome to your personalized algorithmic intelligence dashboard. Active market regime tracking, quick actions, and automated insights.
        </p>
      </div>
    </div>
  );
}

export function ExplorePage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-squircle-lg p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
        <div className="flex items-center gap-2 text-accent mb-2">
          <Compass className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Market Discovery</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
          Explore Page
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
          Browse stock cards with visual regime suitability indicators, momentum scores, and Pro Tools backtesting.
        </p>
      </div>
    </div>
  );
}

export function GrowPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-squircle-lg p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
        <div className="flex items-center gap-2 text-accent mb-2">
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Guided Basket Builder</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
          Grow Page
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
          Multi-step guided flow to construct optimized portfolio baskets tailored to your capital, horizon, and risk persona.
        </p>
      </div>
    </div>
  );
}

export function PortfolioPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-squircle-lg p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
        <div className="flex items-center gap-2 text-accent mb-2">
          <PieChart className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Holdings & Analytics</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
          Portfolio Page
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
          Real-time tracking of your virtual paper baskets, rebalance recommendations, and historical performance charts.
        </p>
      </div>
    </div>
  );
}
