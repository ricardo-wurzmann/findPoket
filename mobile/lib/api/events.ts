import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

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

export interface EventFilters {
  city?: string;
  type?: string;
  onlyOpen?: boolean;
}

export async function getEvents(filters?: EventFilters): Promise<Event[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };

  const params = new URLSearchParams();
  if (filters?.city) params.set('city', filters.city);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.onlyOpen) params.set('onlyOpen', 'true');

  const query = params.toString() ? `?${params.toString()}` : '';

  console.log('[getEvents] Fetching from:', `${API_URL}/api/events${query}`);
  console.log('[getEvents] Has token:', !!session?.access_token);

  const response = await fetch(`${API_URL}/api/events${query}`, { headers });

  if (!response.ok) {
    const body = await response.text();
    console.error('[getEvents] HTTP', response.status, response.statusText);
    console.error('[getEvents] Body:', body);
    console.error('[getEvents] URL:', `${API_URL}/api/events${query}`);
    console.error('[getEvents] Had token:', !!headers['Authorization']);
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  const data = await response.json();
  return data.events;
}

export async function getEventById(id: string): Promise<Event> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/events/${id}`, { headers });

  if (!response.ok) throw new Error('Failed to fetch event');

  const data = await response.json();
  return data.event;
}

export async function declareInterest(eventId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/registrations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ eventId }),
  });

  if (!response.ok) throw new Error('Failed to declare interest');
}
