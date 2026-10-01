import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    mode?: string;
  }>();

  const [mode, setMode] = useState<Mode>(
    params.mode === 'login' ? 'login' : 'signup'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [verificationEmail, setVerificationEmail] =
    useState<string | null>(null);

  const [resending, setResending] = useState(false);

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        'Missing information',
        'Enter your email and password.'
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

    try {
      setLoading(true);

      if (mode === 'signup') {
        const { data, error } =
          await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              emailRedirectTo:
                'wookieesandwolves://verify-email',
            },
          });

        if (error) {
          Alert.alert(
            'Could not create account',
            error.message
          );
          return;
        }

        /*
         * If Supabase gives us a session immediately,
         * email confirmation is not required.
         *
         * With Confirm Email enabled, normal new
         * signups should instead reach the branch below.
         */
        if (data.session) {
          Alert.alert(
            'Welcome to W&W',
            'Your Wookiees & Wolves account has been created.',
            [
              {
                text: 'Continue',
                onPress: () => router.back(),
              },
            ]
          );

          return;
        }

        /*
         * No session means the account was created but
         * the email still needs to be confirmed.
         */
        setVerificationEmail(cleanEmail);
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (error) {
          Alert.alert(
            'Could not sign in',
            error.message
          );
          return;
        }

        router.back();
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!verificationEmail) {
      return;
    }

    try {
      setResending(true);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo:
            'wookieesandwolves://verify-email',
        },
      });

      if (error) {
        Alert.alert(
          'Could not resend email',
          error.message
        );
        return;
      }

      Alert.alert(
  'Verification requested',
  'If this email is eligible for verification, you’ll receive a new link shortly.'
);
    } finally {
      setResending(false);
    }
  }

  /*
   * After a successful signup requiring verification,
   * replace the normal auth form with a dedicated
   * Check Your Email screen.
   */
  if (verificationEmail) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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
            Check Your Email
          </Text>

          <Text style={styles.subtitle}>
  Verify your email to continue.
</Text>

          <View style={styles.verificationCard}>
            <Text style={styles.verificationEyebrow}>
              VERIFY YOUR EMAIL
            </Text>

            <Text style={styles.verificationTitle}>
              One more step
            </Text>

            <Text style={styles.verificationText}>
  If this email can be used to create a new
  W&W account, you'll receive a verification
  link at:
</Text>

<Text style={styles.verificationEmail}>
  {verificationEmail}
</Text>

<Text style={styles.verificationText}>
  Open the email and tap the verification
  link to continue. Already have a W&W
  account? Sign in instead.
</Text>

            <Pressable
              style={[
                styles.secondaryButton,
                resending && styles.disabledButton,
              ]}
              disabled={resending}
              onPress={resendVerification}
            >
              <Text style={styles.secondaryButtonText}>
                {resending
                  ? 'SENDING...'
                  : 'RESEND VERIFICATION EMAIL'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.signInInsteadButton}
            onPress={() => {
              setVerificationEmail(null);
              setMode('login');
              setPassword('');
            }}
          >
            <Text style={styles.signInInsteadText}>
  ALREADY A MEMBER? SIGN IN
</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
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
            {mode === 'signup'
              ? 'Become a W&W Member'
              : 'Welcome Back'}
          </Text>

          <Text style={styles.subtitle}>
            {mode === 'signup'
              ? 'Create your Wookiees & Wolves account.'
              : 'Sign in to your Wookiees & Wolves account.'}
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

            <Text
              style={[
                styles.label,
                styles.passwordLabel,
              ]}
            >
              PASSWORD
            </Text>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#53697B"
              secureTextEntry
              autoCapitalize="none"
            />

            {mode === 'login' && (
              <Pressable
                style={styles.forgotPasswordButton}
                onPress={() =>
                  router.push('/forgot-password')
                }
              >
                <Text
                  style={styles.forgotPasswordText}
                >
                  FORGOT PASSWORD?
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.primaryButton,
                loading && styles.disabledButton,
              ]}
              disabled={loading}
              onPress={submit}
            >
              <Text style={styles.primaryButtonText}>
                {loading
                  ? 'PLEASE WAIT...'
                  : mode === 'signup'
                    ? 'CREATE ACCOUNT'
                    : 'SIGN IN'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>
              {mode === 'signup'
                ? 'Already a W&W Member?'
                : "Don't have an account?"}
            </Text>

            <Pressable
              onPress={() => {
                setMode(
                  mode === 'signup'
                    ? 'login'
                    : 'signup'
                );

                setPassword('');
              }}
            >
              <Text style={styles.switchAction}>
                {mode === 'signup'
                  ? 'SIGN IN'
                  : 'JOIN W&W'}
              </Text>
            </Pressable>
          </View>
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

  passwordLabel: {
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

  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 4,
  },

  forgotPasswordText: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
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
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  disabledButton: {
    opacity: 0.55,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 22,
  },

  switchPrompt: {
    color: '#7F94A7',
    fontSize: 13,
  },

  switchAction: {
    color: '#75C7F0',
    fontSize: 12,
    fontWeight: '900',
  },

  verificationCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 18,
    padding: 20,
  },

  verificationEyebrow: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  verificationTitle: {
    color: '#F3EFE3',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },

  verificationText: {
    color: '#8FA2B3',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  verificationEmail: {
    color: '#F3EFE3',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
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

  signInInsteadButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },

  signInInsteadText: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});