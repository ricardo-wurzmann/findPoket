import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Globe,
  Table2,
  MessageCircle,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { getVenueById } from '@/lib/api/venues';
import { Venue, EventSummary } from '@/types';
import { isVenueOpen, formatTime, formatDayMonth, formatCurrency } from '@/lib/utils';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getVenueById(id)
      .then(setVenue)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.green} size="large" />
      </View>
    );
  }

  if (error || !venue) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error ?? 'Venue não encontrado.'}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={18} color={Colors.white} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const open = isVenueOpen(venue.openTime, venue.closeTime);

  const openWhatsApp = () => {
    const phone = venue.whatsapp.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${phone}`);
  };

  const openWebsite = () => {
    if (venue.website) Linking.openURL(venue.website);
  };

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

        <View style={styles.headerContent}>
          <View style={[styles.statusBadge, { backgroundColor: open ? Colors.greenDim : 'rgba(107,102,96,0.2)' }]}>
            <View style={[styles.statusDot, { backgroundColor: open ? Colors.green : Colors.textMuted }]} />
            <Text style={[styles.statusText, { color: open ? Colors.green : Colors.textMuted }]}>
              {open ? 'Aberto agora' : 'Fechado'}
            </Text>
          </View>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueLocation}>
            {venue.district} · {venue.city}
          </Text>
        </View>
      </View>

      {/* Info grid */}
      <View style={styles.infoGrid}>
        <InfoCard icon={<Clock size={16} color={Colors.textMuted} />} label="Abre" value={venue.openTime} />
        <InfoCard icon={<Clock size={16} color={Colors.textMuted} />} label="Fecha" value={venue.closeTime} />
        <InfoCard icon={<Table2 size={16} color={Colors.textMuted} />} label="Mesas" value={venue.tableCount} />
        <InfoCard
          icon={<MapPin size={16} color={Colors.textMuted} />}
          label="Endereço"
          value={venue.address}
          wide
        />
      </View>

      {/* Contact buttons */}
      <View style={styles.contactRow}>
        {venue.whatsapp && (
          <TouchableOpacity activeOpacity={0.7} style={styles.contactBtn} onPress={openWhatsApp}>
            <MessageCircle size={16} color={Colors.white} />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
        {venue.website && (
          <TouchableOpacity activeOpacity={0.7} style={[styles.contactBtn, styles.contactBtnOutline]} onPress={openWebsite}>
            <Globe size={16} color={Colors.white} />
            <Text style={styles.contactBtnText}>Site</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Upcoming events */}
      {venue.events && venue.events.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Torneios agendados</Text>
          {venue.events.map((event) => (
            <UpcomingEventRow key={event.id} event={event} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}

function InfoCard({ icon, label, value, wide }: InfoCardProps) {
  return (
    <View style={[styles.infoCard, wide && styles.infoCardWide]}>
      {icon}
      <Text style={styles.infoCardLabel}>{label}</Text>
      <Text style={styles.infoCardValue} numberOfLines={wide ? 2 : 1}>{value}</Text>
    </View>
  );
}

function UpcomingEventRow({ event }: { event: EventSummary }) {
  const { day, month } = formatDayMonth(event.startsAt);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.eventRow}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={styles.eventDate}>
        <Text style={styles.eventDay}>{day}</Text>
        <Text style={styles.eventMonth}>{month}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.eventTime}>{formatTime(event.startsAt)}</Text>
      </View>
      <Text style={styles.eventBuyIn}>{formatCurrency(event.buyIn)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#F87171', fontSize: 14, marginBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: Colors.white, fontSize: 14 },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: { gap: 6 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  venueName: { fontSize: 26, fontWeight: '700', color: Colors.white },
  venueLocation: { fontSize: 14, color: Colors.textMuted },
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
  infoCardWide: { width: '100%' },
  infoCardLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  infoCardValue: { fontSize: 14, fontWeight: '600', color: Colors.white },
  contactRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.green,
  },
  contactBtnOutline: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactBtnText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  section: { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  eventDate: { alignItems: 'center', width: 32 },
  eventDay: { fontSize: 20, fontWeight: '700', fontStyle: 'italic', color: Colors.white },
  eventMonth: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: '600', color: Colors.white },
  eventTime: { fontSize: 12, color: Colors.textMuted },
  eventBuyIn: { fontSize: 14, fontWeight: '700', fontStyle: 'italic', color: Colors.green },
});
