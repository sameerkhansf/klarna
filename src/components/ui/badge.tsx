import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
        variant === "default"
          ? "bg-brand-blue text-brand-white"
          : "border border-gray-300 text-gray-700 bg-white",
        className
      )}
    >
      {children}
    </span>
  );
};
