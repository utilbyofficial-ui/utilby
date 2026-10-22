import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 select-none cursor-pointer active:scale-[0.98]";

    const variants = {
      primary: "bg-ink text-white hover:bg-ink-soft shadow-soft",
      secondary: "bg-slate-100 text-ink hover:bg-slate-200",
      outline: "border border-slate-300 bg-white text-ink hover:border-ink/40 hover:bg-slate-50",
      ghost: "text-slate-700 hover:bg-slate-100 hover:text-ink",
      danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-soft",
    };

    const sizes = {
      sm: "h-9 px-3.5 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-[52px] px-6 text-base gap-2.5 rounded-2xl",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
