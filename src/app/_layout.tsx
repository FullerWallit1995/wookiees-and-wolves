import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />

      <Stack.Screen
        name="aurebesh"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />

      <Stack.Screen
        name="auth"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}