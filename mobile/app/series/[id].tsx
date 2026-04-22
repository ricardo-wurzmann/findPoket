import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Colors } from '@/constants/colors';
import { getSeriesById, type SeriesListItem } from '@/lib/api/series';
import { formatCurrency } from '@/lib/utils';

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [series, setSeries] = useState<SeriesListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await getSeriesById(id);
        if (!cancelled) setSeries(s);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const events = series?.events ?? [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          {loading ? (
            <ActivityIndicator color={Colors.green} style={{ marginTop: 24 }} />
          ) : error || !series ? (
            <Text style={styles.err}>{error ?? 'Série não encontrada'}</Text>
          ) : (
            <>
              <Text style={styles.title}>{series.name}</Text>
              <Text style={styles.meta}>
                {format(new Date(series.startsAt), "d MMM yyyy", { locale: ptBR })}
                {series.endsAt
                  ? ` → ${format(new Date(series.endsAt), 'd MMM yyyy', { locale: ptBR })}`
                  : ''}
              </Text>
              <Text style={styles.loc}>
                {series.address} · {series.city}
              </Text>
            </>
          )}
        </View>

        {!loading && series && (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => router.push(`/events/${item.id}`)}
              >
                <View style={styles.dateCol}>
                  <Text style={styles.day}>{format(new Date(item.startsAt), 'd', { locale: ptBR })}</Text>
                  <Text style={styles.mon}>
                    {format(new Date(item.startsAt), 'MMM', { locale: ptBR }).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.div} />
                <View style={styles.body}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.buy}>{formatCurrency(item.buyIn)}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhum torneio nesta série.</Text>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    backgroundColor: '#1a1917',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2926',
  },
  back: { paddingVertical: 8, alignSelf: 'flex-start' },
  backText: { color: Colors.textMuted, fontSize: 18 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 8,
  },
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },
  loc: { fontSize: 12, color: '#9b9690', marginTop: 8, lineHeight: 18 },
  err: { color: '#F87171', marginTop: 16 },
  list: { padding: 16, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2926',
  },
  dateCol: { width: 44, alignItems: 'center' },
  day: { fontSize: 22, fontStyle: 'italic', fontFamily: 'Georgia', color: Colors.white },
  mon: { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' },
  div: { width: 1, height: 40, backgroundColor: '#2a2926', marginHorizontal: 12 },
  body: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.white },
  buy: { fontSize: 13, color: Colors.green, marginTop: 4 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 32 },
});
