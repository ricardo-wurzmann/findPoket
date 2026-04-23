import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { supabase, clearInvalidLocalSession, isRefreshTokenAuthError } from '@/lib/supabase';
import { MenuProvider } from '@/lib/MenuContext';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applySession = (next: Session | null) => {
      setSession(next);
      setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error && isRefreshTokenAuthError(error)) {
          await clearInvalidLocalSession();
          applySession(null);
          return;
        }
        if (error) {
          console.warn('[auth] getSession:', error.message);
        }
        applySession(session ?? null);
      })
      .catch(async (e) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (isRefreshTokenAuthError({ message: msg })) {
          await clearInvalidLocalSession();
        }
        applySession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MenuProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="organizer" />
          <Stack.Screen name="events/[id]" />
          <Stack.Screen name="venues/[id]" />
          <Stack.Screen name="series/[id]" />
        </Stack>
        </MenuProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
