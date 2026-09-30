import type { User } from '@supabase/supabase-js';
import {
  useFocusEffect,
  useRouter,
} from 'expo-router';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
const [username, setUsername] = useState('');
const [avatarUrl, setAvatarUrl] =
  useState<string | null>(null);
  const [role, setRole] =
  useState<'member' | 'admin'>('member');
const [profileExists, setProfileExists] = useState(false);
const [likesCount, setLikesCount] = useState(0);
const [pollsVotedCount, setPollsVotedCount] = useState(0);
const [predictorRecord, setPredictorRecord] =
  useState<string | null>(null);

const [predictorRank, setPredictorRank] =
  useState<number | null>(null);

const [predictorEntries, setPredictorEntries] =
  useState(0);

const [predictorAccuracy, setPredictorAccuracy] =
  useState<number | null>(null);

const [predictorGraded, setPredictorGraded] =
  useState(0);

  const [predictorCompletedGames, setPredictorCompletedGames] =
  useState(0);

  const loadUser = useCallback(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  setUser(user);

  if (!user) {
    setDisplayName('');
    setUsername('');
    setAvatarUrl(null);
    setProfileExists(false);
    setLikesCount(0);
    setPollsVotedCount(0);
    setPredictorRecord(null);
    setPredictorRank(null);
    setPredictorEntries(0);
    setPredictorAccuracy(null);
    setPredictorGraded(0);
    setPredictorCompletedGames(0);
    setLoading(false);
    return;
  }

  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('display_name, username, avatar_url, role')
      .eq('user_id', user.id)
      .maybeSingle();

  if (profileError) {
    console.log(
      'Could not load profile:',
      profileError
    );
  }

  if (profile) {
    setDisplayName(profile.display_name ?? '');
    setUsername(profile.username ?? '');
    setAvatarUrl(profile.avatar_url ?? null);
    setProfileExists(true);
    setRole(
  profile.role === 'admin' ? 'admin' : 'member'
);
  } else {
    setDisplayName('');
    setUsername('');
    setAvatarUrl(null);
    setProfileExists(false);
    setRole('member');
  }

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

  const {
  data: predictionData,
  error: predictionError,
} = await supabase
  .from('predictor_predictions')
  .select('predictions')
  .eq('user_id', user.id)
  .eq('season', '2026-27')
  .maybeSingle();

if (predictionError) {
  console.log(
    'Could not load profile Predictor entry:',
    predictionError
  );
} else if (predictionData?.predictions) {
  const picks =
    predictionData.predictions as Record<
      string,
      'W' | 'L'
    >;

  const values = Object.values(picks);

  if (values.length === 0) {
    setPredictorRecord(null);
  } else {
    const wins = values.filter(
      (pick) => pick === 'W'
    ).length;

    const losses = values.filter(
      (pick) => pick === 'L'
    ).length;

    setPredictorRecord(`${wins}–${losses}`);
  }
} else {
  setPredictorRecord(null);
}

const {
  count: completedCount,
  error: completedError,
} = await supabase
  .from('predictor_results')
  .select('*', {
    count: 'exact',
    head: true,
  })
  .eq('season', '2026-27')
  .eq('final', true);

if (completedError) {
  console.log(
    'Could not load completed Predictor games:',
    completedError
  );
} else {
  setPredictorCompletedGames(completedCount ?? 0);
}

const {
  data: leaderboardData,
  error: leaderboardError,
} = await supabase.rpc(
  'get_predictor_leaderboard',
  {
    target_season: '2026-27',
  }
);

if (leaderboardError) {
  console.log(
    'Could not load profile Predictor rank:',
    leaderboardError
  );
} else {
  const leaderboard = leaderboardData ?? [];

  const qualifiedEntries = leaderboard.filter(
    (entry: { qualified: boolean }) =>
      entry.qualified
  );

  setPredictorEntries(qualifiedEntries.length);

  const userEntry = leaderboard.find(
    (entry: { user_id: string }) =>
      entry.user_id === user.id
  );

  if (userEntry) {
    const graded = Number(userEntry.graded) || 0;

    setPredictorGraded(graded);

    setPredictorAccuracy(
      graded > 0
        ? Number(userEntry.accuracy)
        : null
    );

    if (userEntry.qualified) {
      const qualifiedIndex =
        qualifiedEntries.findIndex(
          (entry: { user_id: string }) =>
            entry.user_id === user.id
        );

      setPredictorRank(
        qualifiedIndex >= 0
          ? qualifiedIndex + 1
          : null
      );
    } else {
      setPredictorRank(null);
    }
  } else {
    setPredictorRank(null);
    setPredictorGraded(0);
    setPredictorAccuracy(null);
  }
}

  setLoading(false);
}, []);

useFocusEffect(
  useCallback(() => {
    loadUser();
  }, [loadUser])
);

useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null);
      setRole('member');

      if (!session?.user) {
        setDisplayName('');
        setUsername('');
        setAvatarUrl(null);
        setProfileExists(false);
        setLikesCount(0);
        setPollsVotedCount(0);
        setPredictorRecord(null);
        setPredictorRank(null);
        setPredictorEntries(0);
        setPredictorAccuracy(null);
        setPredictorGraded(0);
        setPredictorCompletedGames(0);
        setLoading(false);
        setRole('member');
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);

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
            Become a W&W Member
          </Text>

         <Text style={styles.infoText}>
  Create an account to build your W&W profile, make Predictor picks, join the leaderboard, and take part in The Den.
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

        {avatarUrl ? (
  <Image
    source={{ uri: avatarUrl }}
    style={styles.avatarImage}
  />
) : (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>
      {(displayName || email)
        .charAt(0)
        .toUpperCase()}
    </Text>
  </View>
)}

    <View style={styles.profileNameRow}>
  <Text style={styles.email}>
    {profileExists && displayName
      ? displayName
      : email}
  </Text>

  {role === 'admin' && (
    <Image
      source={require('../../../assets/wookiees-wolves-logo.png')}
      style={styles.adminMark}
      resizeMode="contain"
    />
  )}
</View>

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



  <Pressable
  style={styles.editProfileButton}
  onPress={() => router.push('/edit-profile')}
>
  <Text style={styles.editProfileButtonText}>
    EDIT PROFILE
  </Text>
</Pressable>
{role === 'admin' && (
  <Pressable
    style={styles.adminToolsButton}
    onPress={() => router.push('/admin')}
  >
    <Text style={styles.adminToolsButtonText}>
      ADMIN TOOLS
    </Text>
  </Pressable>
)}
<Text style={styles.dashboardSectionLabel}>
  THE DEN
</Text>
<View style={styles.denProfileCard}>
  <View style={styles.denStatsRow}>
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

  <Pressable
    style={styles.denProfileButton}
    onPress={() => router.push('/den')}
  >
    <Text style={styles.denProfileButtonText}>
      VIEW THE DEN
    </Text>
  </Pressable>
</View>
<Text style={styles.dashboardSectionLabel}>
  WOLVES PREDICTOR
</Text>

<View style={styles.predictorProfileCard}>
  {predictorRecord ? (
    <>
      <View style={styles.predictorProfileRow}>
        <Text style={styles.predictorProfileLabel}>
          PREDICTED RECORD
        </Text>

        <Text style={styles.predictorProfileValue}>
          {predictorRecord}
        </Text>
      </View>

      <View style={styles.predictorProfileDivider} />

      <View style={styles.predictorProfileRow}>
  <Text style={styles.predictorProfileLabel}>
    {predictorCompletedGames < 10
      ? 'LEADERBOARD'
      : predictorGraded < 10
        ? 'QUALIFYING'
        : 'CURRENT RANK'}
  </Text>

  <Text style={styles.predictorProfileValue}>
    {predictorCompletedGames < 10
      ? `${predictorCompletedGames}/10 games`
      : predictorGraded < 10
        ? `${predictorGraded}/10 picks`
        : predictorRank
          ? `#${predictorRank} of ${predictorEntries}`
          : '—'}
  </Text>
</View>

      <View style={styles.predictorProfileDivider} />

      <View style={styles.predictorProfileRow}>
        <Text style={styles.predictorProfileLabel}>
          ACCURACY
        </Text>

        <Text style={styles.predictorProfileValue}>
          {predictorAccuracy !== null
            ? `${predictorAccuracy.toFixed(1)}%`
            : predictorGraded > 0
              ? '0.0%'
              : '—'}
        </Text>
      </View>

      <Pressable
        style={styles.predictorProfileButton}
        onPress={() => router.push('/predictor')}
      >
        <Text style={styles.predictorProfileButtonText}>
          VIEW PREDICTOR
        </Text>
      </Pressable>
    </>
  ) : (
    <>
      <Text style={styles.predictorEmptyTitle}>
  Make your first pick
</Text>

<Text style={styles.predictorEmptyText}>
  Pick Wolves wins and losses game by game. Make at
  least 10 graded picks to qualify for the leaderboard.
</Text>

      <Pressable
        style={styles.predictorProfileButton}
        onPress={() => router.push('/predictor')}
      >
        <Text style={styles.predictorProfileButtonText}>
          OPEN PREDICTOR
        </Text>
      </Pressable>
    </>
  )}
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
profileNameRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  marginTop: 16,
},

adminMark: {
  width: 24,
  height: 24,
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
avatarImage: {
  width: 96,
  height: 96,
  borderRadius: 48,
  borderWidth: 2,
  borderColor: '#75C7F0',
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
  },

  memberSince: {
    color: '#7F94A7',
    fontSize: 13,
    marginTop: 5,
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
editProfileButton: {
  backgroundColor: '#162A3C',
  borderWidth: 1,
  borderColor: '#2C4A61',
  borderRadius: 9,
  paddingHorizontal: 16,
  paddingVertical: 10,
  marginTop: 14,
  alignItems: 'center',
},

editProfileButtonText: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
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
dashboardSectionLabel: {
  width: '100%',
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.5,
  marginTop: 30,
  marginBottom: 8,
},
predictorProfileCard: {
  width: '100%',
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 18,
  padding: 18,
},

predictorProfileRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

predictorProfileLabel: {
  color: '#7F94A7',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},

predictorProfileValue: {
  color: '#F3EFE3',
  fontSize: 16,
  fontWeight: '900',
},

predictorProfileDivider: {
  height: 1,
  backgroundColor: '#20354A',
  marginVertical: 14,
},

predictorProfileButton: {
  backgroundColor: '#172A3C',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
  marginTop: 18,
},

predictorProfileButtonText: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},

predictorEmptyTitle: {
  color: '#F3EFE3',
  fontSize: 16,
  fontWeight: '900',
},

predictorEmptyText: {
  color: '#8FA2B3',
  fontSize: 13,
  lineHeight: 19,
  marginTop: 5,
},
denProfileCard: {
  width: '100%',
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 18,
  padding: 18,
},

denStatsRow: {
  flexDirection: 'row',
  minHeight: 52,
},

denProfileButton: {
  backgroundColor: '#172A3C',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
  marginTop: 18,
},

denProfileButtonText: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},
  signOutText: {
    color: '#C98389',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  adminToolsButton: {
  backgroundColor: '#172A3C',
  borderWidth: 1,
  borderColor: '#75C7F0',
  borderRadius: 9,
  paddingHorizontal: 16,
  paddingVertical: 10,
  marginTop: 8,
  alignItems: 'center',
},

adminToolsButtonText: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},
});