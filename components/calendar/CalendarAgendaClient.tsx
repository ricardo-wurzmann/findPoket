"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { CalendarEventRow, type CalendarEvent } from "@/components/calendar/CalendarEventRow";
import {
  CalendarFilters,
  emptyCalendarFilters,
  type CalendarAppliedFilters,
} from "@/components/calendar/CalendarFilters";

type SeriesCard = {
  id: string;
  name: string;
  city: string;
  district: string | null;
  address: string;
  startsAt: string;
  endsAt: string | null;
  _count: { events: number };
};

type VenueOpt = { id: string; name: string; city: string; district: string };

interface Props {
  events: CalendarEvent[];
  venues: VenueOpt[];
  seriesList: SeriesCard[];
  yearEventCount: number;
}

function passesFilters(event: CalendarEvent, f: CalendarAppliedFilters): boolean {
  const buyIn = event.buyIn ?? 0;
  const gtd = event.gtd ?? null;

  if (f.buyInMin != null && buyIn < f.buyInMin) return false;
  if (f.buyInMax != null && buyIn > f.buyInMax) return false;

  if (f.gtdMin != null) {
    if (gtd == null || gtd < f.gtdMin) return false;
  }
  if (f.gtdMax != null) {
    if (gtd == null || gtd > f.gtdMax) return false;
  }

  if (f.venueId && event.venue?.id !== f.venueId) return false;
  if (f.seriesId && event.series?.id !== f.seriesId) return false;

  return true;
}

export function CalendarAgendaClient({ events, venues, seriesList, yearEventCount }: Props) {
  const [tab, setTab] = useState<"tournaments" | "series">("tournaments");
  const [applied, setApplied] = useState<CalendarAppliedFilters>(emptyCalendarFilters);

  const filteredEvents = useMemo(
    () => events.filter((e) => passesFilters(e, applied)),
    [events, applied]
  );

  const grouped = useMemo(() => {
    const sorted = [...filteredEvents].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    const map: Record<string, CalendarEvent[]> = {};
    sorted.forEach((e) => {
      const key = format(new Date(e.startsAt), "yyyy-MM");
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    const keys = Object.keys(map).sort();
    return keys.map((k) => ({ key: k, events: map[k] }));
  }, [filteredEvents]);

  const seriesOpts = useMemo(() => seriesList.map((s) => ({ id: s.id, name: s.name })), [seriesList]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b border-border bg-background px-6 py-5">
        <h1 className="text-[15px] font-semibold mb-1">Agenda de Torneios</h1>
        <p className="tag text-text-muted">Calendário de eventos poker no Brasil</p>
      </div>

      <div className="border-b border-border bg-surface px-6 py-4">
        <div className="tag text-text-muted mb-1">Eventos em {new Date().getFullYear()}</div>
        <div className="font-cormorant italic text-3xl font-light text-text">{yearEventCount}</div>
      </div>

      <div className="border-b border-border bg-background px-6 py-3 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("tournaments")}
          className={
            tab === "tournaments"
              ? "tag px-4 py-2 rounded-sm bg-text text-background"
              : "tag px-4 py-2 rounded-sm border border-border text-text-muted hover:text-text"
          }
        >
          Torneios
        </button>
        <button
          type="button"
          onClick={() => setTab("series")}
          className={
            tab === "series"
              ? "tag px-4 py-2 rounded-sm bg-text text-background"
              : "tag px-4 py-2 rounded-sm border border-border text-text-muted hover:text-text"
          }
        >
          Séries
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {tab === "tournaments" ? (
          <>
            <CalendarFilters
              venues={venues}
              series={seriesOpts}
              applied={applied}
              onApply={setApplied}
              onClear={() => setApplied(emptyCalendarFilters)}
            />

            {grouped.map(({ key, events: monthEvents }) => {
              const monthDate = new Date(key + "-01");
              return (
                <div key={key} className="mb-8">
                  <h2 className="tag text-text-muted mb-4 capitalize">{formatMonthYear(monthDate)}</h2>
                  <div className="divide-y divide-border border border-border rounded-sm">
                    {monthEvents.map((event) => (
                      <CalendarEventRow key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              );
            })}

            {grouped.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-text-muted">
                <span className="text-4xl mb-3 opacity-20">♦</span>
                <p className="tag">Nenhum evento encontrado</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {seriesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-text-muted border border-border rounded-sm">
                <span className="text-4xl mb-3 opacity-20">◆</span>
                <p className="tag">Nenhuma série ativa</p>
              </div>
            ) : (
              seriesList.map((s) => (
                <Link
                  key={s.id}
                  href={`/series/${s.id}`}
                  className="cc block hover:bg-[#F5F4F1] transition-colors"
                >
                  <div className="cdate">
                    <div className="cday text-[11px] leading-tight">
                      {format(new Date(s.startsAt), "d", { locale: ptBR })}
                    </div>
                    <div className="cmon text-[9px]">
                      {format(new Date(s.startsAt), "MMM", { locale: ptBR }).toUpperCase()}
                    </div>
                  </div>
                  <div className="cdiv" />
                  <div className="ci">
                    <div className="cseries text-text-muted tag">Série</div>
                    <div className="cname font-semibold">{s.name}</div>
                    <div className="cloc">
                      {s.city}
                      {s.district ? ` · ${s.district}` : ""} · {s.address}
                    </div>
                  </div>
                  <div className="cprize">
                    <div className="plbl">Torneios</div>
                    <div className="pval tag">{s._count.events}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
