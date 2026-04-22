"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import type { Event } from "@/types";
import { EventModal } from "@/components/events/EventModal";

type RowEvent = Event & {
  _count?: { registrations: number };
};

interface OrganizerLite {
  id: string;
  name: string;
  handle: string | null;
}

interface SeriesPlayerViewProps {
  series: {
    id: string;
    name: string;
    description: string | null;
    address: string;
    city: string;
    district: string | null;
    startsAt: string;
    endsAt: string | null;
    organizer: OrganizerLite;
    events: RowEvent[];
  };
}

export function SeriesPlayerView({ series }: SeriesPlayerViewProps) {
  const [open, setOpen] = useState<Event | null>(null);
  const dateRange = `${format(new Date(series.startsAt), "d MMM yyyy", { locale: ptBR })}${
    series.endsAt
      ? ` → ${format(new Date(series.endsAt), "d MMM yyyy", { locale: ptBR })}`
      : ""
  }`;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sidebar text-white px-6 py-8 border-b border-sidebar-border">
        <h1 className="text-[20px] font-semibold mb-2">{series.name}</h1>
        <p className="tag text-[#9B9690] mb-3">{dateRange}</p>
        <p className="text-[13px] text-[#C4BFBA] leading-relaxed">
          {series.address}
          {series.district ? ` · ${series.district}` : ""} · {series.city}
        </p>
        <p className="tag text-[#6B6660] mt-4">
          Organizador: {series.organizer.name}
          {series.organizer.handle ? ` @${series.organizer.handle}` : ""}
        </p>
      </div>

      <div className="flex-1 bg-background px-6 py-6">
        <h2 className="tag text-text-muted mb-4">Torneios</h2>
        <div className="divide-y divide-border border border-border rounded-sm">
          {series.events.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => setOpen(ev)}
              className="cc w-full text-left hover:bg-[#F5F4F1] transition-colors"
            >
              <div className="cdate">
                <div className="cday">{format(new Date(ev.startsAt), "d", { locale: ptBR })}</div>
                <div className="cmon">
                  {format(new Date(ev.startsAt), "MMM", { locale: ptBR }).toUpperCase()}
                </div>
              </div>
              <div className="cdiv" />
              <div className="ci">
                <div className="cname">{ev.name}</div>
                <div className="cloc tag text-text-muted">
                  {ev.gtd != null && ev.gtd > 0 ? `GTD ${formatCurrency(ev.gtd)}` : "—"}
                </div>
              </div>
              <div className="cprize">
                <div className="plbl">Buy-in</div>
                <div className="pval">
                  {ev.buyIn > 0 ? formatCurrency(ev.buyIn) : "—"}
                </div>
              </div>
            </button>
          ))}
        </div>

        {series.events.length === 0 && (
          <p className="tag text-text-muted py-8 text-center">Nenhum torneio nesta série.</p>
        )}
      </div>

      {open && <EventModal event={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
