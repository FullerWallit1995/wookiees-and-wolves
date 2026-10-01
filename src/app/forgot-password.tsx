import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendResetEmail() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert(
        'Enter your email',
        'Enter the email address associated with your W&W account.'
      );
      return;
    }

    try {
      setSending(true);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              'wookieesandwolves://reset-password',
          }
        );

      if (error) {
        Alert.alert(
          'Could not send reset email',
          error.message
        );
        return;
      }

      setSent(true);
    } finally {
      setSending(false);
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
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              ‹ BACK
            </Text>
          </Pressable>

          <Text style={styles.eyebrow}>
            W&W ACCOUNT
          </Text>

          <Text style={styles.title}>
            Reset Password
          </Text>

          {!sent ? (
            <>
              <Text style={styles.subtitle}>
                Enter the email associated with your W&W
                account and we'll send you a password
                reset link.
              </Text>

              <View style={styles.formCard}>
                <Text style={styles.label}>
                  EMAIL
                </Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#53697B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Pressable
                  style={[
                    styles.primaryButton,
                    sending && styles.disabledButton,
                  ]}
                  disabled={sending}
                  onPress={sendResetEmail}
                >
                  <Text style={styles.primaryButtonText}>
                    {sending
                      ? 'SENDING...'
                      : 'SEND RESET LINK'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.successCard}>
              <Text style={styles.successEyebrow}>
                CHECK YOUR EMAIL
              </Text>

              <Text style={styles.successTitle}>
                Reset link sent
              </Text>

              <Text style={styles.successText}>
                If an account exists for {email.trim()},
                you'll receive an email with a link to
                choose a new password.
              </Text>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.back()}
              >
                <Text style={styles.secondaryButtonText}>
                  BACK TO SIGN IN
                </Text>
              </Pressable>
            </View>
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
    paddingBottom: 50,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 30,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#162A3C',
    borderWidth: 1,
    borderColor: '#2C4A61',
    borderRadius: 9,
  },

  backButtonText: {
    color: '#75C7F0',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
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

  formCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 18,
  },

  label: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
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
    marginTop: 20,
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

  successCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 18,
    padding: 20,
    marginTop: 28,
  },

  successEyebrow: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  successTitle: {
    color: '#F3EFE3',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },

  successText: {
    color: '#8FA2B3',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
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