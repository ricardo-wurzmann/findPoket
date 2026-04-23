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

export type CashTableApiRow = {
  id: string;
  name: string;
  variant: string;
  blindType: string;
  sbValue: number | null;
  bbValue: number | null;
  btnValue: number | null;
  buyinMin: number | null;
  buyinMax: number | null;
  seats: number;
  notes?: string | null;
};

export type CashTableGroup = {
  venue: { id: string; name: string; district: string; city: string };
  tables: CashTableApiRow[];
};

export async function getCashTables(): Promise<CashTableGroup[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/cash-tables`, { headers });
  if (!res.ok) {
    throw new Error('Falha ao carregar mesas de cash');
  }
  const data = (await res.json()) as { grouped: CashTableGroup[] };
  return data.grouped ?? [];
}
