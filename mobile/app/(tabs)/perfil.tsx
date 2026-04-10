import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { getInitials, calculateAge } from '@/lib/utils';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { user, dbUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.green} size="large" />
      </View>
    );
  }

  if (!user || !dbUser) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>Faça login para ver seu perfil.</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.replace('/(auth)/login')}
          style={styles.loginBtn}
        >
          <Text style={styles.loginBtnText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const age = dbUser.birthDate ? calculateAge(dbUser.birthDate) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + info */}
      <View style={styles.headerSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(dbUser.name)}</Text>
        </View>
        <Text style={styles.name}>{dbUser.name}</Text>
        {dbUser.handle && <Text style={styles.handle}>@{dbUser.handle}</Text>}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {dbUser.role === 'ORGANIZER' ? 'Organizador' : 'Jogador'}
          </Text>
        </View>
      </View>

      {/* Stats grid (player only) */}
      {dbUser.role === 'PLAYER' && (
        <View style={styles.statsGrid}>
          <StatItem label="Torneios" value="—" />
          <StatItem label="ITM%" value="—" />
          <StatItem label="Prêmios" value="—" />
          <StatItem label="ROI" value="—" />
        </View>
      )}

      {/* Additional info */}
      <View style={styles.infoSection}>
        {dbUser.city && (
          <InfoRow label="Cidade" value={dbUser.city} />
        )}
        {age !== null && (
          <InfoRow label="Idade" value={`${age} anos`} />
        )}
        {dbUser.profession && (
          <InfoRow label="Profissão" value={dbUser.profession} />
        )}
        {dbUser.email && (
          <InfoRow label="Email" value={dbUser.email} />
        )}
        {dbUser.hendonMob && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL(dbUser.hendonMob!)}
          >
            <InfoRow label="Hendon Mob" value="Ver perfil →" highlight />
          </TouchableOpacity>
        )}
      </View>

      {/* Edit profile button (disabled for now) */}
      <TouchableOpacity activeOpacity={0.5} style={styles.editBtn} disabled>
        <Text style={styles.editBtnText}>Editar perfil (em breve)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

interface StatItemProps { label: string; value: string }
function StatItem({ label, value }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface InfoRowProps { label: string; value: string; highlight?: boolean }
function InfoRow({ label, value, highlight }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  content: { paddingHorizontal: 20 },
  center: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },

  headerSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.white },
  name: { fontSize: 22, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  handle: { fontSize: 14, color: Colors.textMuted, marginBottom: 10 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  statsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.white },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 13, color: Colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '500', color: Colors.white },
  infoValueHighlight: { color: Colors.green },

  editBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  editBtnText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  loginBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.green,
  },
  loginBtnText: { fontSize: 14, fontWeight: '600', color: Colors.white },
});
