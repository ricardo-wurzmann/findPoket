import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Colors } from '@/constants/colors';
import { useEvents } from '@/hooks/useEvents';
import { useSeries } from '@/hooks/useSeries';
import { EventCard } from '@/components/events/EventCard';
import { filterEventsByTime } from '@/lib/utils';
import { TimeFilter, Event } from '@/types';
import type { SeriesListItem } from '@/lib/api/series';

const TIME_CHIPS: { key: TimeFilter; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mês' },
];

type TabKey = 'tournaments' | 'series';

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('tournaments');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const { events, loading, error, refetch } = useEvents();
  const { series, loading: seriesLoading, error: seriesError, refetch: refetchSeries } = useSeries();
  const [refreshing, setRefreshing] = useState(false);

  const filtered = filterEventsByTime(events, timeFilter);

  const onRefresh = async () => {
    setRefreshing(true);
    if (tab === 'tournaments') await refetch();
    else await refetchSeries();
    setRefreshing(false);
  };

  const renderEvent = ({ item }: { item: Event }) => <EventCard event={item} />;

  const renderSeries = ({ item }: { item: SeriesListItem }) => (
    <TouchableOpacity
      style={styles.seriesCard}
      activeOpacity={0.75}
      onPress={() => router.push(`/series/${item.id}`)}
    >
      <Text style={styles.seriesName}>{item.name}</Text>
      <Text style={styles.seriesMeta}>
        {format(new Date(item.startsAt), "d MMM yyyy", { locale: ptBR })}
        {item.endsAt ? ` — ${format(new Date(item.endsAt), 'd MMM yyyy', { locale: ptBR })}` : ''}
      </Text>
      <Text style={styles.seriesLoc}>
        {item.city}
        {item.district ? ` · ${item.district}` : ''}
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item._count.events} torneios</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.count}>
          {tab === 'tournaments' ? `${filtered.length} eventos` : `${series.length} séries`}
        </Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'tournaments' && styles.tabActive]}
          onPress={() => setTab('tournaments')}
        >
          <Text style={[styles.tabText, tab === 'tournaments' && styles.tabTextActive]}>Torneios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'series' && styles.tabActive]}
          onPress={() => setTab('series')}
        >
          <Text style={[styles.tabText, tab === 'series' && styles.tabTextActive]}>Séries</Text>
        </TouchableOpacity>
      </View>

      {tab === 'tournaments' && (
        <View style={styles.chipRow}>
          {TIME_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.key}
              activeOpacity={0.7}
              style={[styles.chip, timeFilter === chip.key && styles.chipActive]}
              onPress={() => setTimeFilter(chip.key)}
            >
              <Text style={[styles.chipText, timeFilter === chip.key && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {tab === 'tournaments' ? (
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.green} size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>Nenhum torneio encontrado.</Text>
              </View>
            }
          />
        )
      ) : seriesLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.green} size="large" />
        </View>
      ) : seriesError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{seriesError}</Text>
        </View>
      ) : (
        <FlatList
          data={series}
          keyExtractor={(item) => item.id}
          renderItem={renderSeries}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nenhuma série encontrada.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: { fontSize: 28, fontWeight: '700', fontStyle: 'italic', color: Colors.white },
  count: { fontSize: 13, color: Colors.textMuted },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: { backgroundColor: Colors.white },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.dark },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: Colors.white },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.dark },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: '#F87171', fontSize: 14 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  seriesCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  seriesName: { fontSize: 16, fontWeight: '700', color: Colors.white },
  seriesMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  seriesLoc: { fontSize: 12, color: '#9b9690', marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(217,119,6,0.25)',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FBBF24' },
});
