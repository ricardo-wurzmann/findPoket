import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { formatDateTime } from '@/lib/utils';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface RequestItem {
  id: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; handle: string | null };
  event: { id: string; name: string };
}

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/organizer/requests`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error('Falha ao carregar solicitações.');

      const json = await res.json();
      setRequests(json.requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAction = async (requestId: string, action: 'APPROVED' | 'DENIED') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`${API_URL}/api/organizer/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: action }),
      });

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: action } : r))
      );
    } catch {
      // silently fail
    }
  };

  const renderItem = ({ item }: { item: RequestItem }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.userName}>{item.user.name}</Text>
        {item.user.handle && (
          <Text style={styles.userHandle}>@{item.user.handle}</Text>
        )}
        <Text style={styles.eventName}>{item.event.name}</Text>
        <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
      </View>

      {item.status === 'PENDING' ? (
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.approveBtn}
            onPress={() => handleAction(item.id, 'APPROVED')}
          >
            <Check size={16} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.denyBtn}
            onPress={() => handleAction(item.id, 'DENIED')}
          >
            <X size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'APPROVED' ? Colors.greenDim : 'rgba(239,68,68,0.1)' },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: item.status === 'APPROVED' ? Colors.green : '#F87171' },
            ]}
          >
            {item.status === 'APPROVED' ? 'Aprovado' : 'Negado'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Solicitações</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.green} size="large" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nenhuma solicitação pendente.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', fontStyle: 'italic', color: Colors.white },
  loader: { marginTop: 40 },
  errorText: { color: '#F87171', fontSize: 14, paddingHorizontal: 20 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  cardContent: { flex: 1, marginRight: 10 },
  userName: { fontSize: 14, fontWeight: '600', color: Colors.white },
  userHandle: { fontSize: 12, color: Colors.textMuted },
  eventName: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  denyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  center: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});
