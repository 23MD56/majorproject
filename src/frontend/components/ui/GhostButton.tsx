import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface GhostButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  icon,
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}) => {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm text-accent hover:bg-violet-500/10 active:bg-violet-500/15 disabled:opacity-50 disabled:pointer-events-none transition-colors duration-150 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  );
};
