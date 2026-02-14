"use client";

import { useEffect, useRef } from "react";
import { monetizationConfig } from "@/config/monetization";

interface AdSlotProps {
  slot: keyof typeof monetizationConfig.adsense.slots;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

export function AdSlot({ slot, format = "auto", className }: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const publisherId = monetizationConfig.adsense.publisherId;
  const slotId = monetizationConfig.adsense.slots[slot];

  useEffect(() => {
    if (!publisherId || !slotId) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded
    }
  }, [publisherId, slotId]);

  if (!publisherId || !slotId) {
    // Placeholder in development
    return (
      <div className={`bg-gray-100 border border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-sm ${className}`}>
        <div className="p-4 text-center">
          <p>Ad Slot: {slot}</p>
          <p className="text-xs">Configure AdSense to display ads</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
