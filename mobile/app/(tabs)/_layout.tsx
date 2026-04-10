import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BottomNav } from '@/components/layout/BottomNav';
import { TopBar } from '@/components/layout/TopBar';
import { SideMenu } from '@/components/layout/SideMenu';
import { useAuth } from '@/hooks/useAuth';
import { useMenu } from '@/lib/MenuContext';

export default function TabsLayout() {
  const { dbUser, signOut } = useAuth();
  const { menuOpen, openMenu, closeMenu } = useMenu();

  return (
    <View style={styles.root}>
      <View style={styles.stackContainer}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="agenda" />
          <Stack.Screen name="casas" />
          <Stack.Screen name="perfil" />
        </Stack>
      </View>

      <TopBar userName={dbUser?.name} onMenuPress={openMenu} />

      <BottomNav />

      <SideMenu
        visible={menuOpen}
        user={dbUser}
        onClose={closeMenu}
        onSignOut={signOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stackContainer: {
    flex: 1,
  },
});
