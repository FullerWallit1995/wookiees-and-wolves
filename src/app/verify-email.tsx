import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type VerificationState =
  | 'verifying'
  | 'success'
  | 'error';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const verificationUrl = Linking.useLinkingURL();

  const [verificationState, setVerificationState] =
    useState<VerificationState>('verifying');

  useEffect(() => {
    async function verifyEmail() {
      if (!verificationUrl) {
        return;
      }

      try {
        setVerificationState('verifying');

        /*
         * Support Supabase links containing
         * access_token / refresh_token.
         */
        const fragment = verificationUrl.includes('#')
          ? verificationUrl.split('#')[1]
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
              'Could not create verified session:',
              error
            );

            setVerificationState('error');
            return;
          }

          setVerificationState('success');
          return;
        }

        /*
         * Also support PKCE-style links
         * containing ?code=...
         */
        const parsed = Linking.parse(verificationUrl);

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
              'Could not exchange verification code:',
              error
            );

            setVerificationState('error');
            return;
          }

          setVerificationState('success');
          return;
        }

        console.log(
          'Verification URL did not contain authentication credentials.'
        );

        setVerificationState('error');
      } catch (error) {
        console.log(
          'Email verification error:',
          error
        );

        setVerificationState('error');
      }
    }

    verifyEmail();
  }, [verificationUrl]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>
          W&W ACCOUNT
        </Text>

        {verificationState === 'verifying' && (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>
              VERIFYING EMAIL
            </Text>

            <Text style={styles.title}>
              Almost there...
            </Text>

            <Text style={styles.description}>
              We're verifying your email and finishing
              your Wookiees & Wolves account.
            </Text>
          </View>
        )}

        {verificationState === 'success' && (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>
              EMAIL VERIFIED
            </Text>

            <Text style={styles.title}>
              Welcome to W&W
            </Text>

            <Text style={styles.description}>
              Your email has been verified and your
              Wookiees & Wolves account is ready.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() =>
                router.replace('/profile')
              }
            >
              <Text style={styles.primaryButtonText}>
                CONTINUE
              </Text>
            </Pressable>
          </View>
        )}

        {verificationState === 'error' && (
          <View
            style={[
              styles.card,
              styles.errorCard,
            ]}
          >
            <Text style={styles.errorEyebrow}>
              VERIFICATION FAILED
            </Text>

            <Text style={styles.title}>
              We couldn't verify that link
            </Text>

            <Text style={styles.description}>
              The verification link may be invalid or
              expired. Return to sign in and request a
              new verification email if needed.
            </Text>

            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                router.replace({
                  pathname: '/auth',
                  params: { mode: 'login' },
                })
              }
            >
              <Text
                style={styles.secondaryButtonText}
              >
                BACK TO SIGN IN
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 18,
  },

  card: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 18,
    padding: 20,
  },

  cardEyebrow: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  title: {
    color: '#F3EFE3',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 6,
  },

  description: {
    color: '#8FA2B3',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  primaryButton: {
    backgroundColor: '#75C7F0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },

  primaryButtonText: {
    color: '#07111F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  errorCard: {
    borderColor: '#55383D',
  },

  errorEyebrow: {
    color: '#C98389',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 22,
  },

  secondaryButtonText: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});