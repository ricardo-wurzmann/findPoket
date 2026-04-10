import { Stack } from 'expo-router';

export default function OrganizerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="create-event" />
      <Stack.Screen name="requests" />
    </Stack>
  );
}
