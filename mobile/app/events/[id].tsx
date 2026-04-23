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
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { getEventById, declareInterest, getWaitlistPosition, joinWaitlist, leaveWaitlist } from '@/lib/api/events';
import { Event, BlindLevel } from '@/types';
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

function parseBlindLevels(raw: unknown): BlindLevel[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter((row): row is BlindLevel => row !== null && typeof row === 'object');
}

function blindLevelsDurationMinutes(levels: BlindLevel[]): number {
  return levels.reduce((sum, row) => sum + (typeof row.dur === 'number' ? row.dur : 0), 0);
}

function formatDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}min`;
  return `${h}h ${m}min`;
}

function TournamentDetails({ event }: { event: Event }) {
  const [showAllLevels, setShowAllLevels] = useState(false);
  const levels = parseBlindLevels(event.blindStructure).filter((r) => r.type === 'level');
  const allLevels = parseBlindLevels(event.blindStructure);
  const blindDurationMin = blindLevelsDurationMinutes(allLevels);
  const hasBlindTable = levels.length > 0;
  const hasStack = event.startStack != null && event.startStack > 0;
  const hasRebuy =
    event.rebuyEnabled &&
    (event.rebuyPrice != null || event.rebuyStack != null);
  const hasAddon =
    event.addonEnabled &&
    (event.addonPrice != null || event.addonStack != null);
  const hasGtd = event.gtd != null && event.gtd > 0;
  const hasLegacyText =
    !!(event.startingStack || event.levelDuration || event.rebuyPolicy);
  const hasLegacyStack = !!(event.startingStack && !hasStack);

  const innerCard =
    hasBlindTable ||
    hasStack ||
    hasRebuy ||
    hasAddon ||
    hasLegacyStack ||
    !!(event.levelDuration || event.rebuyPolicy);

  if (!hasGtd && !innerCard) {
    return null;
  }

  const preview = showAllLevels ? levels : levels.slice(0, 5);

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16, gap: 12 }}>
      {hasGtd && (
        <View style={detailStyles.gtdBanner}>
          <Text style={detailStyles.gtdLabel}>Garantido</Text>
          <Text style={detailStyles.gtdValue}>{formatCurrency(event.gtd!)}</Text>
        </View>
      )}

      {innerCard ? (
      <View style={detailStyles.card}>
        {hasBlindTable && (
          <>
            <Text style={detailStyles.cardTitle}>
              {levels.length} níveis · {formatDuration(blindDurationMin)} estimados
            </Text>
            <View style={detailStyles.tableHeader}>
              <Text style={[detailStyles.th, { flex: 0.7 }]}>Nível</Text>
              <Text style={detailStyles.th}>SB</Text>
              <Text style={detailStyles.th}>BB</Text>
              <Text style={detailStyles.th}>Ante</Text>
              <Text style={detailStyles.th}>Min</Text>
            </View>
            {preview.map((row, idx) => (
              <View
                key={`${idx}-${row.sb}-${row.bb}`}
                style={[detailStyles.tr, idx % 2 === 1 && detailStyles.trAlt]}
              >
                <Text style={[detailStyles.td, { flex: 0.7 }]}>{idx + 1}</Text>
                <Text style={detailStyles.td}>{row.sb ?? '—'}</Text>
                <Text style={detailStyles.td}>{row.bb ?? '—'}</Text>
                <Text style={detailStyles.td}>{row.ante ?? '—'}</Text>
                <Text style={detailStyles.td}>{row.dur ?? '—'}</Text>
              </View>
            ))}
            {levels.length > 5 && !showAllLevels && (
              <Text style={detailStyles.moreHint}>... e mais {levels.length - 5} níveis</Text>
            )}
            {levels.length > 5 && (
              <TouchableOpacity onPress={() => setShowAllLevels((s) => !s)} style={detailStyles.toggleBtn}>
                <Text style={detailStyles.toggleText}>
                  {showAllLevels ? 'Ocultar' : 'Ver estrutura completa'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {hasStack && (
          <View style={[detailStyles.rowLine, hasBlindTable && detailStyles.rowDivider]}>
            <Text style={detailStyles.detailLabel}>Stack inicial</Text>
            <Text style={detailStyles.detailValue}>{event.startStack!.toLocaleString('pt-BR')}</Text>
          </View>
        )}

        {hasLegacyText && (
          <View style={detailStyles.legacyBlock}>
            {hasLegacyStack && (
              <View style={detailStyles.rowLine}>
                <Text style={detailStyles.detailLabel}>Stack (info)</Text>
                <Text style={detailStyles.detailValue}>{event.startingStack}</Text>
              </View>
            )}
            {event.levelDuration && (
              <View style={detailStyles.rowLine}>
                <Text style={detailStyles.detailLabel}>Duração do nível</Text>
                <Text style={detailStyles.detailValue}>{event.levelDuration}</Text>
              </View>
            )}
            {event.rebuyPolicy && (
              <View style={detailStyles.rowLine}>
                <Text style={detailStyles.detailLabel}>Rebuy (texto)</Text>
                <Text style={[detailStyles.detailValue, { flex: 1, textAlign: 'right' }]}>
                  {event.rebuyPolicy}
                </Text>
              </View>
            )}
          </View>
        )}

        {hasRebuy && (
          <View style={detailStyles.rowLine}>
            <Text style={detailStyles.detailLabel}>Rebuy</Text>
            <Text style={detailStyles.detailValue}>
              {event.rebuyPrice != null ? formatCurrency(event.rebuyPrice) : ''}
              {event.rebuyPrice != null && event.rebuyStack != null ? ' · ' : ''}
              {event.rebuyStack != null ? `Stack ${event.rebuyStack.toLocaleString('pt-BR')}` : ''}
              {event.rebuyLimit ? ` · ${event.rebuyLimit}` : ''}
            </Text>
          </View>
        )}

        {hasAddon && (
          <View style={detailStyles.rowLine}>
            <Text style={detailStyles.detailLabel}>Add-on</Text>
            <Text style={detailStyles.detailValue}>
              {event.addonPrice != null ? formatCurrency(event.addonPrice) : ''}
              {event.addonPrice != null && event.addonStack != null ? ' · ' : ''}
              {event.addonStack != null ? `Stack ${event.addonStack.toLocaleString('pt-BR')}` : ''}
            </Text>
          </View>
        )}
      </View>
      ) : null}
    </View>
  );
}

function CashGameDetails({ event }: { event: Event }) {
  const parts: { label: string; value: string }[] = [];
  if (event.blindType === 'button' && event.btnValue != null && event.btnValue > 0) {
    parts.push({ label: 'Blinds', value: `Button ${event.btnValue}` });
  } else if (event.blindType === 'sb-bb' || !event.blindType) {
    const sb = event.sbValue ?? 0;
    const bb = event.bbValue ?? 0;
    if (sb > 0 || bb > 0) {
      let v = `${sb} / ${bb}`;
      if (event.straddleValue != null && event.straddleValue > 0) {
        v += ` · Straddle ${event.straddleValue}`;
      }
      parts.push({ label: 'Blinds', value: v });
    }
  }
  if (event.blindType === 'button' && (!event.btnValue || event.btnValue <= 0) && event.blinds) {
    parts.push({ label: 'Blinds', value: event.blinds });
  }
  if (event.buyinMin != null || event.buyinMax != null) {
    const a =
      event.buyinMin != null && event.buyinMin > 0 ? formatCurrency(event.buyinMin) : '—';
    const b =
      event.buyinMax != null && event.buyinMax > 0 ? formatCurrency(event.buyinMax) : '—';
    parts.push({ label: 'Buy-in', value: `${a} – ${b}` });
  }
  if (event.tableCount != null || event.seatsPerTable != null) {
    const tc = event.tableCount != null ? `${event.tableCount} mesas` : '';
    const sp = event.seatsPerTable != null ? `${event.seatsPerTable} lugares/mesa` : '';
    parts.push({ label: 'Mesas', value: [tc, sp].filter(Boolean).join(' · ') });
  }
  if (event.rake != null && event.rake > 0 && !event.hideRake) {
    const cap =
      event.rakeCap != null && event.rakeCap > 0
        ? ` · cap ${formatCurrency(event.rakeCap)}`
        : '';
    parts.push({ label: 'Rake', value: `${event.rake}%${cap}` });
  }
  if (parts.length === 0) return null;
  return (
    <View style={[detailStyles.card, { marginHorizontal: 16, marginBottom: 16 }]}>
      {parts.map((p) => (
        <View key={p.label} style={detailStyles.rowLine}>
          <Text style={detailStyles.detailLabel}>{p.label}</Text>
          <Text style={[detailStyles.detailValue, { flex: 1, textAlign: 'right' }]}>{p.value}</Text>
        </View>
      ))}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  gtdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  gtdLabel: { fontSize: 12, fontWeight: '600', color: Colors.amber },
  gtdValue: { fontSize: 20, fontStyle: 'italic', fontWeight: '300', color: Colors.amber },
  tableHeader: { flexDirection: 'row', marginTop: 4, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  th: { flex: 1, fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  tr: { flexDirection: 'row', paddingVertical: 8 },
  trAlt: { backgroundColor: 'rgba(255,255,255,0.04)' },
  td: { flex: 1, fontSize: 12, color: Colors.white },
  moreHint: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  toggleBtn: { marginTop: 8, paddingVertical: 6 },
  toggleText: { fontSize: 12, color: '#9b9690', fontWeight: '600' },
  rowLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  rowDivider: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  legacyBlock: { gap: 8 },
  detailLabel: { fontSize: 13, color: Colors.textMuted },
  detailValue: { fontSize: 13, fontWeight: '600', color: Colors.white },
});

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
  const isCash = event.type === 'CASH_GAME';
  const isTournamentLike = event.type === 'TOURNAMENT' || event.type === 'HOME_GAME';
  const cashBuyinLabel =
    event.buyinMin != null || event.buyinMax != null
      ? `${event.buyinMin != null && event.buyinMin > 0 ? formatCurrency(event.buyinMin) : '—'} – ${event.buyinMax != null && event.buyinMax > 0 ? formatCurrency(event.buyinMax) : '—'}`
      : formatCurrency(event.buyIn);

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
        {!isCash && (
          <InfoCard
            icon={<DollarSign size={16} color={Colors.green} />}
            label="Buy-in"
            value={formatCurrency(event.buyIn)}
            valueColor={Colors.green}
          />
        )}
        {isCash && (
          <InfoCard
            icon={<DollarSign size={16} color={Colors.green} />}
            label="Buy-in"
            value={cashBuyinLabel}
            valueColor={Colors.green}
          />
        )}
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
        {!isCash && event.gtd ? (
          <InfoCard
            icon={<Trophy size={16} color={Colors.textMuted} />}
            label="GTD"
            value={formatCurrency(event.gtd)}
          />
        ) : null}
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

      {isTournamentLike && <TournamentDetails event={event} />}
      {isCash && <CashGameDetails event={event} />}

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
