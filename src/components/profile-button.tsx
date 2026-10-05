import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ProfileButton() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null);

  const [fallbackText, setFallbackText] =
    useState('');

  const loadProfileButton =
    useCallback(async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (!currentUser) {
        setAvatarUrl(null);
        setFallbackText('');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      setAvatarUrl(
        profile?.avatar_url ?? null
      );

      const fallback =
        profile?.display_name ||
        currentUser.email ||
        'W';

      setFallbackText(
        fallback.charAt(0).toUpperCase()
      );
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileButton();
    }, [loadProfileButton])
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={() =>
        router.push('/profile')
      }
      accessibilityRole="button"
      accessibilityLabel={
        user
          ? 'Open profile'
          : 'Sign in or create account'
      }
    >
      {user ? (
        avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>
              {fallbackText}
            </Text>
          </View>
        )
      ) : (
        <View style={styles.guest}>
          <Text style={styles.guestText}>
            W&W
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#31516B',
    backgroundColor: '#101D2B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  buttonPressed: {
    opacity: 0.7,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  fallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#162A3C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fallbackText: {
    color: '#F3EFE3',
    fontSize: 15,
    fontWeight: '900',
  },

  guest: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestText: {
    color: '#75C7F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});