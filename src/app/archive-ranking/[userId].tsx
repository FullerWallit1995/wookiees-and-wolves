import { supabase } from '@/lib/supabase';
import {
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RankedMovie = {
  item_id: number;
  rank: number;
  title: string;
};

export default function ArchiveRankingScreen() {
  const router = useRouter();

  const { userId } = useLocalSearchParams<{
    userId: string;
  }>();

  const [movies, setMovies] =
    useState<RankedMovie[]>([]);

  const [displayName, setDisplayName] =
    useState('W&W Member');

  const [username, setUsername] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const loadRanking =
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
          .select('display_name, username')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) {
          console.log(
            'Could not load Archive profile:',
            profileError
          );
        }

        if (profile) {
          setDisplayName(
            profile.display_name ||
              'W&W Member'
          );

          setUsername(
            profile.username || ''
          );
        }

        const {
          data: rankingData,
          error: rankingError,
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
          });

        if (rankingError) {
          console.log(
            'Could not load member Archives:',
            rankingError
          );

          setMovies([]);
          return;
        }

        setMovies(
          (rankingData ?? []).map(
            (row: any) => ({
              item_id: Number(row.item_id),
              rank: Number(row.rank),
              title: row.archive_items.title,
            })
          )
        );
      } finally {
        setLoading(false);
      }
    }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadRanking();
    }, [loadRanking])
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

        <Text style={styles.eyebrow}>
          THE ARCHIVES
        </Text>

        <Text style={styles.title}>
          Movie Ranking
        </Text>

        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>
            {displayName}
          </Text>

          {!!username && (
            <Text style={styles.username}>
              @{username}
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Reading the Archives...
            </Text>
          </View>
        ) : movies.length === 0 ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>
              No ranking yet
            </Text>

            <Text style={styles.statusText}>
              This member hasn't submitted a
              Star Wars movie ranking yet.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              STAR WARS MOVIES
            </Text>

            {movies.map((movie) => (
              <View
                key={movie.item_id}
                style={styles.movieRow}
              >
                <View style={styles.rankBox}>
                  <Text style={styles.rankNumber}>
                    {String(movie.rank).padStart(
                      2,
                      '0'
                    )}
                  </Text>
                </View>

                <Text style={styles.movieTitle}>
                  {movie.title}
                </Text>
              </View>
            ))}
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
  },

  backButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 30,
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
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  title: {
    color: '#F3EFE3',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 5,
  },

  memberHeader: {
    marginTop: 12,
    marginBottom: 26,
  },

  memberName: {
    color: '#F3EFE3',
    fontSize: 16,
    fontWeight: '900',
  },

  username: {
    color: '#75C7F0',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },

  sectionLabel: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  movieRow: {
    minHeight: 58,
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rankBox: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: '#162A3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rankNumber: {
    color: '#75C7F0',
    fontSize: 13,
    fontWeight: '900',
  },

  movieTitle: {
    flex: 1,
    color: '#F3EFE3',
    fontSize: 14,
    fontWeight: '800',
  },

  statusCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },

  statusTitle: {
    color: '#F3EFE3',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },

  statusText: {
    color: '#8FA2B3',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 5,
  },
});