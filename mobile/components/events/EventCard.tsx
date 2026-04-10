import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Event } from '@/types';
import { formatDayMonth, formatTime, formatCurrency } from '@/lib/utils';

interface EventCardProps {
  event: Event;
}

const STATUS_COLORS: Record<string, string> = {
  LIVE: Colors.green,
  UPCOMING: Colors.amber,
  FINISHED: Colors.textMuted,
  CANCELLED: Colors.textMuted,
};

const STATUS_LABELS: Record<string, string> = {
  LIVE: 'Ao vivo',
  UPCOMING: 'Em breve',
  FINISHED: 'Encerrado',
  CANCELLED: 'Cancelado',
};

const TYPE_LABELS: Record<string, string> = {
  TOURNAMENT: 'Torneio',
  CASH_GAME: 'Cash Game',
  HOME_GAME: 'Home Game',
};

export function EventCard({ event }: EventCardProps) {
  const { day, month } = formatDayMonth(event.startsAt);
  const statusColor = STATUS_COLORS[event.status] ?? Colors.textMuted;
  const borderColor = event.isMajor ? Colors.dark : statusColor;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.card, { borderLeftColor: borderColor }]}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      {/* Date column */}
      <View style={styles.dateCol}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {event.name}
        </Text>
        {event.venue && (
          <Text style={styles.venue} numberOfLines={1}>
            {event.venue.name}
          </Text>
        )}
        <View style={styles.tagRow}>
          <View style={[styles.badge, { backgroundColor: `${statusColor}18` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {STATUS_LABELS[event.status]}
            </Text>
          </View>
          <Text style={styles.typeLabel}>{TYPE_LABELS[event.type]}</Text>
        </View>
      </View>

      {/* Right column */}
      <View style={styles.rightCol}>
        <Text style={styles.buyIn}>{formatCurrency(event.buyIn)}</Text>
        <Text style={styles.time}>{formatTime(event.startsAt)}</Text>
        {event._count && (
          <Text style={styles.count}>{event._count.registrations} int.</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  dateCol: {
    width: 36,
    alignItems: 'center',
  },
  day: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    color: Colors.textDark,
    lineHeight: 26,
  },
  month: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  venue: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  buyIn: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    color: Colors.green,
  },
  time: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  count: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
