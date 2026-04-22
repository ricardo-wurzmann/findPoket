"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEvents } from "@/hooks/useEvents";
import { useRealtime } from "@/hooks/useRealtime";
import { EventList } from "@/components/events/EventList";
import { EventModal } from "@/components/events/EventModal";
import { MapSkeleton } from "@/components/map/MapSkeleton";
import { cn } from "@/lib/utils";
import type { Event, EventFilter, ViewMode, Venue } from "@/types";
import type { MapVenue, MapSeriesPin } from "@/components/map/EventMap";

const EventMap = dynamic(
  () => import("@/components/map/EventMap").then((m) => ({ default: m.EventMap })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

const CITIES = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
  "Porto Alegre",
  "Foz do Iguaçu",
  "Gramado",
  "Balneário Camboriú",
];

const FILTERS: { id: EventFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "venues", label: "Casas" },
  { id: "series", label: "Séries" },
];

type VenueWithMeta = Venue & {
  events?: Event[];
  _count?: { events?: number; interests?: number };
};

type SeriesRow = {
  id: string;
  name: string;
  city: string;
  district: string | null;
  address: string;
  startsAt: string;
  endsAt: string | null;
  lat: number | null;
  lng: number | null;
  _count?: { events: number };
};

function isOpenNow(openTime: string, closeTime: string): boolean {
  const now = new Date();
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  let closeMins = ch * 60 + cm;
  if (closeMins < openMins) closeMins += 24 * 60;
  const adjusted = nowMins < openMins ? nowMins + 24 * 60 : nowMins;
  return adjusted >= openMins && adjusted <= closeMins;
}

export default function FeedPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("map");
  const [city, setCity] = useState("São Paulo");
  const [filter, setFilter] = useState<EventFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [venues, setVenues] = useState<MapVenue[]>([]);
  const [allVenues, setAllVenues] = useState<VenueWithMeta[]>([]);
  const [seriesRows, setSeriesRows] = useState<SeriesRow[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(true);

  const needEvents = view === "list" && filter !== "venues" && filter !== "series";

  const { events, loading: eventsLoading } = useEvents({
    city,
    enabled: needEvents,
  });

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const realtimeCounts = useRealtime(eventIds);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch("/api/venues");
        if (!res.ok) return;
        const data = await res.json();
        const fetched: VenueWithMeta[] = data.venues ?? [];
        setAllVenues(fetched);
        setVenues(
          fetched
            .filter((v) => v.lat && v.lng)
            .map((v) => ({
              id: v.id,
              name: v.name,
              lat: v.lat,
              lng: v.lng,
              district: v.district,
              city: v.city,
            }))
        );
      } catch {
        // ignore
      }
    };
    fetchVenues();
  }, []);

  useEffect(() => {
    const loadSeries = async () => {
      setSeriesLoading(true);
      try {
        const res = await fetch("/api/series");
        if (!res.ok) return;
        const data = await res.json();
        setSeriesRows(data.series ?? []);
      } catch {
        // ignore
      } finally {
        setSeriesLoading(false);
      }
    };
    loadSeries();
  }, []);

  const seriesPins: MapSeriesPin[] = useMemo(
    () =>
      seriesRows
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => ({
          id: s.id,
          name: s.name,
          lat: s.lat!,
          lng: s.lng!,
          city: s.city,
          district: s.district,
        })),
    [seriesRows]
  );

  const mapVenues: MapVenue[] =
    filter === "series" ? [] : venues;

  const mapSeriesPins: MapSeriesPin[] =
    filter === "venues" ? [] : seriesPins;

  const loading = needEvents ? eventsLoading : false;
  const mapLoading = seriesLoading;

  const headerCount =
    filter === "venues"
      ? `${allVenues.length} casas cadastradas`
      : filter === "series"
        ? `${seriesRows.length} séries`
        : `${venues.length + seriesPins.length} locais no mapa`;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b border-border bg-background px-4 lg:px-6 py-4 pl-16 lg:pl-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[15px] font-semibold text-text">Poker em {city}</h1>
            <p className="tag text-text-muted mt-0.5">
              {view === "map"
                ? mapLoading
                  ? "Carregando..."
                  : headerCount
                : loading
                  ? "Carregando..."
                  : filter === "venues"
                    ? `${allVenues.length} casas cadastradas`
                    : filter === "series"
                      ? `${seriesRows.length} séries`
                      : `${events.length} eventos`}
            </p>
          </div>
          <svg width="64" height="48" viewBox="0 0 64 48" fill="none" className="opacity-20 shrink-0">
            <rect x="2" y="20" width="24" height="34" rx="2" stroke="#1E1D1A" strokeWidth="1.5" transform="rotate(-20 2 20)" />
            <rect x="20" y="14" width="24" height="34" rx="2" stroke="#1E1D1A" strokeWidth="1.5" transform="rotate(-5 20 14)" />
            <rect x="38" y="16" width="24" height="34" rx="2" stroke="#1E1D1A" strokeWidth="1.5" transform="rotate(12 38 16)" />
          </svg>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-border bg-background text-text text-[12px] px-3 py-1.5 rounded-sm focus:border-[#B8B4AC] transition-colors cursor-pointer appearance-none pr-7"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231E1D1A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 6px center",
            }}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 tag rounded-sm border transition-all duration-150",
                  filter === f.id
                    ? "bg-text text-background border-text"
                    : "border-border text-text-muted hover:border-[#B8B4AC] hover:text-text"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex border border-border rounded-sm overflow-hidden shrink-0">
            <button
              onClick={() => setView("map")}
              className={cn(
                "px-3 py-1.5 tag transition-all duration-150",
                view === "map" ? "bg-text text-background" : "text-text-muted hover:text-text"
              )}
            >
              Mapa
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "px-3 py-1.5 tag border-l border-border transition-all duration-150",
                view === "list" ? "bg-text text-background" : "text-text-muted hover:text-text"
              )}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === "map" ? (
          <div className="h-full">
            <EventMap venues={mapVenues} seriesPins={mapSeriesPins} city={city} />
          </div>
        ) : filter === "venues" ? (
          <div className="h-full overflow-y-auto">
            {allVenues.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-text-muted">
                <span className="text-4xl mb-3 opacity-20">◉</span>
                <p className="tag">Nenhuma casa cadastrada</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allVenues.map((venue) => {
                  const open = isOpenNow(venue.openTime, venue.closeTime);
                  const todayEvents =
                    venue.events?.filter((e) => {
                      const d = new Date(e.startsAt);
                      const today = new Date();
                      return d.toDateString() === today.toDateString();
                    }) ?? [];
                  const tournamentCount = venue._count?.events ?? 0;
                  return (
                    <button
                      key={venue.id}
                      onClick={() => router.push(`/venues/${venue.id}`)}
                      className="w-full text-left flex items-center gap-4 px-6 py-4 hover:bg-surface transition-colors"
                    >
                      <div
                        className={cn("w-2 h-2 rounded-full shrink-0", open ? "bg-green" : "bg-border")}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{venue.name}</div>
                        <div className="tag text-text-muted mt-0.5">
                          {venue.district} · {venue.openTime}–{venue.closeTime}
                        </div>
                        {todayEvents.length > 0 && (
                          <div className="tag text-amber mt-0.5">{todayEvents[0].name}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="tag text-text-muted">{venue.tableCount} mesas</div>
                        {tournamentCount > 0 && (
                          <div className="tag text-amber mt-0.5">
                            {tournamentCount} torneio{tournamentCount !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : filter === "series" ? (
          <div className="h-full overflow-y-auto divide-y divide-border">
            {seriesRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-text-muted px-6">
                <span className="text-4xl mb-3 opacity-20">◆</span>
                <p className="tag">Nenhuma série ativa</p>
              </div>
            ) : (
              seriesRows.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/series/${s.id}`)}
                  className="w-full text-left flex items-center justify-between gap-4 px-6 py-4 hover:bg-surface transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold truncate">{s.name}</div>
                    <div className="tag text-text-muted mt-0.5">
                      {s.city}
                      {s.district ? ` · ${s.district}` : ""}
                    </div>
                  </div>
                  <div className="tag text-amber shrink-0">
                    {s._count?.events ?? 0} torneio{(s._count?.events ?? 0) !== 1 ? "s" : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="h-full overflow-hidden">
            <EventList
              events={events}
              onEventSelect={setSelectedEvent}
              realtimeCounts={realtimeCounts}
            />
          </div>
        )}
      </div>

      <EventModal
        event={selectedEvent}
        registeredCount={selectedEvent ? realtimeCounts[selectedEvent.id] : undefined}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
