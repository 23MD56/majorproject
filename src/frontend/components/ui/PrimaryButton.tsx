import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

export interface PrimaryButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      disabled={isDisabled}
      type={type}
      className={`relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 active:from-violet-700 active:to-indigo-600 shadow-md shadow-violet-500/25 disabled:opacity-60 disabled:pointer-events-none disabled:shadow-none transition-all duration-150 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </motion.button>
  );
};
