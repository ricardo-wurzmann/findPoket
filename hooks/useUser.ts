"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface DBUser {
  id: string;
  email: string;
  name: string;
  handle: string | null;
  city: string | null;
  role: "PLAYER" | "ORGANIZER";
  bio: string | null;
  avatarUrl: string | null;
}

interface UseUserReturn {
  supabaseUser: SupabaseUser | null;
  dbUser: DBUser | null;
  loading: boolean;
  isOrganizer: boolean;
}

export function useUser(): UseUserReturn {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSupabaseUser(user);

      if (user) {
        try {
          const res = await fetch("/api/me");
          if (res.ok) {
            const data = await res.json();
            setDbUser(data.user);
          }
        } catch {
          // ignore
        }
      }

      setLoading(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (!session?.user) {
        setDbUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    supabaseUser,
    dbUser,
    loading,
    isOrganizer: dbUser?.role === "ORGANIZER",
  };
}
