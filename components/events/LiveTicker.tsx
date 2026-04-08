"use client";

import { useTickerRealtime } from "@/hooks/useRealtime";
import type { Event } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface LiveTickerProps {
  events: Event[];
}

export function LiveTicker({ events }: LiveTickerProps) {
  const { totalLive } = useTickerRealtime();

  const liveEvents = events.filter((e) => e.status === "LIVE");
  const allItems = liveEvents.length > 0 ? liveEvents : events.slice(0, 5);

  const tickerContent = allItems
    .map(
      (e) =>
        `${e.status === "LIVE" ? "● AO VIVO" : "◆ EM BREVE"}   ${e.name}   ${e.venue?.name ?? e.locationLabel ?? ""}   ${formatCurrency(e.buyIn)} buy-in${e.gtd ? `   GTD ${formatCurrency(e.gtd)}` : ""}`
    )
    .join("     ·     ");

  if (allItems.length === 0) return null;

  return (
    <div
      className="h-9 bg-sidebar border-b border-sidebar-border overflow-hidden flex items-center"
      style={{ position: "relative" }}
    >
      <div className="ticker-inner flex items-center whitespace-nowrap gap-0">
        <span className="text-[10px] font-medium tracking-[0.12em] text-[#9B9690]">
          {tickerContent}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
        </span>
        <span className="text-[10px] font-medium tracking-[0.12em] text-[#9B9690]" aria-hidden>
          {tickerContent}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
        </span>
      </div>
      {totalLive > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center px-4 bg-sidebar border-l border-sidebar-border z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-green mr-2 animate-pulse" />
          <span className="text-[10px] font-medium text-green tracking-widest uppercase">
            {totalLive} ao vivo
          </span>
        </div>
      )}
    </div>
  );
}
