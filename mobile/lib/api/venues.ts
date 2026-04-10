import { supabase } from '@/lib/supabase';
import { Venue } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };
}

export async function getVenues(): Promise<Venue[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };

  console.log('[getVenues] Fetching from:', `${API_URL}/api/venues`);
  console.log('[getVenues] Has token:', !!session?.access_token);

  const response = await fetch(`${API_URL}/api/venues`, { headers });

  if (!response.ok) {
    const body = await response.text();
    console.error('[getVenues] HTTP', response.status, response.statusText);
    console.error('[getVenues] Body:', body);
    console.error('[getVenues] URL:', `${API_URL}/api/venues`);
    console.error('[getVenues] Had token:', !!headers['Authorization']);
    throw new Error(`Failed to fetch venues: ${response.status}`);
  }

  const data = await response.json();
  return data.venues;
}

export async function getVenueById(id: string): Promise<Venue> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/venues/${id}`, { headers });

  if (!response.ok) throw new Error('Failed to fetch venue');

  const data = await response.json();
  return data.venue;
}
