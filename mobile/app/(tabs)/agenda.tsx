import React, { useCallback, useEffect, useState } from 'react';
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
import { filterEventsByTime, filterByStartsAtTime } from '@/lib/utils';
import { TimeFilter, Event } from '@/types';
import type { SeriesListItem } from '@/lib/api/series';
import { getCashTables, type CashTableGroup, type CashTableApiRow } from '@/lib/api/cashTables';
import { formatCashTableBlinds, formatCashTableBuyinRange } from '@/lib/cashTableDisplay';

const TIME_CHIPS: { key: TimeFilter; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mês' },
];

type TabKey = 'tournaments' | 'series' | 'cash';

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('tournaments');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const { events, loading, error, refetch } = useEvents();
  const { series, loading: seriesLoading, error: seriesError, refetch: refetchSeries } = useSeries();
  const [refreshing, setRefreshing] = useState(false);
  const [cashGroups, setCashGroups] = useState<CashTableGroup[]>([]);
  const [cashLoading, setCashLoading] = useState(false);
  const [cashError, setCashError] = useState<string | null>(null);

  const filtered = filterEventsByTime(events, timeFilter);
  const filteredSeries = filterByStartsAtTime(series, timeFilter);

  const loadCash = useCallback(async () => {
    setCashLoading(true);
    setCashError(null);
    try {
      const g = await getCashTables();
      setCashGroups(g);
    } catch (e) {
      setCashError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setCashLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'cash') void loadCash();
  }, [tab, loadCash]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (tab === 'tournaments') await refetch();
    else if (tab === 'series') await refetchSeries();
    else await loadCash();
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
        {format(new Date(item.startsAt), 'd MMM yyyy', { locale: ptBR })}
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

  const totalCashTables = cashGroups.reduce((a, g) => a + g.tables.length, 0);

  const renderCashVenue = ({ item }: { item: CashTableGroup }) => (
    <TouchableOpacity
      style={styles.cashVenueCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/venues/${item.venue.id}`)}
    >
      <View style={styles.cashVenueHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cashVenueTitle}>{item.venue.name}</Text>
          <Text style={styles.cashVenueSub}>
            {item.venue.district} · {item.venue.city}
          </Text>
        </View>
        <View style={styles.cashVenueBadge}>
          <Text style={styles.cashVenueBadgeText}>
            {item.tables.length} {item.tables.length === 1 ? 'mesa ativa' : 'mesas ativas'}
          </Text>
        </View>
      </View>
      {item.tables.map((t: CashTableApiRow) => (
        <View key={t.id} style={styles.cashTableRow}>
          <View style={styles.cashTableTop}>
            <View style={styles.variantPill}>
              <Text style={styles.variantPillText}>{t.variant}</Text>
            </View>
            <Text style={styles.cashTableName}>{t.name}</Text>
          </View>
          <Text style={styles.cashTableMeta}>
            {formatCashTableBlinds(t)} · {formatCashTableBuyinRange(t.buyinMin, t.buyinMax)} · {t.seats}{' '}
            lugares
          </Text>
        </View>
      ))}
    </TouchableOpacity>
  );

  const headerCount =
    tab === 'tournaments'
      ? `${filtered.length} eventos`
      : tab === 'series'
        ? `${filteredSeries.length} séries`
        : `${totalCashTables} mesas`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.count}>{headerCount}</Text>
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
        <TouchableOpacity
          style={[styles.tab, tab === 'cash' && styles.tabActive]}
          onPress={() => setTab('cash')}
        >
          <Text style={[styles.tabText, tab === 'cash' && styles.tabTextActive]}>Cash</Text>
        </TouchableOpacity>
      </View>

      {(tab === 'tournaments' || tab === 'series') && (
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
      ) : tab === 'series' ? (
        seriesLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.green} size="large" />
          </View>
        ) : seriesError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{seriesError}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSeries}
            keyExtractor={(item) => item.id}
            renderItem={renderSeries}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>Nenhuma série neste período.</Text>
              </View>
            }
          />
        )
      ) : cashLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.green} size="large" />
        </View>
      ) : cashError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{cashError}</Text>
        </View>
      ) : (
        <FlatList
          data={cashGroups}
          keyExtractor={(item) => item.venue.id}
          renderItem={renderCashVenue}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nenhuma mesa de cash ativa no momento.</Text>
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
    paddingHorizontal: 14,
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
  cashVenueCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cashVenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  cashVenueTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
  cashVenueSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  cashVenueBadge: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cashVenueBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.green },
  cashTableRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  cashTableTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  variantPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  variantPillText: { fontSize: 10, fontWeight: '700', color: Colors.amber },
  cashTableName: { fontSize: 14, fontWeight: '600', color: Colors.white, flex: 1 },
  cashTableMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
});
