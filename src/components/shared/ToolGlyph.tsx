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
    <span className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/concept-2-3d-isometric-icon.png"
        alt="Utilby"
        className="h-9 w-9 rounded-xl shadow-xs object-cover"
      />
      <span className="font-display text-[22px] font-extrabold tracking-tight text-ink">utilby</span>
    </span>
  );
}
