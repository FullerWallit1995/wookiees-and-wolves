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

import { supabase } from '@/lib/supabase';

type LeaderboardEntry = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  correct: number;
  incorrect: number;
  graded: number;
  accuracy: number;
};

export default function LeaderboardScreen() {
  const router = useRouter();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError(false);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        setCurrentUserId(user?.id ?? null);

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
  }, []);

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

        <View style={styles.headerRow}>
          <Text style={[styles.headerText, styles.rankColumn]}>
            RANK
          </Text>

          <Text style={[styles.headerText, styles.userColumn]}>
            MEMBER
          </Text>

          <Text style={[styles.headerText, styles.scoreColumn]}>
            CORRECT
          </Text>

          <Text style={[styles.headerText, styles.accuracyColumn]}>
            ACC.
          </Text>
        </View>

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
        ) : entries.length === 0 ? (
          <View style={styles.statusCard}>
            <Text style={styles.emptyTitle}>
              No submitted picks yet
            </Text>

            <Text style={styles.statusText}>
              Submitted Predictor entries will appear here.
            </Text>
          </View>
        ) : (
          entries.map((entry, index) => {
            const isCurrentUser =
              entry.user_id === currentUserId;

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
                      index < 3 && styles.topRank,
                    ]}
                  >
                    {index + 1}
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
                </View>

                <View style={styles.scoreColumn}>
                  <Text style={styles.score}>
                    {entry.correct}
                  </Text>

                  <Text style={styles.graded}>
                    / {entry.graded}
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
            Rankings are based on correct picks from games
            with official final results. Accuracy updates as
            the season progresses.
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
});