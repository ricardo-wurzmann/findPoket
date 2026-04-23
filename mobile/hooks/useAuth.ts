import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { supabase, clearInvalidLocalSession, isRefreshTokenAuthError } from '@/lib/supabase';
import { User } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface AuthState {
  user: ReturnType<typeof supabase.auth.getUser> extends Promise<infer T> ? T['data']['user'] : null;
  dbUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth() {
  const [supaUser, setSupaUser] = useState<AuthState['user']>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDbUser = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      }
    } catch {
      // silently fail — guest mode
    }
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error && isRefreshTokenAuthError(error)) {
          await clearInvalidLocalSession();
          setSupaUser(null);
          setDbUser(null);
          setLoading(false);
          return;
        }
        setSupaUser(session?.user ?? null);
        if (session?.access_token) {
          fetchDbUser(session.access_token).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(async (e) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (isRefreshTokenAuthError({ message: msg })) {
          await clearInvalidLocalSession();
        }
        setSupaUser(null);
        setDbUser(null);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupaUser(session?.user ?? null);
      if (session?.access_token) {
        fetchDbUser(session.access_token);
      } else {
        setDbUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchDbUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSupaUser(null);
    setDbUser(null);
    router.replace('/(auth)/login');
  }, []);

  return { user: supaUser, dbUser, loading, signOut };
}
