"use client";

import { useMemo, useState } from "react";
import { format, isThisMonth, isThisWeek, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { formatMonthYear, cn } from "@/lib/utils";
import { CalendarEventRow, type CalendarEvent } from "@/components/calendar/CalendarEventRow";
import {
  CalendarFilters,
  emptyCalendarFilters,
  type CalendarAppliedFilters,
} from "@/components/calendar/CalendarFilters";
import { formatCashTableBlinds, formatCashTableBuyinRange } from "@/lib/cash-table-display";

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

type AgendaCashTable = {
  id: string;
  name: string;
  variant: string;
  blindType: string;
  sbValue: number | null;
  bbValue: number | null;
  btnValue: number | null;
  buyinMin: number | null;
  buyinMax: number | null;
  seats: number;
};

type CashGameGroup = {
  venue: { id: string; name: string; district: string; city: string };
  tables: AgendaCashTable[];
};

type TabKey = "tournaments" | "series" | "cash";
type SeriesTimeFilter = "today" | "week" | "month";

interface Props {
  events: CalendarEvent[];
  venues: VenueOpt[];
  seriesList: SeriesCard[];
  yearEventCount: number;
  cashGameGrouped: CashGameGroup[];
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

function seriesInTimeRange(s: SeriesCard, range: SeriesTimeFilter): boolean {
  const d = new Date(s.startsAt);
  if (range === "today") return isToday(d);
  if (range === "week") return isThisWeek(d, { locale: ptBR });
  return isThisMonth(d);
}

function variantBadgeClass(variant: string): string {
  if (variant === "NLH") return "border-green/40 text-green";
  if (variant === "PLO") return "border-amber/40 text-amber";
  if (variant === "PLO Hi-Lo") return "border-text/30 text-text";
  return "border-border text-text-muted";
}

export function CalendarAgendaClient({
  events,
  venues,
  seriesList,
  yearEventCount,
  cashGameGrouped,
}: Props) {
  const [tab, setTab] = useState<TabKey>("tournaments");
  const [applied, setApplied] = useState<CalendarAppliedFilters>(emptyCalendarFilters);
  const [seriesTime, setSeriesTime] = useState<SeriesTimeFilter>("week");

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

  const filteredSeries = useMemo(
    () => seriesList.filter((s) => seriesInTimeRange(s, seriesTime)),
    [seriesList, seriesTime]
  );

  const totalCashTables = useMemo(
    () => cashGameGrouped.reduce((acc, g) => acc + g.tables.length, 0),
    [cashGameGrouped]
  );

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

      <div className="border-b border-border bg-background px-6 py-3 flex flex-wrap gap-2">
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
        <button
          type="button"
          onClick={() => setTab("cash")}
          className={
            tab === "cash"
              ? "tag px-4 py-2 rounded-sm bg-text text-background"
              : "tag px-4 py-2 rounded-sm border border-border text-text-muted hover:text-text"
          }
        >
          Cash Game
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
        ) : tab === "series" ? (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {(
                [
                  { key: "today" as const, label: "Hoje" },
                  { key: "week" as const, label: "Esta semana" },
                  { key: "month" as const, label: "Este mês" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setSeriesTime(chip.key)}
                  className={
                    seriesTime === chip.key
                      ? "tag px-3 py-1.5 rounded-full bg-text text-background"
                      : "tag px-3 py-1.5 rounded-full border border-border text-text-muted hover:text-text"
                  }
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredSeries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-text-muted border border-border rounded-sm">
                  <span className="text-4xl mb-3 opacity-20">◆</span>
                  <p className="tag">Nenhuma série neste período</p>
                </div>
              ) : (
                filteredSeries.map((s) => (
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
          </>
        ) : totalCashTables === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted border border-border rounded-sm bg-background">
            <p className="tag">Nenhuma mesa de cash ativa no momento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cashGameGrouped.map((g) => (
              <Link
                key={g.venue.id}
                href={`/venues/${g.venue.id}`}
                className="block border border-border rounded-sm bg-background overflow-hidden hover:bg-[#F5F4F1] transition-colors cursor-pointer"
              >
                <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[13px] font-semibold text-text">{g.venue.name}</span>
                    <span className="tag text-text-muted ml-2">
                      {g.venue.district} · {g.venue.city}
                    </span>
                  </div>
                  <span className="tag border border-green/30 text-green px-2 py-0.5 rounded-sm">
                    {g.tables.length} {g.tables.length === 1 ? "mesa ativa" : "mesas ativas"}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {g.tables.map((t) => (
                    <div key={t.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "tag px-1.5 py-0.5 rounded-sm text-[10px] border shrink-0",
                            variantBadgeClass(t.variant)
                          )}
                        >
                          {t.variant}
                        </span>
                        <span className="text-[13px] font-medium truncate">{t.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 tag text-text-muted text-[11px] sm:ml-auto">
                        <span>{formatCashTableBlinds(t)}</span>
                        <span>{formatCashTableBuyinRange(t.buyinMin, t.buyinMax)}</span>
                        <span>{t.seats} lugares</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
