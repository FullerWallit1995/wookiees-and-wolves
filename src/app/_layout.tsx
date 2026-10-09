
import {
  ProfileOnboardingProvider,
  useProfileOnboarding,
} from '@/contexts/profile-onboarding-context';
import { Stack } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootNavigator() {
  const { status, errorMessage, refreshProfile } =
    useProfileOnboarding();

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#75C7F0" />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Could not check your profile.
        </Text>
        <Text style={styles.errorDetail}>
          {errorMessage}
        </Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => void refreshProfile()}
        >
          <Text style={styles.retryText}>TRY AGAIN</Text>
        </Pressable>
      </View>
    );
  }

  const needsProfile = status === 'incomplete';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!needsProfile}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="aurebesh" />
        <Stack.Screen name="archive-movies" />
        <Stack.Screen name="archive-community" />
        <Stack.Screen name="archive-ranking/[userId]" />
        <Stack.Screen name="member/[userId]" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="account-privacy" />
        <Stack.Screen name="explore" />
<Stack.Screen name="disclaimer" />
      </Stack.Protected>

      <Stack.Protected guard={needsProfile}>
        <Stack.Screen name="complete-profile" />
      </Stack.Protected>
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
<Stack.Screen name="reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProfileOnboardingProvider>
        <RootNavigator />
      </ProfileOnboardingProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#07111F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#F3EFE3',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorDetail: {
    color: '#8FA2B3',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#75C7F0',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 20,
  },
  retryText: {
    color: '#07111F',
    fontWeight: '900',
  },
});
