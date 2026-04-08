"use client";

import { useState, useEffect, useCallback } from "react";
import type { Event } from "@/types";

interface UseEventsOptions {
  city?: string;
  type?: string;
  onlyOpen?: boolean;
}

export function useEvents(options: UseEventsOptions = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.city) params.set("city", options.city);
      if (options.type) params.set("type", options.type);
      if (options.onlyOpen) params.set("onlyOpen", "true");

      const res = await fetch(`/api/events?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar eventos");
      const data = await res.json();
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [options.city, options.type, options.onlyOpen]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}
