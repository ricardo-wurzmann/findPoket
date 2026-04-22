import { useState, useEffect, useCallback } from 'react';
import { getSeries, type SeriesListItem } from '@/lib/api/series';

interface UseSeriesResult {
  series: SeriesListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSeries(): UseSeriesResult {
  const [series, setSeries] = useState<SeriesListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSeries();
      setSeries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar séries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { series, loading, error, refetch: fetch };
}
