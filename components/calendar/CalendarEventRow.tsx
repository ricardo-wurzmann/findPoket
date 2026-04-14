"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Event } from "@/types";
import { EventModal } from "@/components/events/EventModal";
import { formatCurrency } from "@/lib/utils";

interface CalendarEventRowProps {
  event: Event;
  seriesBadge: { label: string; color: string } | null;
  isLive: boolean;
}

export function CalendarEventRow({ event, seriesBadge, isLive }: CalendarEventRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="w-12 shrink-0 text-center">
          <div className="font-cormorant italic text-3xl font-light text-text leading-none">
            {format(new Date(event.startsAt), "d")}
          </div>
          <div className="tag text-text-muted mt-0.5">
            {format(new Date(event.startsAt), "EEE", { locale: ptBR })}
          </div>
        </div>

        <div className="w-px h-10 bg-border shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isLive && (
              <span className="tag text-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
                Ao Vivo
              </span>
            )}
            {seriesBadge && (
              <span
                className="tag px-1.5 py-0.5 rounded-sm text-white"
                style={{ backgroundColor: seriesBadge.color }}
              >
                {seriesBadge.label}
              </span>
            )}
          </div>
          <div className="text-[13px] font-medium truncate">{event.name}</div>
          <div className="tag text-text-muted mt-0.5">
            {event.venue?.name ?? event.locationLabel ?? "Local a definir"}
          </div>
        </div>

        <div className="text-right shrink-0">
          {event.gtd != null && event.gtd > 0 && (
            <div className="font-cormorant italic text-xl font-light text-amber leading-none">
              {formatCurrency(event.gtd)}
            </div>
          )}
          <div className="tag text-text-muted mt-0.5">{formatCurrency(event.buyIn)} buy-in</div>
        </div>
      </div>

      {open && <EventModal event={event} onClose={() => setOpen(false)} />}
    </>
  );
}
