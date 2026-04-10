import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ChevronRight,
  LogOut,
  X,
  Briefcase,
} from 'lucide-react-native';

interface OrganizerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/organizer/dashboard' },
  { label: 'Meus Eventos', icon: Calendar, href: '/organizer/events' },
  { label: 'Interesses', icon: Users, href: '/organizer/requests' },
  { label: 'Contratar Dealer', icon: Briefcase, href: '/organizer/dealer' },
] as const;

export function OrganizerMenu({ isOpen, onClose }: OrganizerMenuProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Menu panel */}
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>FindPoker</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.closeBtn}
            onPress={onClose}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Organizador</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.createBtn}
          onPress={() => {
            onClose();
            router.push('/organizer/create-event' as never);
          }}
        >
          <Text style={styles.createBtnText}>+ Criar Evento</Text>
        </TouchableOpacity>

        <View style={styles.nav}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.href}
              activeOpacity={0.7}
              style={styles.navItem}
              onPress={() => {
                onClose();
                router.push(item.href as never);
              }}
            >
              <item.icon size={18} color="rgba(255,255,255,0.6)" />
              <Text style={styles.navLabel}>{item.label}</Text>
              <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <LogOut size={16} color="rgba(255,255,255,0.4)" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 40,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: Colors.dark,
    zIndex: 50,
    paddingHorizontal: 20,
    paddingVertical: 60,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    color: Colors.white,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  createBtn: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  nav: { gap: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  logoutBtn: {
    position: 'absolute',
    bottom: 48,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  logoutText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
});
