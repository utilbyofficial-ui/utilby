import * as React from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES, toolGlyph } from "@/lib/category-style";
import type { ToolMeta } from "@/lib/tools-registry";

const SIZES = {
  sm: "h-9 w-9 rounded-xl text-[11px]",
  md: "h-12 w-12 rounded-2xl text-[13px]",
  lg: "h-14 w-14 rounded-[18px] text-base",
  xl: "h-16 w-16 rounded-[20px] text-lg",
};

/** The colored category tile with a short glyph — Utilby's icon language. */
export function ToolGlyph({
  tool,
  size = "md",
  className,
}: {
  tool: Pick<ToolMeta, "id" | "category">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const style = CATEGORY_STYLES[tool.category];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 select-none items-center justify-center font-display font-extrabold leading-none text-ink",
        style.solid,
        SIZES[size],
        className
      )}
    >
      <span className={toolGlyph(tool).length === 1 ? "text-[1.6em] font-bold" : undefined}>{toolGlyph(tool)}</span>
    </span>
  );
}

export function CategoryGlyph({ category, size = "lg", className }: { category: ToolMeta["category"]; size?: keyof typeof SIZES; className?: string }) {
  const style = CATEGORY_STYLES[category];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 select-none items-center justify-center font-display font-extrabold leading-none text-ink",
        style.solid,
        SIZES[size],
        className
      )}
    >
      {style.glyph}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 64 64"
        width="30"
        height="30"
        className="h-[30px] w-[30px] shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M15 14 V34 C15 43.4 22.6 51 32 51 C41.4 51 49 43.4 49 34 V14"
          stroke="#16141F"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <circle cx="32" cy="34" r="10" fill="#FFC53D" />
      </svg>
      <span className="font-display text-[22px] font-extrabold tracking-tight text-ink">utilby</span>
    </span>
  );
}
