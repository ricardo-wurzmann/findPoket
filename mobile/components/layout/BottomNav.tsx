import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useMenu } from '@/lib/MenuContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Map, Calendar, Building2, User } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  href: '/(tabs)' | '/(tabs)/agenda' | '/(tabs)/casas' | '/(tabs)/perfil';
}

const TABS: Tab[] = [
  { id: 'mapa', label: 'Mapa', icon: Map, href: '/(tabs)' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, href: '/(tabs)/agenda' },
  { id: 'casas', label: 'Casas', icon: Building2, href: '/(tabs)/casas' },
  { id: 'perfil', label: 'Perfil', icon: User, href: '/(tabs)/perfil' },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { menuOpen } = useMenu();

  if (menuOpen) return null;

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 12 }]}>
      <View style={styles.pill}>
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/(tabs)' && pathname.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => router.push(tab.href)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Icon
                size={18}
                color={isActive ? Colors.white : Colors.textMuted}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: Colors.dark,
    borderRadius: 999,
    padding: 6,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  labelActive: {
    color: Colors.white,
  },
});
