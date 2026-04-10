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
  console.log('[getVenueById] Fetching:', `${API_URL}/api/venues/${id}`);
  const response = await fetch(`${API_URL}/api/venues/${id}`, { headers });
  console.log('[getVenueById] Response status:', response.status);

  if (!response.ok) {
    const body = await response.text();
    console.error('[getVenueById] Body:', body);
    throw new Error(`Failed to fetch venue: ${response.status}`);
  }

  const data = await response.json();
  return data.venue;
}
