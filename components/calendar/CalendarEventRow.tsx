"use client";

import { useState } from "react";
import type { Event } from "@/types";
import { EventModal } from "@/components/events/EventModal";

export interface CalendarEvent {
  id: string;
  name: string;
  startsAt: Date | string;
  buyIn: number | null;
  isMajor: boolean;
  isPrivate: boolean;
  status: string;
  type: string;
  description: string | null;
  locationLabel: string | null;
  maxPlayers: number;
  venue: { id: string; name: string; district: string } | null;
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

  const modalEvent = event as unknown as Event;

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
          <div className="cseries" style={{ color: "var(--green)" }}>
            {event.isMajor ? "MAJOR" : event.type === "CASH_GAME" ? "CASH GAME" : "TORNEIO"}
          </div>
          <div className="cname">{event.name}</div>
          <div className="cloc">
            {event.venue?.name ?? event.locationLabel ?? "Local a confirmar"}
          </div>
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
