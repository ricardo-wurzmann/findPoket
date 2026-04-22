import { supabase } from '@/lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

export interface SeriesListItem {
  id: string;
  name: string;
  description: string | null;
  city: string;
  district: string | null;
  address: string;
  startsAt: string;
  endsAt: string | null;
  lat: number | null;
  lng: number | null;
  _count: { events: number };
  events?: Array<{ id: string; name: string; startsAt: string; buyIn: number; status: string; gtd: number | null }>;
}

export async function getSeries(): Promise<SeriesListItem[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/series`, { headers });
  if (!res.ok) throw new Error('Failed to fetch series');
  const data = (await res.json()) as { series: SeriesListItem[] };
  return data.series ?? [];
}

export async function getSeriesById(id: string): Promise<SeriesListItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/series/${encodeURIComponent(id)}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch series');
  const data = (await res.json()) as { series: SeriesListItem };
  return data.series;
}
