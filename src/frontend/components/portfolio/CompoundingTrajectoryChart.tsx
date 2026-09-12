import React, { useMemo, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { TrendingUp } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { CompoundingTrajectoryData } from "./demoPortfolioData";
import { formatRupees } from "../../utils/formatters";
import { useTheme } from "../../context/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CompoundingTrajectoryChartProps {
  trajectory: CompoundingTrajectoryData;
  isDemo?: boolean;
}

export const CompoundingTrajectoryChart: React.FC<CompoundingTrajectoryChartProps> = ({
  trajectory,
}) => {
  const chartRef = useRef<any>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    // Explicit cleanup on unmount
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.destroy?.();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const labels = useMemo(() => {
    return trajectory.yearly_trajectories.map((pt) => `Yr ${pt.year}`);
  }, [trajectory]);

  const chartData = useMemo(() => {
    const q90 = trajectory.yearly_trajectories.map((pt) => pt.gbm_optimistic_90th);
    const q50 = trajectory.yearly_trajectories.map((pt) => pt.gbm_base_50th);
    const q10 = trajectory.yearly_trajectories.map((pt) => pt.gbm_pessimistic_10th);
    const fd = trajectory.yearly_trajectories.map((pt) => pt.bank_fd_value);

    return {
      labels,
      datasets: [
        {
          label: "GBM 90th Percentile (Optimistic)",
          data: q90,
          borderColor: "rgba(16, 185, 129, 0.8)", // Emerald
          backgroundColor: "rgba(16, 185, 129, 0.08)",
          fill: "+1",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
        },
        {
          label: "GBM 50th Median (Base Case)",
          data: q50,
          borderColor: "rgba(139, 92, 246, 1)", // Electric Violet
          backgroundColor: "rgba(139, 92, 246, 0.15)",
          borderWidth: 3,
          pointRadius: 3,
          tension: 0.3,
        },
        {
          label: "GBM 10th Percentile (Pessimistic)",
          data: q10,
          borderColor: "rgba(244, 63, 94, 0.7)", // Rose
          backgroundColor: "rgba(244, 63, 94, 0.05)",
          borderWidth: 1.5,
          pointRadius: 2,
          borderDash: [3, 3],
          tension: 0.3,
        },
        {
          label: "7% Bank FD Hurdle",
          data: fd,
          borderColor: "rgba(245, 158, 11, 0.85)", // Amber
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 2,
          borderDash: [5, 5],
          tension: 0.1,
        },
      ],
    };
  }, [labels, trajectory]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: isDark ? "#94A3B8" : "#475569",
            font: {
              size: 10,
              family: "Inter, sans-serif",
              weight: 500,
            },
          },
        },
        tooltip: {
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
          titleColor: isDark ? "#F8FAFC" : "#0F172A",
          bodyColor: isDark ? "#CBD5E1" : "#334155",
          borderColor: "rgba(139, 92, 246, 0.3)",
          borderWidth: 1,
          padding: 10,
          titleFont: { size: 11, weight: "bold" as const },
          bodyFont: { size: 10 },
          callbacks: {
            label: (context: any) => {
              const val = context.parsed.y || 0;
              return ` ${context.dataset.label}: ₹${val.toLocaleString("en-IN")}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(124, 58, 237, 0.08)",
          },
          ticks: {
            color: isDark ? "#94A3B8" : "#64748B",
            font: { size: 10 },
          },
        },
        y: {
          grid: {
            color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(124, 58, 237, 0.08)",
          },
          ticks: {
            color: isDark ? "#94A3B8" : "#64748B",
            font: { size: 10 },
            callback: (val: any) => {
              if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
              if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
              if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
              return `₹${val}`;
            },
          },
        },
      },
    };
  }, [isDark]);

  const tenYearMedian =
    trajectory.yearly_trajectories[trajectory.yearly_trajectories.length - 1]
      ?.gbm_base_50th ?? 0;
  const tenYearFd =
    trajectory.yearly_trajectories[trajectory.yearly_trajectories.length - 1]
      ?.bank_fd_value ?? 0;
  const alphaVal = tenYearMedian - tenYearFd;

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              10-Year Compounding Wealth Trajectory
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Geometric Brownian Motion (GBM) simulation vs 7% Bank FD Hurdle
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[var(--text-muted)] block">10Y Alpha vs FD</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            +{formatRupees(alphaVal)}
          </span>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 sm:h-72 w-full pt-1">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Milestone / Legend Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
        <div className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] block">10Y Base Case (Q50)</span>
          <span className="font-bold text-accent">
            ₹{tenYearMedian.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] block">10Y 7% Bank FD</span>
          <span className="font-bold text-amber-600 dark:text-amber-300">
            ₹{tenYearFd.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] block">Monte Carlo Cones</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-300 text-[11px]">
            Q10 Pessimistic - Q90 Optimistic
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
