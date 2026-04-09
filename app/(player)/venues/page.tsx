"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VenueCard } from "@/components/venues/VenueCard";
import type { Venue, Event } from "@/types";

type VenueWithMeta = Venue & {
  events?: Event[];
  _count?: { events?: number; interests?: number };
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

export default function VenuesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<VenueWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch("/api/venues");
        if (res.ok) {
          const data = await res.json();
          setVenues(data.venues);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  const openCount = venues.filter((v) => isOpenNow(v.openTime, v.closeTime)).length;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-5 pl-16 lg:pl-6">
        <h1 className="text-[15px] font-semibold mb-1">Casas de Poker</h1>
        <p className="tag text-text-muted">Clubes e salas de poker cadastrados</p>
      </div>

      {/* Status strip */}
      <div className="border-b border-border bg-surface grid grid-cols-2 divide-x divide-border">
        <div className="px-6 py-4">
          <div className="tag text-text-muted mb-1">Abertas Agora</div>
          <div className="flex items-baseline gap-2">
            <div className="font-cormorant italic text-3xl font-light text-green">{openCount}</div>
            {openCount > 0 && <span className="w-2 h-2 rounded-full bg-green animate-pulse" />}
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="tag text-text-muted mb-1">Total de Casas</div>
          <div className="font-cormorant italic text-3xl font-light text-text">{venues.length}</div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-border bg-surface h-40 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onClick={() => router.push(`/venues/${venue.id}`)}
              />
            ))}
          </div>
        )}

        {!loading && venues.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted">
            <span className="text-4xl mb-3 opacity-20">◉</span>
            <p className="tag">Nenhuma casa cadastrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
