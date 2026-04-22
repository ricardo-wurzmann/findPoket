import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Navigation } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useVenues } from '@/hooks/useVenues';
import { useSeries } from '@/hooks/useSeries';
import { VenuePin } from '@/components/map/VenuePin';
import { SeriesPin } from '@/components/map/SeriesPin';
import { EventFilter } from '@/types';

const FILTER_CHIPS: { key: EventFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'venues', label: 'Casas' },
  { key: 'series', label: 'Séries' },
];

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0f0f0d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b6660' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f0d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e1d1a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2a2926' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a08' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  const { venues, loading: venuesLoading } = useVenues();
  const { series, loading: seriesLoading } = useSeries();

  const showVenues = activeFilter === 'all' || activeFilter === 'venues';
  const showSeries = activeFilter === 'all' || activeFilter === 'series';

  const seriesPins = series.filter((s) => s.lat != null && s.lng != null);

  const handleMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão negada',
        'Ative a localização nas configurações para usar este recurso.'
      );
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      1000
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: -23.5505,
          longitude: -46.6333,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={darkMapStyle}
      >
        {!venuesLoading &&
          showVenues &&
          venues.map((venue) => (
            <Marker
              key={venue.id}
              coordinate={{
                latitude: venue.lat,
                longitude: venue.lng,
              }}
              onPress={() => router.push(`/venues/${venue.id}`)}
            >
              <VenuePin />
            </Marker>
          ))}
        {!seriesLoading &&
          showSeries &&
          seriesPins.map((s) => (
            <Marker
              key={s.id}
              coordinate={{
                latitude: s.lat!,
                longitude: s.lng!,
              }}
              onPress={() => router.push(`/series/${s.id}`)}
            >
              <SeriesPin />
            </Marker>
          ))}
      </MapView>

      <View style={[styles.filtersWrapper, { top: insets.top + 72 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.key}
              activeOpacity={0.7}
              style={[styles.chip, activeFilter === chip.key && styles.chipActive]}
              onPress={() => setActiveFilter(chip.key)}
            >
              <Text style={[styles.chipText, activeFilter === chip.key && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.locationBtn, { bottom: insets.bottom + 100 }]}
        activeOpacity={0.8}
        onPress={handleMyLocation}
      >
        <Navigation size={20} color={Colors.white} />
      </TouchableOpacity>

      {(venuesLoading || seriesLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.green} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  filters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.dark,
  },
  chipActive: {
    backgroundColor: Colors.white,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.dark,
  },
  locationBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1D1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
