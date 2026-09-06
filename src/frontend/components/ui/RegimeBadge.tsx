import React from "react";

export type MarketRegime = "BULL" | "BEAR" | "SIDEWAYS" | "NEUTRAL" | "HIGH_VOLATILITY" | string;

export interface RegimeBadgeProps {
  regime: MarketRegime;
  size?: "sm" | "md";
  showDot?: boolean;
  onClick?: () => void;
  className?: string;
}

export const RegimeBadge: React.FC<RegimeBadgeProps> = ({
  regime,
  size = "md",
  showDot = true,
  onClick,
  className = "",
}) => {
  const normalized = regime.toUpperCase();

  let colorClasses = "bg-violet-500/10 text-accent border-violet-500/20";
  let dotColor = "bg-accent";
  let displayLabel = regime;

  if (normalized.includes("BULL")) {
    colorClasses = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    dotColor = "bg-emerald-500";
    displayLabel = "Bull Market";
  } else if (normalized.includes("BEAR")) {
    colorClasses = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    dotColor = "bg-rose-500";
    displayLabel = "Bear Market";
  } else if (normalized.includes("SIDEWAYS") || normalized.includes("NEUTRAL")) {
    colorClasses = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    dotColor = "bg-amber-500";
    displayLabel = "Sideways / Range";
  } else if (normalized.includes("VOLATIL")) {
    colorClasses = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    dotColor = "bg-purple-500";
    displayLabel = "High Volatility";
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2.5 py-0.5 gap-1.5"
      : "text-xs px-3 py-1 gap-2";

  return (
    <span
      data-testid="regime-badge"
      role={onClick ? "button" : "status"}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center rounded-full font-semibold border backdrop-blur-sm transition-all duration-150 ${
        onClick ? "cursor-pointer hover:opacity-85" : ""
      } ${colorClasses} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
      )}
      <span>{displayLabel}</span>
    </span>
  );
};
