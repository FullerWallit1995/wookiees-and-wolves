import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.back();
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, username, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          Alert.alert(
            'Could not load profile',
            error.message
          );
          return;
        }

        setDisplayName(data?.display_name ?? '');
        setUsername(data?.username ?? '');
        setAvatarUrl(data?.avatar_url ?? null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function choosePhoto() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo access to choose a profile picture.'
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (result.canceled) {
      return;
    }

    setNewAvatarUri(result.assets[0].uri);
  }

  async function uploadAvatar() {
    if (!userId || !newAvatarUri) {
      return avatarUrl;
    }

    const response = await fetch(newAvatarUri);
    const arrayBuffer = await response.arrayBuffer();

    const filePath = `${userId}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Cache-bust when somebody replaces their avatar
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function saveProfile() {
    if (!userId) {
      return;
    }

    const cleanDisplayName = displayName.trim();

    const cleanUsername = username
  .trim()
  .toLowerCase();

    if (!cleanDisplayName || !cleanUsername) {
      Alert.alert(
        'Missing information',
        'Enter both a display name and username.'
      );
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
  Alert.alert(
    'Invalid username',
    'Usernames can only contain letters, numbers and underscores.'
  );
  return;
}
if (cleanUsername.length < 3) {
  Alert.alert(
    'Username too short',
    'Use at least 3 characters for your username.'
  );
  return;
}

    try {
      setSaving(true);

      const savedAvatarUrl = await uploadAvatar();

      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            display_name: cleanDisplayName,
            username: cleanUsername,
            avatar_url: savedAvatarUrl,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        if (error.code === '23505') {
          Alert.alert(
            'Username unavailable',
            'That username is already being used.'
          );
          return;
        }

        Alert.alert(
          'Could not save profile',
          error.message
        );
        return;
      }

      Alert.alert(
        'Profile updated',
        'Your Wookiees & Wolves profile has been saved.',
        [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Could not save profile',
        error?.message ?? 'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  }

  const previewUri = newAvatarUri || avatarUrl;

  const initial =
    displayName.trim().charAt(0).toUpperCase() || '?';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
          W&W PROFILE
        </Text>

        <Text style={styles.title}>
          Edit Profile
        </Text>

        <View style={styles.avatarSection}>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {initial}
              </Text>
            </View>
          )}

          <Pressable
            style={styles.photoButton}
            onPress={choosePhoto}
          >
            <Text style={styles.photoButtonText}>
              {previewUri
                ? 'CHANGE PHOTO'
                : 'ADD PHOTO'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>
            DISPLAY NAME
          </Text>

          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor="#53697B"
            maxLength={40}
          />

          <Text style={[styles.label, styles.usernameLabel]}>
            USERNAME
          </Text>

          <View style={styles.usernameInputRow}>
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

          <Text style={styles.usernameHelp}>
            Letters, numbers and underscores only.
          </Text>

          <Pressable
            style={[
              styles.saveButton,
              saving && styles.disabledButton,
            ]}
            disabled={saving}
            onPress={saveProfile}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? 'SAVING...'
                : 'SAVE CHANGES'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 50,
  },

  muted: {
    color: '#8FA2B3',
    fontSize: 14,
    fontWeight: '700',
  },

  backButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 28,
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
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  title: {
    color: '#F3EFE3',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 5,
  },

  avatarSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 26,
  },

  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: '#75C7F0',
  },

  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#162A3C',
    borderWidth: 2,
    borderColor: '#75C7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarFallbackText: {
    color: '#F3EFE3',
    fontSize: 38,
    fontWeight: '900',
  },

  photoButton: {
    backgroundColor: '#172A3C',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 13,
  },

  photoButtonText: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  formCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 18,
  },

  label: {
    color: '#7F94A7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 7,
  },

  usernameLabel: {
    marginTop: 18,
  },

  input: {
    backgroundColor: '#0B1723',
    borderWidth: 1,
    borderColor: '#2A4053',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#F3EFE3',
    fontSize: 15,
  },

  usernameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1723',
    borderWidth: 1,
    borderColor: '#2A4053',
    borderRadius: 10,
    paddingHorizontal: 13,
  },

  atSymbol: {
    color: '#75C7F0',
    fontSize: 15,
    fontWeight: '900',
    marginRight: 2,
  },

  usernameInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#F3EFE3',
    fontSize: 15,
  },

  usernameHelp: {
    color: '#60778A',
    fontSize: 10,
    marginTop: 6,
  },

  saveButton: {
    backgroundColor: '#75C7F0',
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 22,
  },

  saveButtonText: {
    color: '#07111F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  disabledButton: {
    opacity: 0.55,
  },
});