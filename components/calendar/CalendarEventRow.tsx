"use client";

import { useState } from "react";
import type { Event } from "@/types";
import { EventModal } from "@/components/events/EventModal";
import { isEventLive } from "@/lib/calendar/is-event-live";

export interface CalendarEvent {
  id: string;
  name: string;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  buyIn: number | null;
  gtd?: number | null;
  isMajor: boolean;
  isPrivate: boolean;
  status: string;
  type: string;
  description: string | null;
  locationLabel: string | null;
  maxPlayers: number;
  venue: { id: string; name: string; district: string } | null;
  series?: { id: string; name: string; city: string } | null;
  _count?: { registrations: number };
  [key: string]: unknown;
}

interface CalendarEventRowProps {
  event: CalendarEvent;
}

export function CalendarEventRow({ event }: CalendarEventRowProps) {
  const [open, setOpen] = useState(false);
  const date = new Date(event.startsAt);
  const day = date.getDate();
  const month = date.toLocaleString("pt-BR", { month: "short" }).toUpperCase();
  const live = isEventLive({
    status: event.status,
    startsAt: new Date(event.startsAt),
    endsAt: event.endsAt ? new Date(event.endsAt) : null,
  });

  const modalEvent = event as unknown as Event;

  const locationLabel =
    event.venue?.name ??
    (event.series ? `${event.series.name} · ${event.series.city}` : null) ??
    event.locationLabel ??
    "Local a confirmar";

  return (
    <>
      <div
        className="cc cursor-pointer hover:bg-[#F5F4F1] transition-colors"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="cdate">
          <div className="cday">{day}</div>
          <div className="cmon">{month}</div>
        </div>
        <div className="cdiv" />
        <div className="ci">
          <div className="cseries flex flex-wrap items-center gap-2" style={{ color: "var(--green)" }}>
            {live && (
              <span className="tag px-1.5 py-0.5 rounded-sm bg-green/15 text-green border border-green/30">
                LIVE
              </span>
            )}
            <span>
              {event.isMajor ? "MAJOR" : event.type === "CASH_GAME" ? "CASH GAME" : "TORNEIO"}
            </span>
          </div>
          <div className="cname">{event.name}</div>
          <div className="cloc">{locationLabel}</div>
        </div>
        <div className="cprize">
          <div className="plbl">Buy-in</div>
          <div className="pval">
            {event.buyIn != null && event.buyIn > 0
              ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(event.buyIn)
              : "—"}
          </div>
        </div>
      </div>
      {open && <EventModal event={modalEvent} onClose={() => setOpen(false)} />}
    </>
  );
}
