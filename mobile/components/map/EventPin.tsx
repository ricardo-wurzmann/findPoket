import { View, StyleSheet } from 'react-native';
import { Event } from '@/types';

export function EventPin({ event }: { event: Event }) {
  const isLive = event.status === 'LIVE';
  const isMajor = event.isMajor;
  const type = event.type;

  if (isMajor) {
    return <View style={[styles.pin, styles.major]} />;
  }

  if (isLive) {
    return <View style={[styles.pin, styles.live]} />;
  }

  if (type === 'CASH_GAME') {
    return <View style={[styles.pin, styles.cash]} />;
  }

  if (type === 'HOME_GAME') {
    return <View style={[styles.pin, styles.home]} />;
  }

  return <View style={[styles.pin, styles.upcoming]} />;
}

const styles = StyleSheet.create({
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  live: { backgroundColor: '#22C55E' },
  upcoming: { backgroundColor: '#D97706' },
  cash: { backgroundColor: '#3B82F6' },
  home: { backgroundColor: '#6B7280' },
  major: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0A0A0A',
    borderColor: '#D97706',
    borderWidth: 2,
  },
});
