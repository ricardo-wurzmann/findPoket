import { useEffect, useState } from 'react';
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
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { OrganizerTopBar } from '@/components/organizer/OrganizerTopBar';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface OrganizerEvent {
  id: string;
  name: string;
  type: string;
  status: string;
  buyIn: number;
  startsAt: string;
  maxPlayers: number;
  registrationCount?: number;
}

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: 'Em breve',
  LIVE: 'Ao vivo',
  FINISHED: 'Encerrado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: Colors.amber,
  LIVE: Colors.green,
  FINISHED: Colors.textMuted,
  CANCELLED: '#F87171',
};

export default function OrganizerEventsScreen() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const res = await fetch(`${API_URL}/api/organizer/dashboard`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Falha ao carregar eventos.');

      const json = await res.json();
      setEvents(json.events ?? []);
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

  const renderItem = ({ item }: { item: OrganizerEvent }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.card}
      onPress={() => router.push(`/events/${item.id}` as never)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? Colors.textMuted) + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? Colors.textMuted }]}>
            {STATUS_LABEL[item.status] ?? item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.eventDate}>{formatDateTime(item.startsAt)}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.buyIn}>{formatCurrency(item.buyIn)}</Text>
        <Text style={styles.count}>
          {item.registrationCount ?? 0} / {item.maxPlayers} jogadores
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <OrganizerTopBar title="Meus Eventos" />

      {loading ? (
        <ActivityIndicator color={Colors.green} size="large" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum evento criado ainda.</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => router.push('/organizer/create-event' as never)}
      >
        <Plus size={22} color={Colors.dark} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  loader: { marginTop: 60 },
  errorText: { color: '#F87171', fontSize: 14, textAlign: 'center', marginTop: 40 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.white, marginRight: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  eventDate: { fontSize: 12, color: Colors.textMuted, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buyIn: { fontSize: 15, fontWeight: '700', fontStyle: 'italic', color: Colors.green },
  count: { fontSize: 12, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
