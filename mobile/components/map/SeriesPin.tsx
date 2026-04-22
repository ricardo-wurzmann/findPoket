import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

/** Amber diamond (square rotated 45°) for series on the map */
export function SeriesPin() {
  return (
    <View style={styles.wrap}>
      <View style={styles.diamond} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: 12,
    height: 12,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#1E1D1A',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
});
