
import { useProfileOnboarding } from '@/contexts/profile-onboarding-context';
import { Redirect } from 'expo-router';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function StartupScreen() {
  const { status, errorMessage, refreshProfile } =
    useProfileOnboarding();

  if (status === 'checking' || status === 'error') {
    return (
      <View style={styles.container}>
        {status === 'checking' ? (
          <>
            <ActivityIndicator color="#75C7F0" />
            <Text style={styles.message}>
              Loading Wookiees & Wolves...
            </Text>
          </>
        ) : (
          <Text
            style={styles.message}
            onPress={() => void refreshProfile()}
          >
            Could not load your account. Tap to retry.
            {errorMessage ? `\n${errorMessage}` : ''}
          </Text>
        )}
      </View>
    );
  }

  if (status === 'incomplete') {
    return <Redirect href="/complete-profile" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: '#F3EFE3',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
