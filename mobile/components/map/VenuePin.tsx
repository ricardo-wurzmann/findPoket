import { View, StyleSheet } from 'react-native';

export function VenuePin() {
  return <View style={styles.pin} />;
}

const styles = StyleSheet.create({
  pin: {
    width: 14,
    height: 14,
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E1D1A',
  },
});
