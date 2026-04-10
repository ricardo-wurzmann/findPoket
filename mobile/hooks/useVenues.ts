import { useState, useEffect, useCallback } from 'react';
import { getVenues } from '@/lib/api/venues';
import { Venue } from '@/types';

interface UseVenuesResult {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVenues(): UseVenuesResult {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVenues();
      setVenues(data);
    } catch (err) {
      console.error('[useVenues] Failed to fetch venues:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar casas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { venues, loading, error, refetch: fetch };
}
