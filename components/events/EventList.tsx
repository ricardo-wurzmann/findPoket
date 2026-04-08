"use client";

import { useState } from "react";
import { EventCard } from "./EventCard";
import { cn } from "@/lib/utils";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import type { Event, TimeFilter } from "@/types";

interface EventListProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  realtimeCounts?: { [eventId: string]: number };
}

const tabs: { id: TimeFilter; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "week", label: "Esta Semana" },
  { id: "month", label: "Este Mês" },
];

export function EventList({ events, onEventSelect, realtimeCounts }: EventListProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");

  const filtered = events.filter((e) => {
    const d = new Date(e.startsAt);
    if (timeFilter === "today") return isToday(d) || e.status === "LIVE";
    if (timeFilter === "week") return isThisWeek(d, { weekStartsOn: 1 });
    return isThisMonth(d);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border bg-background sticky top-0 z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTimeFilter(tab.id)}
            className={cn(
              "px-5 py-3 tag transition-colors duration-150 border-b-[2px]",
              timeFilter === tab.id
                ? "text-text border-text"
                : "text-text-muted border-transparent hover:text-text"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted">
            <span className="text-2xl mb-2 opacity-30">♠</span>
            <p className="tag">Nenhum evento neste período</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => onEventSelect(event)}
                registeredCount={realtimeCounts?.[event.id]}
                style={{ animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
