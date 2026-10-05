import { supabase } from '@/lib/supabase';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ArchiveMovie = {
  item_id: number;
  rank: number;
  title: string;
};

export default function MemberProfileScreen() {
  const router = useRouter();

  const { userId } = useLocalSearchParams<{
    userId: string;
  }>();

  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] =
    useState('W&W Member');

  const [username, setUsername] =
    useState('');

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null);

  const [archiveMovies, setArchiveMovies] =
    useState<ArchiveMovie[]>([]);

  const [predictorAccuracy, setPredictorAccuracy] =
    useState<number | null>(null);

  const [predictorGraded, setPredictorGraded] =
    useState(0);

  const [predictorRank, setPredictorRank] =
    useState<number | null>(null);

  const [predictorEntries, setPredictorEntries] =
    useState(0);

  const loadMember =
    useCallback(async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select(
            'display_name, username, avatar_url'
          )
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) {
          console.log(
            'Could not load member profile:',
            profileError
          );
        }

        if (profile) {
          setDisplayName(
            profile.display_name ||
              profile.username ||
              'W&W Member'
          );

          setUsername(profile.username || '');

          setAvatarUrl(
            profile.avatar_url ?? null
          );
        }

        const {
          data: archiveData,
          error: archiveError,
        } = await supabase
          .from('archive_rankings')
          .select(`
            item_id,
            rank,
            archive_items!inner (
              title
            )
          `)
          .eq('user_id', userId)
          .eq('ranking_type', 'movies')
          .order('rank', {
            ascending: true,
          })
          .limit(3);

        if (archiveError) {
          console.log(
            'Could not load member Archives:',
            archiveError
          );

          setArchiveMovies([]);
        } else {
          setArchiveMovies(
            (archiveData ?? []).map(
              (row: any) => ({
                item_id: Number(row.item_id),
                rank: Number(row.rank),
                title: row.archive_items.title,
              })
            )
          );
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
            'Could not load member Predictor stats:',
            leaderboardError
          );

          return;
        }

        const leaderboard =
          leaderboardData ?? [];

        const qualified =
          leaderboard.filter(
            (entry: any) => entry.qualified
          );

        setPredictorEntries(
          qualified.length
        );

        const memberEntry =
          leaderboard.find(
            (entry: any) =>
              entry.user_id === userId
          );

        if (!memberEntry) {
          setPredictorAccuracy(null);
          setPredictorGraded(0);
          setPredictorRank(null);
          return;
        }

        const graded =
          Number(memberEntry.graded) || 0;

        setPredictorGraded(graded);

        setPredictorAccuracy(
          graded > 0
            ? Number(memberEntry.accuracy)
            : null
        );

        if (memberEntry.qualified) {
          const index =
            qualified.findIndex(
              (entry: any) =>
                entry.user_id === userId
            );

          setPredictorRank(
            index >= 0 ? index + 1 : null
          );
        } else {
          setPredictorRank(null);
        }
      } finally {
        setLoading(false);
      }
    }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadMember();
    }, [loadMember])
  );

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

        {loading ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Loading member...
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.eyebrow}>
              W&W MEMBER
            </Text>

            <Text style={styles.title}>
              Profile
            </Text>

            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text
                  style={styles.avatarFallbackText}
                >
                  {displayName
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.displayName}>
              {displayName}
            </Text>

            {!!username && (
              <Text style={styles.username}>
                @{username}
              </Text>
            )}

            <Text style={styles.sectionLabel}>
              THE ARCHIVES
            </Text>

            <View style={styles.card}>
              {archiveMovies.length > 0 ? (
                <>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text
                        style={styles.cardEyebrow}
                      >
                        STAR WARS
                      </Text>

                      <Text
                        style={styles.cardTitle}
                      >
                        Movies
                      </Text>
                    </View>

                    <Text style={styles.topThree}>
                      TOP 3
                    </Text>
                  </View>

                  <View style={styles.archiveList}>
                    {archiveMovies.map(
                      (movie) => (
                        <View
                          key={movie.item_id}
                          style={
                            styles.archiveRow
                          }
                        >
                          <View
                            style={
                              styles.archiveRank
                            }
                          >
                            <Text
                              style={
                                styles.archiveRankText
                              }
                            >
                              {String(
                                movie.rank
                              ).padStart(2, '0')}
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.archiveTitle
                            }
                          >
                            {movie.title}
                          </Text>
                        </View>
                      )
                    )}
                  </View>

                  <Pressable
                    style={styles.cardButton}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/archive-ranking/[userId]',
                        params: {
                          userId,
                        },
                      })
                    }
                  >
                    <Text
                      style={
                        styles.cardButtonText
                      }
                    >
                      VIEW FULL RANKING
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>
                    No Movie Archives yet
                  </Text>

                  <Text style={styles.emptyText}>
                    This member hasn't submitted
                    a Star Wars movie ranking.
                  </Text>
                </>
              )}
            </View>

            <Text style={styles.sectionLabel}>
              WOLVES PREDICTOR
            </Text>

            <View style={styles.card}>
              {predictorGraded > 0 ? (
                <>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>
                      ACCURACY
                    </Text>

                    <Text style={styles.statValue}>
                      {predictorAccuracy !== null
                        ? `${predictorAccuracy.toFixed(
                            1
                          )}%`
                        : '—'}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>
                      GRADED PICKS
                    </Text>

                    <Text style={styles.statValue}>
                      {predictorGraded}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>
                      CURRENT RANK
                    </Text>

                    <Text style={styles.statValue}>
                      {predictorRank
                        ? `#${predictorRank} of ${predictorEntries}`
                        : 'Not qualified'}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>
                    No graded picks yet
                  </Text>

                  <Text style={styles.emptyText}>
                    Predictor stats will appear
                    here once this member has
                    graded picks.
                  </Text>
                </>
              )}
            </View>
          </>
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
    paddingHorizontal: 18,
    paddingBottom: 60,
    alignItems: 'center',
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
    marginBottom: 24,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#75C7F0',
  },

  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#162A3C',
    borderWidth: 2,
    borderColor: '#75C7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarFallbackText: {
    color: '#F3EFE3',
    fontSize: 34,
    fontWeight: '900',
  },

  displayName: {
    color: '#F3EFE3',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 16,
  },

  username: {
    color: '#75C7F0',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },

  sectionLabel: {
    width: '100%',
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 30,
    marginBottom: 8,
  },

  card: {
    width: '100%',
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 18,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  cardEyebrow: {
    color: '#75C7F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  cardTitle: {
    color: '#F3EFE3',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },

  topThree: {
    color: '#60778A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  archiveList: {
    marginTop: 14,
    gap: 7,
  },

  archiveRow: {
    minHeight: 46,
    backgroundColor: '#0B1723',
    borderRadius: 10,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  archiveRank: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#162A3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  archiveRankText: {
    color: '#75C7F0',
    fontSize: 11,
    fontWeight: '900',
  },

  archiveTitle: {
    flex: 1,
    color: '#F3EFE3',
    fontSize: 13,
    fontWeight: '800',
  },

  cardButton: {
    backgroundColor: '#172A3C',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 16,
  },

  cardButtonText: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statLabel: {
    color: '#7F94A7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  statValue: {
    color: '#F3EFE3',
    fontSize: 16,
    fontWeight: '900',
  },

  divider: {
    height: 1,
    backgroundColor: '#20354A',
    marginVertical: 14,
  },

  emptyTitle: {
    color: '#F3EFE3',
    fontSize: 16,
    fontWeight: '900',
  },

  emptyText: {
    color: '#8FA2B3',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  statusCard: {
    width: '100%',
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },

  statusText: {
    color: '#8FA2B3',
    fontSize: 13,
    fontWeight: '700',
  },
});