import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Destination =
  | '/(auth)/login'
  | '/(tabs)'
  | '/organizer/dashboard';

export default function Index() {
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setDestination('/(auth)/login');
        return;
      }

      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/me`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        const data = await res.json();
        if (data.user?.role === 'ORGANIZER') {
          setDestination('/organizer/dashboard');
        } else {
          setDestination('/(tabs)');
        }
      } catch {
        setDestination('/(tabs)');
      }
    };

    check();
  }, []);

  if (!destination) return null;
  return <Redirect href={destination} />;
}
