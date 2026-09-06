import React, { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { formatRupees } from "../../utils/formatters";

ChartJS.register(ArcElement, Tooltip, Legend);

export interface AllocationItem {
  symbol: string;
  name?: string;
  weight: number; // e.g. 0.25 or 25
  allocated_amount?: number;
}

export interface AllocationDonutProps {
  allocations: AllocationItem[];
  totalInvested?: number;
  className?: string;
}

const PALETTE = [
  "#7C3AED", // Electric Violet
  "#6366F1", // Indigo
  "#A855F7", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#F43F5E", // Rose
];

export const AllocationDonut: React.FC<AllocationDonutProps> = ({
  allocations,
  totalInvested,
  className = "",
}) => {
  const chartData = useMemo(() => {
    const labels = allocations.map((a) => a.symbol);
    const data = allocations.map((a) => {
      const w = a.weight > 1 ? a.weight : a.weight * 100;
      return Number(w.toFixed(1));
    });

    const backgroundColor = allocations.map((_, i) => PALETTE[i % PALETTE.length]);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor: "rgba(15, 23, 42, 0.8)",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [allocations]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || "";
              const val = context.parsed || 0;
              return ` ${label}: ${val}%`;
            },
          },
        },
      },
    }),
    []
  );

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
        <Doughnut data={chartData} options={chartOptions} />
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Asset Mix
          </span>
          <span className="text-xs font-bold text-white">
            {totalInvested ? formatRupees(totalInvested) : `${allocations.length} Assets`}
          </span>
        </div>
      </div>
    </div>
  );
};
