import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-indigo-50 text-indigo-700",
    secondary: "bg-slate-100 text-slate-700",
    success: "bg-sec-soft text-emerald-800",
    outline: "border border-slate-300 text-slate-700",
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
