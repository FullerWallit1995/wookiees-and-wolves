
import { checkProfileCompletion } from '@/lib/profile-completion';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type GateState = 'checking' | 'guest' | 'complete' | 'incomplete' | 'error';

export default function ProfileOnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<GateState>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const requestId = useRef(0);

  async function check() {
    const currentRequest = ++requestId.current;
    setStatus('checking');

    const { data, error } = await supabase.auth.getSession();

    if (currentRequest !== requestId.current) return;

    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
      return;
    }

    if (!data.session?.user) {
      setStatus('guest');
      return;
    }

    const result = await checkProfileCompletion(data.session.user.id);

    if (currentRequest !== requestId.current) return;

    if (result.status === 'error') {
      setErrorMessage(result.message);
      setStatus('error');
      return;
    }

    setStatus(result.status);
  }

  useEffect(() => {
    check();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(() => {
        // Defer database work outside the auth callback.
        setTimeout(() => {
          check();
        }, 0);
      });

    return () => {
      requestId.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status !== 'incomplete') return;

 if (
  pathname === '/complete-profile' ||
  pathname === '/verify-email'
) {
  return;
}

router.replace('/complete-profile');
  }, [status, pathname, router]);

  if (status === 'checking') {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator color="#75C7F0" />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.overlay}>
        <Text style={styles.message}>
          Could not check your profile.
        </Text>
        <Text style={styles.detail}>{errorMessage}</Text>
        <Pressable style={styles.button} onPress={check}>
          <Text style={styles.buttonText}>TRY AGAIN</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
overlay: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: '#07111F',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  zIndex: 100,
},
  message: {
    color: '#F3EFE3',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  detail: {
    color: '#8FA2B3',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#75C7F0',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 20,
  },
  buttonText: {
    color: '#07111F',
    fontWeight: '900',
  },
});
