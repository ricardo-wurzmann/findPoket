"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface RealtimeCounts {
  [eventId: string]: number;
}

export function useRealtime(eventIds: string[]) {
  const [counts, setCounts] = useState<RealtimeCounts>({});
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (eventIds.length === 0) return;

    const supabase = createClient();

    const fetchInitialCounts = async () => {
      const initial: RealtimeCounts = {};
      await Promise.all(
        eventIds.map(async (id) => {
          const { count } = await supabase
            .from("Registration")
            .select("*", { count: "exact", head: true })
            .eq("eventId", id)
            .eq("status", "APPROVED");
          initial[id] = count ?? 0;
        })
      );
      setCounts(initial);
    };

    fetchInitialCounts();

    channelRef.current = supabase
      .channel("registrations-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Registration",
        },
        async (payload) => {
          const record = payload.new as { eventId?: string } | null;
          const oldRecord = payload.old as { eventId?: string } | null;
          const affectedEventId = record?.eventId ?? oldRecord?.eventId;

          if (affectedEventId && eventIds.includes(affectedEventId)) {
            const { count } = await supabase
              .from("Registration")
              .select("*", { count: "exact", head: true })
              .eq("eventId", affectedEventId)
              .eq("status", "APPROVED");

            setCounts((prev) => ({
              ...prev,
              [affectedEventId]: count ?? 0,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [eventIds.join(",")]);

  return counts;
}

export function useTickerRealtime() {
  const [totalLive, setTotalLive] = useState(0);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const fetchLive = async () => {
      const { count } = await supabase
        .from("Event")
        .select("*", { count: "exact", head: true })
        .eq("status", "LIVE");
      setTotalLive(count ?? 0);
    };

    fetchLive();

    const channel = supabase
      .channel("ticker-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Registration" },
        (payload) => {
          const record = payload.new as { eventId?: string };
          if (record.eventId) {
            setRecentActivity((prev) => [record.eventId!, ...prev].slice(0, 5));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { totalLive, recentActivity };
}
