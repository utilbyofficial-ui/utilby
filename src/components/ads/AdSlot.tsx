"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import { ADS_ENABLED, ADSENSE_CLIENT, ADSENSE_SLOT } from "@/lib/ads-config";

/** Google AdSense slot. Renders nothing until AdSense is configured (see lib/ads-config.ts). */
interface AdSlotProps {
  slotId?: string;
  format?: "horizontal-banner" | "rectangle" | "auto";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ format = "horizontal-banner", className }: AdSlotProps) {
  const pushed = React.useRef(false);

  React.useEffect(() => {
    if (!ADS_ENABLED || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers or a not-yet-loaded script: fail silently.
    }
  }, []);

  if (!ADS_ENABLED) return null;

  // Reserve height to prevent layout shift (CLS) while the ad loads.
  const reserve = {
    "horizontal-banner": "min-h-[100px] max-w-4xl",
    rectangle: "min-h-[250px] max-w-sm",
    auto: "min-h-[100px]",
  }[format];

  return (
    <div className={cn("my-10 flex flex-col items-center", className)}>
      <span className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Advertisement</span>
      <ins
        className={cn("adsbygoogle block w-full", reserve)}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format={format === "rectangle" ? "rectangle" : "auto"}
        data-full-width-responsive="true"
      />
    </div>
  );
}
