
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
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

export default function CompleteProfileScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function saveProfile() {
    if (saving || signingOut) return;

    const cleanDisplayName = displayName.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanDisplayName || !cleanUsername) {
      Alert.alert(
        'Missing information',
        'Enter both a display name and username.'
      );
      return;
    }

    if (
      cleanUsername.length < 3 ||
      !/^[a-z0-9_]+$/.test(cleanUsername)
    ) {
      Alert.alert(
        'Invalid username',
        'Use at least 3 characters. Only letters, numbers and underscores are allowed.'
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          'Session expired',
          'Please sign in again to complete your profile.'
        );
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            display_name: cleanDisplayName,
            username: cleanUsername,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        if (error.code === '23505') {
          Alert.alert(
            'Username unavailable',
            'That username is already being used.'
          );
        } else {
          Alert.alert(
            'Could not save profile',
            error.message
          );
        }
        return;
      }

      // The root onboarding gate will verify that
      // this profile is complete before allowing
      // normal member navigation.
      router.replace('/');

    } catch (error: unknown) {
      Alert.alert(
        'Could not save profile',
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    if (saving || signingOut) return;

    try {
      setSigningOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        Alert.alert('Could not sign out', error.message);
        return;
      }

      router.replace('/');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>
            W&W MEMBER SETUP
          </Text>

          <Text style={styles.title}>
            Welcome to The Den.
          </Text>

          <Text style={styles.subtitle}>
            Before you join the community, let's set up
            your Wookiees & Wolves identity.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>DISPLAY NAME</Text>

            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How should we call you?"
              placeholderTextColor="#53697B"
              maxLength={40}
            />

            <Text style={styles.label}>USERNAME</Text>

            <View style={styles.usernameRow}>
              <Text style={styles.atSymbol}>@</Text>

              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor="#53697B"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={24}
              />
            </View>

            <Text style={styles.help}>
              At least 3 characters. Letters, numbers
              and underscores only.
            </Text>

            <Pressable
              style={[
                styles.primaryButton,
                (saving || signingOut) && styles.disabled,
              ]}
              disabled={saving || signingOut}
              onPress={saveProfile}
            >
              {saving ? (
                <ActivityIndicator color="#07111F" />
              ) : (
                <Text style={styles.primaryText}>
                  ENTER W&W
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
            style={styles.signOutButton}
            disabled={saving || signingOut}
            onPress={signOut}
          >
            <Text style={styles.signOutText}>
              {signingOut ? 'SIGNING OUT...' : 'SIGN OUT'}
            </Text>
          </Pressable>

          <Text style={styles.footer}>
            Your display name and username will be
            visible to other W&W members.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 35,
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
    fontSize: 32,
    fontWeight: '900',
    marginTop: 12,
  },
  subtitle: {
    color: '#8FA2B3',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 20,
  },
  label: {
    color: '#75C7F0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 9,
    marginTop: 15,
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
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1723',
    borderWidth: 1,
    borderColor: '#2A4053',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  atSymbol: {
    color: '#75C7F0',
    fontSize: 16,
    fontWeight: '900',
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 13,
    color: '#F3EFE3',
    fontSize: 16,
  },
  help: {
    color: '#8FA2B3',
    fontSize: 11,
    marginTop: 9,
  },
  primaryButton: {
    backgroundColor: '#75C7F0',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  primaryText: {
    color: '#07111F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.55,
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  signOutText: {
    color: '#C98389',
    fontSize: 12,
    fontWeight: '900',
  },
  footer: {
    color: '#708599',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
  },
});
