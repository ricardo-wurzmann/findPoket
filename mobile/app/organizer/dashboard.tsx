import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { OrganizerTopBar } from '@/components/organizer/OrganizerTopBar';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface DashboardEvent {
  id: string;
  name: string;
  startsAt: string;
  status: string;
  buyIn: number;
  registrationCount?: number;
  _count?: { registrations?: number };
}

interface DashboardData {
  todayRegistrations: number;
  estimatedRevenue: number;
  activeEvents: number;
  pendingRequests: number;
  events: DashboardEvent[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Sessão expirada.');

  const res = await fetch(`${API_URL}/api/organizer/dashboard`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error('Falha ao carregar dashboard.');
  return res.json();
}

export default function OrganizerDashboard() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const json = await fetchDashboard();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.root}>
      <OrganizerTopBar title="Dashboard" />

      {loading ? (
        <ActivityIndicator color={Colors.green} size="large" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />
          }
        >
          {/* KPI cards */}
          <View style={styles.kpiGrid}>
            <KpiCard label="Eventos ativos" value={String(data?.activeEvents ?? 0)} />
            <KpiCard label="Hoje" value={String(data?.todayRegistrations ?? 0)} color={Colors.green} />
            <KpiCard label="Pendentes" value={String(data?.pendingRequests ?? 0)} color={Colors.amber} />
          </View>

          {/* Events list */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meus eventos</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/organizer/events' as never)}
            >
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {(data?.events ?? []).slice(0, 5).map((event) => (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.7}
              style={styles.eventRow}
              onPress={() => router.push(`/events/${event.id}` as never)}
            >
              <View style={styles.eventInfo}>
                <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
                <Text style={styles.eventDate}>{formatDateTime(event.startsAt)}</Text>
              </View>
              <View style={styles.eventRight}>
                <Text style={styles.eventBuyIn}>{formatCurrency(event.buyIn)}</Text>
                <Text style={styles.eventCount}>
                  {event.registrationCount ?? event._count?.registrations ?? 0} int.
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

interface KpiCardProps { label: string; value: string; color?: string }
function KpiCard({ label, value, color }: KpiCardProps) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, color ? { color } : undefined]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  loader: { marginTop: 60 },
  errorText: { color: '#F87171', fontSize: 14, textAlign: 'center', marginTop: 40 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  kpiGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: { fontSize: 22, fontWeight: '700', color: Colors.white },
  kpiLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
  seeAll: { fontSize: 13, color: Colors.green, fontWeight: '600' },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  eventInfo: { flex: 1, marginRight: 10 },
  eventName: { fontSize: 14, fontWeight: '600', color: Colors.white },
  eventDate: { fontSize: 12, color: Colors.textMuted },
  eventRight: { alignItems: 'flex-end' },
  eventBuyIn: { fontSize: 14, fontWeight: '700', fontStyle: 'italic', color: Colors.green },
  eventCount: { fontSize: 12, color: Colors.textMuted },
});
