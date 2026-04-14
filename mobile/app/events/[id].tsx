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
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  Trophy,
  Clock,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { getEventById, declareInterest, getWaitlistPosition, joinWaitlist, leaveWaitlist } from '@/lib/api/events';
import { Event } from '@/types';
import { formatDateTime, formatCurrency } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  LIVE: 'Ao vivo',
  UPCOMING: 'Em breve',
  FINISHED: 'Encerrado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  LIVE: Colors.green,
  UPCOMING: Colors.amber,
  FINISHED: Colors.textMuted,
  CANCELLED: Colors.textMuted,
};

const TYPE_LABELS: Record<string, string> = {
  TOURNAMENT: 'Torneio',
  CASH_GAME: 'Cash Game',
  HOME_GAME: 'Home Game',
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [declaring, setDeclaring] = useState(false);
  const [declared, setDeclared] = useState(false);

  // Waitlist state
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistEntryId, setWaitlistEntryId] = useState<string | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEventById(id)
      .then((ev) => {
        setEvent(ev);
        if (ev.type === 'CASH_GAME') {
          getWaitlistPosition(ev.id)
            .then((r) => {
              setWaitlistCount(r.count);
              if (r.entry) {
                setWaitlistEntryId(r.entry.id);
                setWaitlistPosition(r.position);
                setWaitlistStatus(r.entry.status);
              }
            })
            .catch(() => undefined);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeclareInterest = async () => {
    if (!event || declaring || declared) return;
    setDeclaring(true);
    try {
      await declareInterest(event.id);
      setDeclared(true);
    } catch {
      setDeclared(true);
    } finally {
      setDeclaring(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!event || waitlistLoading) return;
    setWaitlistLoading(true);
    try {
      const r = await joinWaitlist(event.id);
      setWaitlistCount(r.count);
      if (r.entry) {
        setWaitlistEntryId(r.entry.id);
        setWaitlistStatus(r.entry.status);
      }
      const pos = await getWaitlistPosition(event.id);
      setWaitlistPosition(pos.position);
    } catch {
      // ignore
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!event || !waitlistEntryId || waitlistLoading) return;
    setWaitlistLoading(true);
    try {
      await leaveWaitlist(waitlistEntryId);
      setWaitlistEntryId(null);
      setWaitlistPosition(null);
      setWaitlistStatus(null);
      setWaitlistCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.green} size="large" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error ?? 'Evento não encontrado.'}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={18} color={Colors.white} />
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[event.status] ?? Colors.textMuted;
  const interested = event._count?.registrations ?? 0;
  const progressRatio = event.maxPlayers > 0 ? Math.min(interested / event.maxPlayers, 1) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.white} />
        </TouchableOpacity>

        {event.venue && (
          <Text style={styles.venueName}>{event.venue.name}</Text>
        )}

        <Text style={styles.eventName}>{event.name}</Text>

        {/* Tags */}
        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.tagText, { color: statusColor }]}>
              {STATUS_LABELS[event.status]}
            </Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{TYPE_LABELS[event.type]}</Text>
          </View>
          {event.isMajor && (
            <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Trophy size={11} color={Colors.white} />
              <Text style={styles.tagText}>Major</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info grid */}
      <View style={styles.infoGrid}>
        <InfoCard
          icon={<DollarSign size={16} color={Colors.green} />}
          label="Buy-in"
          value={formatCurrency(event.buyIn)}
          valueColor={Colors.green}
        />
        <InfoCard
          icon={<Calendar size={16} color={Colors.textMuted} />}
          label="Data/Hora"
          value={formatDateTime(event.startsAt)}
        />
        <InfoCard
          icon={<Users size={16} color={Colors.amber} />}
          label="Vagas"
          value={`${interested} / ${event.maxPlayers}`}
          valueColor={Colors.amber}
        />
        {event.gtd && (
          <InfoCard
            icon={<Trophy size={16} color={Colors.textMuted} />}
            label="GTD"
            value={formatCurrency(event.gtd)}
          />
        )}
      </View>

      {/* Progress bar */}
      {event.maxPlayers > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {interested} pessoas interessadas
          </Text>
        </View>
      )}

      {/* Tournament details */}
      {event.type === 'TOURNAMENT' && (
        <View style={styles.detailsSection}>
          {event.startingStack && (
            <DetailRow label="Stack inicial" value={event.startingStack} />
          )}
          {event.levelDuration && (
            <DetailRow label="Duração do nível" value={event.levelDuration} />
          )}
          {event.rebuyPolicy && (
            <DetailRow label="Rebuy" value={event.rebuyPolicy} />
          )}
        </View>
      )}

      {/* Cash Game details */}
      {event.type === 'CASH_GAME' && event.blinds && (
        <View style={styles.detailsSection}>
          <DetailRow label="Blinds" value={event.blinds} />
          <DetailRow label="Max jogadores" value={String(event.maxPlayers)} />
        </View>
      )}

      {/* Description */}
      {event.description && (
        <View style={styles.descSection}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.descText}>{event.description}</Text>
        </View>
      )}

      {/* Action button */}
      {event.status !== 'FINISHED' && event.status !== 'CANCELLED' && (
        <View style={styles.actionSection}>
          {event.type === 'CASH_GAME' ? (
            <>
              {/* Waitlist count info */}
              {waitlistCount > 0 && !waitlistEntryId && (
                <Text style={styles.waitlistInfo}>
                  {waitlistCount} {waitlistCount === 1 ? 'pessoa na fila' : 'pessoas na fila'}
                </Text>
              )}
              {waitlistEntryId ? (
                <>
                  <View style={styles.waitlistPositionBox}>
                    <Text style={styles.waitlistPositionLabel}>
                      {waitlistStatus === 'CALLED' ? 'Você foi chamado! 🟢' : `Você está na posição #${waitlistPosition ?? '...'} na fila`}
                    </Text>
                    <Text style={styles.waitlistCountText}>{waitlistCount} na fila total</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.leaveWaitlistBtn, waitlistLoading && styles.interestBtnDisabled]}
                    onPress={handleLeaveWaitlist}
                    disabled={waitlistLoading}
                  >
                    {waitlistLoading ? (
                      <ActivityIndicator color={Colors.textMuted} />
                    ) : (
                      <Text style={styles.leaveWaitlistText}>Sair da fila</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.waitlistBtn, waitlistLoading && styles.interestBtnDisabled]}
                  onPress={handleJoinWaitlist}
                  disabled={waitlistLoading}
                >
                  {waitlistLoading ? (
                    <ActivityIndicator color={Colors.dark} />
                  ) : (
                    <Text style={styles.waitlistBtnText}>Entrar na lista de espera</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.interestBtn,
                declared && styles.interestBtnDeclared,
                declaring && styles.interestBtnDisabled,
              ]}
              onPress={handleDeclareInterest}
              disabled={declaring || declared}
            >
              {declaring ? (
                <ActivityIndicator color={Colors.dark} />
              ) : (
                <Text style={styles.interestBtnText}>
                  {declared ? 'Interesse declarado ✓' : 'Declarar interesse'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}

function InfoCard({ icon, label, value, valueColor }: InfoCardProps) {
  return (
    <View style={styles.infoCard}>
      {icon}
      <Text style={styles.infoCardLabel}>{label}</Text>
      <Text style={[styles.infoCardValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#F87171', fontSize: 14, marginBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { color: Colors.white, fontSize: 14 },

  header: { paddingHorizontal: 20, paddingBottom: 24 },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  venueName: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  eventName: { fontSize: 26, fontWeight: '700', color: Colors.white, marginBottom: 12 },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  infoCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  infoCardLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  infoCardValue: { fontSize: 15, fontWeight: '700', color: Colors.white },

  progressSection: { paddingHorizontal: 16, marginBottom: 20, gap: 8 },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.amber,
    borderRadius: 999,
  },
  progressText: { fontSize: 12, color: Colors.textMuted },

  detailsSection: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 13, color: Colors.textMuted },
  detailValue: { fontSize: 13, fontWeight: '600', color: Colors.white },

  descSection: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.white, marginBottom: 10 },
  descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  actionSection: { paddingHorizontal: 16, marginBottom: 24 },
  interestBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestBtnDeclared: { backgroundColor: Colors.green },
  interestBtnDisabled: { opacity: 0.7 },
  interestBtnText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  waitlistBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitlistBtnText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  waitlistInfo: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  waitlistPositionBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  waitlistPositionLabel: { fontSize: 15, fontWeight: '600', color: Colors.white },
  waitlistCountText: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  leaveWaitlistBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveWaitlistText: { fontSize: 14, color: Colors.textMuted },
});
