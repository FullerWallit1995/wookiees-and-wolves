import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const recoveryUrl = Linking.useLinkingURL();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [saving, setSaving] = useState(false);
  const [sessionReady, setSessionReady] =
    useState(false);
  const [sessionError, setSessionError] =
    useState(false);

  useEffect(() => {
    async function createRecoverySession() {
      if (!recoveryUrl) {
        return;
      }

      try {
        setSessionError(false);

        /*
         * Supabase recovery links may return their
         * authentication information in the URL fragment:
         *
         * #access_token=...
         * &refresh_token=...
         * &type=recovery
         *
         * Linking.parse() does not reliably expose URL
         * fragments, so parse the fragment directly.
         */

        const fragment = recoveryUrl.includes('#')
          ? recoveryUrl.split('#')[1]
          : '';

        const fragmentParams =
          new URLSearchParams(fragment);

        const accessToken =
          fragmentParams.get('access_token');

        const refreshToken =
          fragmentParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (error) {
            console.log(
              'Could not create recovery session:',
              error
            );

            setSessionError(true);
            return;
          }

          setSessionReady(true);
          return;
        }

        /*
         * Also support a PKCE-style recovery URL
         * containing ?code=...
         */

        const parsed = Linking.parse(recoveryUrl);

        const code =
          typeof parsed.queryParams?.code === 'string'
            ? parsed.queryParams.code
            : null;

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(
              code
            );

          if (error) {
            console.log(
              'Could not exchange recovery code:',
              error
            );

            setSessionError(true);
            return;
          }

          setSessionReady(true);
          return;
        }

        console.log(
          'Recovery URL did not contain authentication credentials.'
        );

        setSessionError(true);
      } catch (error) {
        console.log(
          'Password recovery session error:',
          error
        );

        setSessionError(true);
      }
    }

    createRecoverySession();
  }, [recoveryUrl]);

  async function updatePassword() {
    if (!sessionReady) {
      Alert.alert(
        'Reset link not ready',
        sessionError
          ? 'This password reset link is invalid or has expired. Request a new reset link and try again.'
          : 'Your password reset link is still being verified. Try again in a moment.'
      );

      return;
    }

    if (!password || !confirmPassword) {
      Alert.alert(
        'Missing information',
        'Enter and confirm your new password.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password too short',
        'Use at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Make sure both passwords are the same.'
      );
      return;
    }

    try {
      setSaving(true);

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        Alert.alert(
          'Could not update password',
          error.message
        );
        return;
      }

      Alert.alert(
        'Password updated',
        'Your Wookiees & Wolves password has been changed.',
        [
          {
            text: 'Continue',
            onPress: () =>
              router.replace('/profile'),
          },
        ]
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>
            W&W ACCOUNT
          </Text>

          <Text style={styles.title}>
            Choose a New Password
          </Text>

          <Text style={styles.subtitle}>
            Enter a new password for your
            Wookiees & Wolves account.
          </Text>

          {sessionError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                Reset link unavailable
              </Text>

              <Text style={styles.errorText}>
                This password reset link is invalid
                or has expired. Request a new reset
                link and try again.
              </Text>

              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.replace(
                    '/forgot-password'
                  )
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  REQUEST NEW LINK
                </Text>
              </Pressable>
            </View>
          )}

          {!sessionError && (
            <>
              <Text style={styles.label}>
                NEW PASSWORD
              </Text>

              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#53697B"
                secureTextEntry
                autoCapitalize="none"
                editable={sessionReady}
              />

              <Text
                style={[
                  styles.label,
                  styles.confirmLabel,
                ]}
              >
                CONFIRM PASSWORD
              </Text>

              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Enter password again"
                placeholderTextColor="#53697B"
                secureTextEntry
                autoCapitalize="none"
                editable={sessionReady}
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  (saving || !sessionReady) &&
                    styles.disabledButton,
                ]}
                disabled={
                  saving || !sessionReady
                }
                onPress={updatePassword}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {!sessionReady
                    ? 'VERIFYING LINK...'
                    : saving
                      ? 'UPDATING...'
                      : 'UPDATE PASSWORD'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 50,
  },

  eyebrow: {
    color: '#75C7F0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  title: {
    color: '#F3EFE3',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 5,
  },

  subtitle: {
    color: '#8FA2B3',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    marginBottom: 28,
  },

  label: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  confirmLabel: {
    marginTop: 18,
  },

  input: {
    backgroundColor: '#0B1723',
    borderWidth: 1,
    borderColor: '#2A4053',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#F3EFE3',
    fontSize: 16,
  },

  primaryButton: {
    backgroundColor: '#75C7F0',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 24,
  },

  primaryButtonText: {
    color: '#07111F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  disabledButton: {
    opacity: 0.55,
  },

  errorCard: {
    backgroundColor: '#21181D',
    borderWidth: 1,
    borderColor: '#55383D',
    borderRadius: 18,
    padding: 18,
  },

  errorTitle: {
    color: '#F3EFE3',
    fontSize: 17,
    fontWeight: '900',
  },

  errorText: {
    color: '#C3A0A4',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },

  secondaryButtonText: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});