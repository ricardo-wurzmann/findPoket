import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface DashboardData {
  totalEvents: number;
  liveEvents: number;
  totalInterests: number;
  events: Array<{
    id: string;
    name: string;
    startsAt: string;
    status: string;
    buyIn: number;
    _count: { registrations: number };
  }>;
}

export default function OrganizerDashboard() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`${API_URL}/api/organizer/dashboard`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) throw new Error('Falha ao carregar dashboard.');

        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Dashboard</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.createBtn}
              onPress={() => router.push('/organizer/create-event')}
            >
              <Plus size={16} color={Colors.dark} />
              <Text style={styles.createBtnText}>Novo evento</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.logoutBtn}
              onPress={handleLogout}
            >
              <LogOut size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.green} size="large" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : data ? (
        <>
          {/* KPI cards */}
          <View style={styles.kpiGrid}>
            <KpiCard label="Total de eventos" value={String(data.totalEvents)} />
            <KpiCard label="Ao vivo agora" value={String(data.liveEvents)} color={Colors.green} />
            <KpiCard label="Interesses" value={String(data.totalInterests)} color={Colors.amber} />
          </View>

          {/* Events list */}
          <Text style={styles.sectionTitle}>Meus eventos</Text>
          {data.events.map((event) => (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.7}
              style={styles.eventRow}
              onPress={() => router.push(`/events/${event.id}`)}
            >
              <View style={styles.eventInfo}>
                <Text style={styles.eventName} numberOfLines={1}>
                  {event.name}
                </Text>
                <Text style={styles.eventDate}>{formatDateTime(event.startsAt)}</Text>
              </View>
              <View style={styles.eventRight}>
                <Text style={styles.eventBuyIn}>{formatCurrency(event.buyIn)}</Text>
                <Text style={styles.eventCount}>{event._count.registrations} int.</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  color?: string;
}
function KpiCard({ label, value, color }: KpiCardProps) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, color ? { color } : undefined]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: '700', fontStyle: 'italic', color: Colors.white },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  createBtnText: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: { marginTop: 40 },
  errorText: { color: '#F87171', fontSize: 14 },
  kpiGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: { fontSize: 24, fontWeight: '700', color: Colors.white },
  kpiLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.white, marginBottom: 12 },
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
