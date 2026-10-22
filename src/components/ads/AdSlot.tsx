import * as React from "react";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  slotId?: string;
  format?: "horizontal-banner" | "rectangle" | "auto";
  className?: string;
}

export function AdSlot({ slotId = "placeholder-slot", format = "horizontal-banner", className }: AdSlotProps) {
  // Height reservations to prevent Cumulative Layout Shift (CLS)
  const formatStyles = {
    "horizontal-banner": "min-h-[90px] md:min-h-[100px] w-full max-w-4xl",
    rectangle: "min-h-[250px] w-full max-w-sm",
    auto: "min-h-[100px] w-full",
  };

  return (
    <div className={cn("my-8 flex flex-col items-center justify-center", className)}>
      <span className="mb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
        Advertisement
      </span>
      <div
        className={cn(
          "flex items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center",
          formatStyles[format]
        )}
      >
        <span className="text-xs text-slate-400 select-none">
          Ad Space ({slotId}) • Reserved for Google AdSense
        </span>
      </div>
    </div>
  );
}
