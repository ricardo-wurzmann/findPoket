import { supabase } from '@/lib/supabase';
import { SearchResults } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };
}

export async function search(query: string): Promise<SearchResults> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_URL}/api/search?q=${encodeURIComponent(query)}`,
    { headers }
  );

  if (!response.ok) throw new Error('Search failed');

  return response.json();
}
