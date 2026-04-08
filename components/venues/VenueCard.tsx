"use client";

import { cn } from "@/lib/utils";
import type { Venue } from "@/types";

interface VenueCardProps {
  venue: Venue & { events?: { name: string; startsAt: Date; status: string }[] };
  onClick?: () => void;
}

function isOpenNow(openTime: string, closeTime: string): boolean {
  const now = new Date();
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  let closeMins = ch * 60 + cm;
  if (closeMins < openMins) closeMins += 24 * 60; // overnight
  const adjustedNow = nowMins < openMins ? nowMins + 24 * 60 : nowMins;
  return adjustedNow >= openMins && adjustedNow <= closeMins;
}

export function VenueCard({ venue, onClick }: VenueCardProps) {
  const open = isOpenNow(venue.openTime, venue.closeTime);
  const todayEvents = venue.events?.filter((e) => {
    const d = new Date(e.startsAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }) ?? [];

  return (
    <article
      onClick={onClick}
      className="border border-border bg-background p-4 cursor-pointer hover:border-[#B8B4AC] transition-all duration-150"
    >
      {/* Status */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            "tag",
            open ? "text-green" : "text-text-muted"
          )}
        >
          {open ? "● Aberto" : `Fecha às ${venue.closeTime}`}
        </span>
        <span className="tag text-text-muted">{venue.tableCount} mesas</span>
      </div>

      {/* Name */}
      <h3 className="text-[14px] font-semibold text-text mb-1">{venue.name}</h3>
      <p className="tag text-text-muted mb-4">{venue.district} · {venue.city}</p>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
        <div>
          <div className="tag text-text-muted">Abre</div>
          <div className="text-[12px] font-medium mt-0.5">{venue.openTime}</div>
        </div>
        <div>
          <div className="tag text-text-muted">Fecha</div>
          <div className="text-[12px] font-medium mt-0.5">{venue.closeTime}</div>
        </div>
      </div>

      {/* Today's events */}
      {todayEvents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="tag text-text-muted mb-1.5">Hoje</div>
          {todayEvents.slice(0, 2).map((e) => (
            <div key={e.name} className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted truncate">{e.name}</span>
              <span
                className={cn(
                  "tag ml-2 shrink-0",
                  e.status === "LIVE" ? "text-green" : "text-text-muted"
                )}
              >
                {e.status === "LIVE" ? "Ao Vivo" : "Em Breve"}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
