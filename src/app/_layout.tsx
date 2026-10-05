import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

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

      <Stack.Screen
  name="leaderboard"
  options={{
    presentation: 'card',
    animation: 'slide_from_right',
  }}
/>
<Stack.Screen
  name="edit-profile"
  options={{
    presentation: 'card',
    animation: 'slide_from_right',
  }}
/>
    </Stack>
    </GestureHandlerRootView>
  );
}