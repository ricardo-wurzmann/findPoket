import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { MessageCircle, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Venue } from '@/types';
import { isVenueOpen } from '@/lib/utils';

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const open = isVenueOpen(venue.openTime, venue.closeTime);

  const openWhatsApp = () => {
    const phone = venue.whatsapp.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${phone}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.card}
      onPress={() => router.push(`/venues/${venue.id}`)}
    >
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: open ? Colors.green : Colors.gray }]} />
        <Text style={[styles.status, { color: open ? Colors.green : Colors.textMuted }]}>
          {open ? 'Aberto' : 'Fechado'}
        </Text>
      </View>

      <Text style={styles.name}>{venue.name}</Text>
      <Text style={styles.location}>
        {venue.district} · {venue.city}
      </Text>

      <View style={styles.footer}>
        <View style={styles.hoursRow}>
          <Clock size={12} color={Colors.textMuted} />
          <Text style={styles.hours}>
            {venue.openTime} – {venue.closeTime}
          </Text>
        </View>

        {venue.whatsapp && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.waBtn}
            onPress={openWhatsApp}
          >
            <MessageCircle size={13} color={Colors.white} />
            <Text style={styles.waText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hours: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  waText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
});
