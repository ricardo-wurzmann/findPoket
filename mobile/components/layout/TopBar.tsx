import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Search, Building2, Calendar, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { search } from '@/lib/api/search';
import { SearchResults } from '@/types';
import { getInitials } from '@/lib/utils';
import { useMenu } from '@/lib/MenuContext';

interface TopBarProps {
  userName?: string;
  onMenuPress: () => void;
}

export function TopBar({ userName, onMenuPress }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const { menuOpen } = useMenu();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await search(text);
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const hasResults =
    results &&
    (results.venues.length > 0 ||
      results.events.length > 0 ||
      results.players.length > 0);

  const closeDropdown = () => {
    setFocused(false);
    setQuery('');
    setResults(null);
  };

  if (menuOpen) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {/* Hamburger */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuBtn}
          onPress={onMenuPress}
        >
          <Menu size={20} color={Colors.white} />
        </TouchableOpacity>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Buscar casa, torneio ou jogador..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={handleSearch}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(closeDropdown, 200)}
              returnKeyType="search"
            />
            {searching && <ActivityIndicator size="small" color={Colors.green} />}
          </View>

          {/* Dropdown */}
          {focused && hasResults && (
            <View style={styles.dropdown}>
              {results!.venues.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Casas</Text>
                  {results!.venues.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      activeOpacity={0.7}
                      style={styles.resultRow}
                      onPress={() => {
                        closeDropdown();
                        router.push(`/venues/${v.id}`);
                      }}
                    >
                      <Building2 size={14} color={Colors.textMuted} />
                      <View style={styles.resultText}>
                        <Text style={styles.resultName}>{v.name}</Text>
                        <Text style={styles.resultSub}>
                          {v.district} · {v.city}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {results!.events.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Torneios</Text>
                  {results!.events.map((e) => (
                    <TouchableOpacity
                      key={e.id}
                      activeOpacity={0.7}
                      style={styles.resultRow}
                      onPress={() => {
                        closeDropdown();
                        router.push(`/events/${e.id}`);
                      }}
                    >
                      <Calendar size={14} color={Colors.textMuted} />
                      <View style={styles.resultText}>
                        <Text style={styles.resultName}>{e.name}</Text>
                        <Text style={styles.resultSub}>
                          {e.status === 'LIVE' ? '🟢 Ao vivo' : '🟡 Em breve'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {results!.players.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Jogadores</Text>
                  {results!.players.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.7}
                      style={styles.resultRow}
                    >
                      <Users size={14} color={Colors.textMuted} />
                      <View style={styles.resultText}>
                        <Text style={styles.resultName}>{p.name}</Text>
                        {p.handle && (
                          <Text style={styles.resultSub}>@{p.handle}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Avatar */}
        {userName ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
          </View>
        ) : (
          <View style={[styles.avatar, { backgroundColor: Colors.textMuted }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    flex: 1,
    position: 'relative',
  },
  searchBar: {
    height: 44,
    borderRadius: 999,
    backgroundColor: Colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark,
    borderRadius: 16,
    padding: 12,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 20 },
    }),
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
  resultSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
