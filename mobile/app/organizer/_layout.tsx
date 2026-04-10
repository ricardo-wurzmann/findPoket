import { Stack } from 'expo-router';
import { MenuProvider } from '@/lib/MenuContext';

export default function OrganizerLayout() {
  return (
    <MenuProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </MenuProvider>
  );
}
