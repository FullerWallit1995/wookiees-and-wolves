import type { User } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
const [username, setUsername] = useState('');
const [profileExists, setProfileExists] = useState(false);
const [likesCount, setLikesCount] = useState(0);
const [pollsVotedCount, setPollsVotedCount] = useState(0);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

if (user) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.log('Could not load profile:', error);
  }

  if (profile) {
    setDisplayName(profile.display_name ?? '');
    setUsername(profile.username ?? '');
    setProfileExists(true);
  }
}
if (user) {
  const { count: likesCount, error: likesError } =
    await supabase
      .from('post_likes')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('user_id', user.id);

  if (likesError) {
    console.log(
      'Could not load like count:',
      likesError
    );
  } else {
    setLikesCount(likesCount ?? 0);
  }

  const { count: votesCount, error: votesError } =
    await supabase
      .from('poll_votes')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('user_id', user.id);

  if (votesError) {
    console.log(
      'Could not load poll count:',
      votesError
    );
  } else {
    setPollsVotedCount(votesCount ?? 0);
  }
}
setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
async function saveProfile() {
  if (!user) {
    return;
  }

  const cleanDisplayName = displayName.trim();
  const cleanUsername = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  if (!cleanDisplayName || !cleanUsername) {
    Alert.alert(
      'Missing information',
      'Enter both a display name and username.'
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

  setDisplayName(cleanDisplayName);
  setUsername(cleanUsername);
  setProfileExists(true);

  Alert.alert(
    'Profile saved',
    'Your Wookiees & Wolves profile is ready.'
  );
}
  async function signOut() {
    Alert.alert(
      'Sign out?',
      'You can sign back in anytime.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();

            if (error) {
              Alert.alert(
                'Could not sign out',
                error.message
              );
            }
          },
        },
      ]
    );
  }

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

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>YOUR W&W</Text>
          <Text style={styles.title}>Profile</Text>

          <View style={styles.guestIcon}>
            <Text style={styles.guestIconText}>W&W</Text>
          </View>

          <Text style={styles.guestTitle}>
            Join The Den
          </Text>

          <Text style={styles.guestDescription}>
            Create an account to build your W&W profile and
            eventually sync your Predictor and Den activity
            across devices.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
  router.push({
    pathname: '/auth',
    params: { mode: 'signup' },
  })
}
          >
            <Text style={styles.primaryButtonText}>
              CREATE ACCOUNT
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
  router.push({
    pathname: '/auth',
    params: { mode: 'login' },
  })
}
          >
            <Text style={styles.secondaryButtonText}>
              SIGN IN
            </Text>
          </Pressable>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Your W&W account
            </Text>

            <Text style={styles.infoText}>
              Your account will eventually connect your Wolves
              predictions, Den activity and W&W profile.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const email = user.email ?? 'W&W Member';

  const memberSince = new Date(
    user.created_at
  ).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>YOUR W&W</Text>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {email.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.email}>
  {profileExists && displayName
    ? displayName
    : email}
</Text>

{profileExists && username ? (
  <Text style={styles.username}>
    @{username}
  </Text>
) : (
  <Text style={styles.memberSince}>
    Set up your W&W profile below
  </Text>
)}

<Text style={styles.memberSince}>
  Member since {memberSince}
</Text>
<View style={styles.profileCard}>
  <Text style={styles.accountLabel}>
    W&W PROFILE
  </Text>

  <Text style={styles.fieldLabel}>
    DISPLAY NAME
  </Text>

  <TextInput
    style={styles.input}
    value={displayName}
    onChangeText={setDisplayName}
    placeholder="Austin"
    placeholderTextColor="#53697B"
    maxLength={40}
  />

  <Text style={styles.fieldLabel}>
    USERNAME
  </Text>

  <View style={styles.usernameInputRow}>
    <Text style={styles.atSymbol}>@</Text>

    <TextInput
      style={styles.usernameInput}
      value={username}
      onChangeText={setUsername}
      placeholder="austin"
      placeholderTextColor="#53697B"
      autoCapitalize="none"
      autoCorrect={false}
      maxLength={24}
    />
  </View>

  <Pressable
    style={styles.saveButton}
    onPress={saveProfile}
  >
    <Text style={styles.saveButtonText}>
      {profileExists
        ? 'SAVE CHANGES'
        : 'SET UP PROFILE'}
    </Text>
  </Pressable>
</View>
        <View style={styles.statsCard}>
  <View style={styles.stat}>
    <Text style={styles.statNumber}>
      {likesCount}
    </Text>

    <Text style={styles.statLabel}>
      POSTS LIKED
    </Text>
  </View>

  <View style={styles.divider} />

  <View style={styles.stat}>
    <Text style={styles.statNumber}>
      {pollsVotedCount}
    </Text>

    <Text style={styles.statLabel}>
      POLLS VOTED
    </Text>
  </View>
</View>

        <View style={styles.accountCard}>
          <Text style={styles.accountLabel}>
            ACCOUNT
          </Text>

          <Text style={styles.accountEmail}>
            {email}
          </Text>
        </View>

        <Pressable
          style={styles.signOutButton}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>
            SIGN OUT
          </Text>
        </Pressable>
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
    paddingBottom: 130,
    alignItems: 'center',
  },

  eyebrow: {
    color: '#75C7F0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 18,
  },

  title: {
    color: '#F3EFE3',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 5,
    marginBottom: 30,
  },

  muted: {
    color: '#8FA2B3',
    fontSize: 14,
    fontWeight: '700',
  },
username: {
  color: '#75C7F0',
  fontSize: 14,
  fontWeight: '800',
  marginTop: 4,
},

profileCard: {
  width: '100%',
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 18,
  padding: 18,
  marginTop: 26,
},

fieldLabel: {
  color: '#7F94A7',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.2,
  marginTop: 16,
  marginBottom: 7,
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

saveButton: {
  backgroundColor: '#75C7F0',
  borderRadius: 9,
  paddingVertical: 12,
  alignItems: 'center',
  marginTop: 18,
},

saveButtonText: {
  color: '#07111F',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1,
},
  guestIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#162A3C',
    borderWidth: 2,
    borderColor: '#75C7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestIconText: {
    color: '#F3EFE3',
    fontSize: 22,
    fontWeight: '900',
  },

  guestTitle: {
    color: '#F3EFE3',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 20,
  },

  guestDescription: {
    color: '#8FA2B3',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    maxWidth: 330,
  },

  primaryButton: {
    width: '100%',
    backgroundColor: '#75C7F0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#07111F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  secondaryButton: {
    width: '100%',
    backgroundColor: '#162A3C',
    borderWidth: 1,
    borderColor: '#2C4A61',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  secondaryButtonText: {
    color: '#75C7F0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  infoCard: {
    width: '100%',
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
  },

  infoTitle: {
    color: '#F3EFE3',
    fontSize: 16,
    fontWeight: '900',
  },

  infoText: {
    color: '#7F94A7',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#162A3C',
    borderWidth: 2,
    borderColor: '#75C7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#F3EFE3',
    fontSize: 34,
    fontWeight: '900',
  },

  email: {
    color: '#F3EFE3',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 16,
  },

  memberSince: {
    color: '#7F94A7',
    fontSize: 13,
    marginTop: 5,
  },

  statsCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    paddingVertical: 20,
    marginTop: 28,
  },

  stat: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    color: '#F3EFE3',
    fontSize: 23,
    fontWeight: '900',
  },

  statLabel: {
    color: '#7F94A7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },

  divider: {
    width: 1,
    backgroundColor: '#20354A',
  },

  accountCard: {
    width: '100%',
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 16,
    padding: 17,
    marginTop: 14,
  },

  accountLabel: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  accountEmail: {
    color: '#DCE5EC',
    fontSize: 14,
    marginTop: 7,
  },

  signOutButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#55383D',
    backgroundColor: '#21181D',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 22,
  },

  signOutText: {
    color: '#C98389',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});