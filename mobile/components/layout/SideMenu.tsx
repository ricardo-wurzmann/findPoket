import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  Settings,
  Megaphone,
  LayoutDashboard,
  Plus,
  ChevronRight,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = 280;

interface SideMenuProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSignOut: () => void;
}

export function SideMenu({ visible, user, onClose, onSignOut }: SideMenuProps) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: visible ? 0 : -MENU_WIDTH,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateX, backdropOpacity]);

  if (!visible && translateX.__getValue() === -MENU_WIDTH) return null;

  const isOrganizer = user?.role === 'ORGANIZER';

  const navigate = (path: string) => {
    onClose();
    setTimeout(() => router.push(path as never), 300);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          { transform: [{ translateX }] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>FindPoker</Text>
          <Text style={styles.suits}>♠ ♥ ♦ ♣</Text>
        </View>

        {user && (
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              {user.handle && (
                <Text style={styles.userHandle}>@{user.handle}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Menu items */}
        {isOrganizer && (
          <>
            <MenuItem
              icon={<LayoutDashboard size={18} color={Colors.white} />}
              label="Dashboard"
              onPress={() => navigate('/organizer/dashboard')}
            />
            <MenuItem
              icon={<Plus size={18} color={Colors.white} />}
              label="Criar Evento"
              onPress={() => navigate('/organizer/create-event')}
            />
            <View style={styles.divider} />
          </>
        )}

        <MenuItem
          icon={<Text style={styles.menuEmoji}>🃏</Text>}
          label="Contratar Dealer"
          onPress={() => navigate('/dealer')}
        />
        <MenuItem
          icon={<Megaphone size={18} color={Colors.white} />}
          label="Anunciar Jogo"
          onPress={() => navigate('/announce')}
        />
        <MenuItem
          icon={<Settings size={18} color={Colors.white} />}
          label="Configurações"
          onPress={() => navigate('/settings')}
        />

        <View style={styles.spacer} />

        <MenuItem
          icon={<LogOut size={18} color={Colors.amber} />}
          label="Sair"
          labelStyle={{ color: Colors.amber }}
          onPress={onSignOut}
        />
      </Animated.View>
    </View>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  labelStyle?: object;
}

function MenuItem({ icon, label, onPress, labelStyle }: MenuItemProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={[styles.menuLabel, labelStyle]}>{label}</Text>
      <ChevronRight size={14} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: Colors.dark,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: { elevation: 24 },
    }),
  },
  header: {
    marginBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontStyle: 'italic',
    color: Colors.white,
    fontWeight: '700',
  },
  suits: {
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 4,
    marginTop: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  userHandle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 24,
    alignItems: 'center',
  },
  menuEmoji: {
    fontSize: 18,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.white,
  },
  spacer: {
    flex: 1,
  },
});
