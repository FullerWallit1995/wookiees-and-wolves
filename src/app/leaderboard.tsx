import {
    useFocusEffect,
    useRouter,
} from 'expo-router';
import {
    useCallback,
    useState,
} from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

type LeaderboardEntry = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  correct: number;
  incorrect: number;
  graded: number;
  accuracy: number;
  qualified: boolean;
};

export default function LeaderboardScreen() {
  const router = useRouter();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);
  const [userChecked, setUserChecked] = useState(false);  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [completedGames, setCompletedGames] =
  useState(0);

  useFocusEffect(
  useCallback(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError(false);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        setCurrentUserId(user?.id ?? null);
        setUserChecked(true);
        const {
  count: completedCount,
  error: resultsError,
} = await supabase
  .from('predictor_results')
  .select('*', {
    count: 'exact',
    head: true,
  })
  .eq('season', '2026-27')
  .eq('final', true);

if (resultsError) {
  console.log(
    'Could not load completed game count:',
    resultsError
  );
} else {
  setCompletedGames(completedCount ?? 0);
}

        const { data, error } = await supabase.rpc(
          'get_predictor_leaderboard',
          {
            target_season: '2026-27',
          }
        );

        if (error) {
          console.log(
            'Could not load Predictor leaderboard:',
            error
          );

          setError(true);
          return;
        }

        setEntries((data ?? []) as LeaderboardEntry[]);
      } finally {
        setLoading(false);
      }
    }

        loadLeaderboard();
  }, [])
);
if (userChecked && !currentUserId) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          2026–27 PREDICTOR
        </Text>

        <Text style={styles.title}>
          Leaderboard
        </Text>

        <Text style={styles.subtitle}>
          See who's calling the Wolves season best.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.emptyTitle}>
            Join the Predictor
          </Text>

          <Text style={styles.statusText}>
            Sign in or create a W&W account to view the
            Predictor leaderboard.
          </Text>

          <Pressable
            style={styles.authButton}
            onPress={() =>
              router.push({
                pathname: '/auth',
                params: { mode: 'signup' },
              })
            }
          >
            <Text style={styles.authButtonText}>
              CREATE ACCOUNT
            </Text>
          </Pressable>

          <Pressable
            style={styles.signInButton}
            onPress={() =>
              router.push({
                pathname: '/auth',
                params: { mode: 'login' },
              })
            }
          >
            <Text style={styles.signInButtonText}>
              SIGN IN
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          2026–27 PREDICTOR
        </Text>

        <Text style={styles.title}>
          Leaderboard
        </Text>

        <Text style={styles.subtitle}>
          See who's calling the Wolves season best.
        </Text>
{completedGames >= 10 && (
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, styles.rankColumn]}>
            RANK
          </Text>

          <Text style={[styles.headerText, styles.userColumn]}>
            MEMBER
          </Text>

          <Text style={[styles.headerText, styles.scoreColumn]}>
  GRADED
</Text>

          <Text style={[styles.headerText, styles.accuracyColumn]}>
            ACC.
          </Text>
        </View>
)}

      {loading ? (
  <View style={styles.statusCard}>
    <Text style={styles.statusText}>
      Loading leaderboard...
    </Text>
  </View>
) : error ? (
  <View style={styles.statusCard}>
    <Text style={styles.statusText}>
      Couldn't load the leaderboard.
    </Text>
  </View>
) : completedGames < 10 ? (
  <View style={styles.statusCard}>
    <Text style={styles.unlockEyebrow}>
      LEADERBOARD OPENS AFTER GAME 10
    </Text>

    <Text style={styles.unlockNumber}>
      {completedGames}/10
    </Text>

    <Text style={styles.statusText}>
      The leaderboard will open once the Wolves
      have completed 10 games.
    </Text>

    <View style={styles.unlockTrack}>
      <View
        style={[
          styles.unlockFill,
          {
            width: `${Math.min(
              (completedGames / 10) * 100,
              100
            )}%`,
          },
        ]}
      />
    </View>
  </View>
) : entries.length === 0 ? (
  <View style={styles.statusCard}>
    <Text style={styles.emptyTitle}>
      No Predictor activity yet
    </Text>

    <Text style={styles.statusText}>
      Members will appear here once their picks begin
      getting graded.
    </Text>
  </View>
) : (
  entries.map((entry, index) => {
    const isCurrentUser =
      entry.user_id === currentUserId;

    const qualifiedRank =
      entry.qualified
        ? entries
            .filter((item) => item.qualified)
            .findIndex(
              (item) =>
                item.user_id === entry.user_id
            ) + 1
        : null;

    const picksNeeded = Math.max(
      0,
      10 - Number(entry.graded)
    );

    return (
      <View
        key={entry.user_id}
        style={[
          styles.entryCard,
          isCurrentUser &&
            styles.currentUserCard,
        ]}
      >
        <View style={styles.rankColumn}>
          <Text
            style={[
              styles.rank,
              qualifiedRank !== null &&
                qualifiedRank <= 3 &&
                styles.topRank,
            ]}
          >
            {entry.qualified
              ? qualifiedRank
              : '—'}
          </Text>
        </View>

        <View style={styles.userColumn}>
          <Text style={styles.displayName}>
            {entry.display_name ||
              entry.username ||
              'W&W Member'}
          </Text>

          {entry.username && (
            <Text style={styles.username}>
              @{entry.username}
              {isCurrentUser ? ' • YOU' : ''}
            </Text>
          )}

          {!entry.qualified && (
            <Text style={styles.qualifyingText}>
              {picksNeeded === 1
                ? '1 more graded pick to qualify'
                : `${picksNeeded} more graded picks to qualify`}
            </Text>
          )}
        </View>

        <View style={styles.scoreColumn}>
          <Text style={styles.score}>
            {entry.graded}
          </Text>

          <Text style={styles.graded}>
            PICKS
          </Text>
        </View>

        <View style={styles.accuracyColumn}>
          <Text style={styles.accuracy}>
            {Number(entry.accuracy).toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  })
)}  

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            How scoring works
          </Text>

          <Text style={styles.infoText}>
  Rankings are based on prediction accuracy from games
  with official final results. Members need at least 10
  graded picks to qualify for a leaderboard rank.
  Ties are broken by more graded picks, then more correct picks.
</Text>
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

  content: {
    paddingHorizontal: 18,
    paddingBottom: 50,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 26,
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

  subtitle: {
    color: '#8FA2B3',
    fontSize: 14,
    marginTop: 7,
    marginBottom: 26,
  },

  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 7,
    alignItems: 'center',
  },

  headerText: {
    color: '#60778A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  rankColumn: {
    width: 45,
  },

  userColumn: {
    flex: 1,
  },

  scoreColumn: {
    width: 62,
    alignItems: 'center',
  },

  accuracyColumn: {
    width: 65,
    alignItems: 'flex-end',
  },

  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginBottom: 8,
  },

  currentUserCard: {
    borderColor: '#75C7F0',
    backgroundColor: '#122536',
  },
qualifyingText: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '800',
  marginTop: 3,
},
  rank: {
    color: '#8FA2B3',
    fontSize: 17,
    fontWeight: '900',
  },

  topRank: {
    color: '#75C7F0',
  },

  displayName: {
    color: '#F3EFE3',
    fontSize: 14,
    fontWeight: '900',
  },

  username: {
    color: '#7F94A7',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  score: {
    color: '#F3EFE3',
    fontSize: 15,
    fontWeight: '900',
  },

  graded: {
    color: '#60778A',
    fontSize: 9,
    marginTop: 1,
  },

  accuracy: {
    color: '#8FD1A7',
    fontSize: 13,
    fontWeight: '900',
  },

  statusCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#F3EFE3',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 5,
  },
unlockEyebrow: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.4,
},

unlockNumber: {
  color: '#F3EFE3',
  fontSize: 38,
  fontWeight: '900',
  marginTop: 8,
  marginBottom: 5,
},

unlockTrack: {
  width: '100%',
  height: 6,
  backgroundColor: '#172636',
  borderRadius: 10,
  overflow: 'hidden',
  marginTop: 16,
},

unlockFill: {
  height: '100%',
  backgroundColor: '#75C7F0',
  borderRadius: 10,
},
  statusText: {
    color: '#8FA2B3',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  infoCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 16,
    padding: 17,
    marginTop: 18,
  },

  infoTitle: {
    color: '#F3EFE3',
    fontSize: 15,
    fontWeight: '900',
  },

  infoText: {
    color: '#7F94A7',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  authButton: {
  width: '100%',
  backgroundColor: '#75C7F0',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
  marginTop: 16,
},

authButtonText: {
  color: '#07111F',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},

signInButton: {
  width: '100%',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
  marginTop: 8,
},

signInButtonText: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},
});