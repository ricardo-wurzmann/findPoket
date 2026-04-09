"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useEvents } from "@/hooks/useEvents";
import { useRealtime } from "@/hooks/useRealtime";
import { EventList } from "@/components/events/EventList";
import { EventModal } from "@/components/events/EventModal";
import { VenueModal } from "@/components/venues/VenueModal";
import { MapSkeleton } from "@/components/map/MapSkeleton";
import { cn } from "@/lib/utils";
import type { Event, EventFilter, ViewMode, Venue } from "@/types";
import type { MapVenue } from "@/components/map/EventMap";

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

const filters: { id: EventFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "TOURNAMENT", label: "Torneio" },
  { id: "CASH_GAME", label: "Cash Game" },
  { id: "HOME_GAME", label: "Home Game" },
  { id: "open", label: "Abertos" },
];

type VenueWithEvents = Venue & { events?: Event[] };

export default function FeedPage() {
  const [view, setView] = useState<ViewMode>("map");
  const [city, setCity] = useState("São Paulo");
  const [filter, setFilter] = useState<EventFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenueWithEvents | null>(null);
  const [venues, setVenues] = useState<MapVenue[]>([]);
  const [venueMap, setVenueMap] = useState<Record<string, VenueWithEvents>>({});

  const { events, loading } = useEvents({
    city,
    type: filter !== "all" && filter !== "open" ? filter : undefined,
    onlyOpen: filter === "open",
  });

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const realtimeCounts = useRealtime(eventIds);

  // Fetch venues once for the map
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch("/api/venues");
        if (!res.ok) return;
        const data = await res.json();
        const allVenues: VenueWithEvents[] = data.venues ?? [];
        const map: Record<string, VenueWithEvents> = {};
        const pins: MapVenue[] = [];
        for (const v of allVenues) {
          map[v.id] = v;
          if (v.lat && v.lng) {
            pins.push({
              id: v.id,
              name: v.name,
              lat: v.lat,
              lng: v.lng,
              district: v.district,
              city: v.city,
            });
          }
        }
        setVenueMap(map);
        setVenues(pins);
      } catch {
        // ignore
      }
    };
    fetchVenues();
  }, []);

  const handleVenueSelect = (venueId: string) => {
    const venue = venueMap[venueId];
    if (venue) setSelectedVenue(venue);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background px-4 lg:px-6 py-4 pl-16 lg:pl-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[15px] font-semibold text-text">Eventos de Poker</h1>
            <p className="tag text-text-muted mt-0.5">
              {loading
                ? "Carregando..."
                : `${events.length} eventos em ${city}`}
            </p>
          </div>
          {/* Card fan SVG */}
          <svg width="64" height="48" viewBox="0 0 64 48" fill="none" className="opacity-20 shrink-0">
            <rect x="2" y="20" width="24" height="34" rx="2" stroke="#1E1D1A" strokeWidth="1.5" transform="rotate(-20 2 20)" />
            <rect x="20" y="14" width="24" height="34" rx="2" stroke="#1E1D1A" strokeWidth="1.5" transform="rotate(-5 20 14)" />
            <rect x="38" y="16" width="24" height="34" rx="2" stroke="#1E1D1A" strokeWidth="1.5" transform="rotate(12 38 16)" />
          </svg>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* City selector */}
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-border bg-background text-text text-[12px] px-3 py-1.5 rounded-sm focus:border-[#B8B4AC] transition-colors cursor-pointer appearance-none pr-7"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231E1D1A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 6px center",
            }}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            {filters.map((f) => (
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

          {/* View toggle */}
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

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "map" ? (
          <div className="h-full">
            <EventMap
              events={events}
              venues={venues}
              selectedEvent={selectedEvent}
              onEventSelect={setSelectedEvent}
              onVenueSelect={handleVenueSelect}
              city={city}
            />
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

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        registeredCount={selectedEvent ? realtimeCounts[selectedEvent.id] : undefined}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Venue Modal */}
      <VenueModal
        venue={selectedVenue}
        onClose={() => setSelectedVenue(null)}
      />
    </div>
  );
}
