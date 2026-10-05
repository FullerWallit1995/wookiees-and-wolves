import ProfileButton from '@/components/profile-button';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArchivesScreen() {
  const router = useRouter();

  const [userId, setUserId] =
    useState<string | null>(null);

  const [movieCount, setMovieCount] =
    useState(0);

  const [movieRankedCount, setMovieRankedCount] =
    useState(0);

  const [communityRankings, setCommunityRankings] =
    useState(0);

  const loadArchivesSummary =
    useCallback(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);

      const {
        count: totalMovies,
        error: movieCountError,
      } = await supabase
        .from('archive_items')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('ranking_type', 'movies')
        .eq('active', true);

      if (movieCountError) {
        console.log(
          'Could not load Archive movie count:',
          movieCountError
        );
      } else {
        setMovieCount(totalMovies ?? 0);
      }

      if (user) {
        const {
          count: rankedMovies,
          error: rankedError,
        } = await supabase
          .from('archive_rankings')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('user_id', user.id)
          .eq('ranking_type', 'movies');

        if (rankedError) {
          console.log(
            'Could not load user Archive ranking:',
            rankedError
          );
        } else {
          setMovieRankedCount(
            rankedMovies ?? 0
          );
        }
      } else {
        setMovieRankedCount(0);
      }

      const {
        data: communityUsers,
        error: communityError,
      } = await supabase
        .from('archive_rankings')
        .select('user_id')
        .eq('ranking_type', 'movies');

      if (communityError) {
        console.log(
          'Could not load Archive community count:',
          communityError
        );
      } else {
        const uniqueUsers = new Set(
          (communityUsers ?? []).map(
            (row) => row.user_id
          )
        );

        setCommunityRankings(
          uniqueUsers.size
        );
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadArchivesSummary();
    }, [loadArchivesSummary])
  );

  const hasCompleteMovieRanking =
    userId &&
    movieCount > 0 &&
    movieRankedCount === movieCount;

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              THE GALAXY
            </Text>

            <Text style={styles.title}>
              The Archives
            </Text>
          </View>

          <ProfileButton />
        </View>

        <Text style={styles.subtitle}>
          Your galaxy. Your rankings.
        </Text>

        <Text style={styles.sectionLabel}>
          YOUR ARCHIVES
        </Text>

        <Pressable
          style={styles.archiveCard}
          onPress={() =>
            router.push('/archive-movies')
          }
        >
          <View style={styles.archiveCardTop}>
            <View style={styles.archiveNumber}>
              <Text style={styles.archiveNumberText}>
                01
              </Text>
            </View>

            <View style={styles.archiveCardText}>
              <Text style={styles.archiveEyebrow}>
                STAR WARS
              </Text>

              <Text style={styles.archiveTitle}>
                Movies
              </Text>

              <Text style={styles.archiveDescription}>
                Rank every theatrical Star Wars
                movie from favorite to least
                favorite.
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </View>

          <View style={styles.archiveStatus}>
            <Text style={styles.archiveStatusText}>
              {!userId
                ? 'SIGN IN TO RANK'
                : hasCompleteMovieRanking
                  ? 'RANKING COMPLETE'
                  : movieRankedCount > 0
                    ? `${movieRankedCount} OF ${movieCount} RANKED`
                    : `${movieCount} MOVIES`}
            </Text>
          </View>
        </Pressable>

        <View style={styles.comingSoonCard}>
          <View style={styles.archiveCardTop}>
            <View style={styles.archiveNumberMuted}>
              <Text
                style={
                  styles.archiveNumberMutedText
                }
              >
                02
              </Text>
            </View>

            <View style={styles.archiveCardText}>
              <Text style={styles.comingSoonEyebrow}>
                COMING NEXT
              </Text>

              <Text style={styles.archiveTitle}>
                Shows
              </Text>

              <Text style={styles.archiveDescription}>
                Rank your favorite Star Wars
                series across the galaxy.
              </Text>
            </View>
          </View>

          <View style={styles.comingSoonBadge}>
            <Text
              style={styles.comingSoonBadgeText}
            >
              COMING SOON
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            styles.communityLabel,
          ]}
        >
          COMMUNITY ARCHIVES
        </Text>

        <Pressable
          style={styles.communityCard}
          onPress={() =>
            router.push(
              '/archive-community'
            )
          }
        >
          <View style={styles.communityTop}>
            <View>
              <Text style={styles.communityEyebrow}>
                W&W COMMUNITY
              </Text>

              <Text style={styles.communityTitle}>
                How does the galaxy rank?
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </View>

          <Text style={styles.communityText}>
            See the combined Star Wars rankings
            from Wookiees & Wolves members.
          </Text>

          <View style={styles.communityStat}>
            <Text
              style={styles.communityStatNumber}
            >
              {communityRankings}
            </Text>

            <Text
              style={styles.communityStatLabel}
            >
              MEMBER RANKINGS
            </Text>
          </View>
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

  content: {
    paddingHorizontal: 18,
    paddingBottom: 130,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  headerText: {
    flex: 1,
    paddingRight: 16,
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

  subtitle: {
    color: '#8FA2B3',
    fontSize: 14,
    marginTop: 7,
    marginBottom: 30,
  },

  sectionLabel: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  archiveCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },

  archiveCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },

  archiveNumber: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#162A3C',
    borderWidth: 1,
    borderColor: '#31516B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  archiveNumberText: {
    color: '#75C7F0',
    fontSize: 17,
    fontWeight: '900',
  },

  archiveNumberMuted: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#111C27',
    borderWidth: 1,
    borderColor: '#20354A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  archiveNumberMutedText: {
    color: '#53697B',
    fontSize: 17,
    fontWeight: '900',
  },

  archiveCardText: {
    flex: 1,
  },

  archiveEyebrow: {
    color: '#75C7F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  comingSoonEyebrow: {
    color: '#60778A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  archiveTitle: {
    color: '#F3EFE3',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 3,
  },

  archiveDescription: {
    color: '#8FA2B3',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  arrow: {
    color: '#75C7F0',
    fontSize: 30,
    fontWeight: '300',
    marginLeft: 10,
  },

  archiveStatus: {
    borderTopWidth: 1,
    borderTopColor: '#20354A',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  archiveStatusText: {
    color: '#75C7F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  comingSoonCard: {
    backgroundColor: '#0D1824',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    overflow: 'hidden',
    opacity: 0.75,
  },

  comingSoonBadge: {
    borderTopWidth: 1,
    borderTopColor: '#20354A',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  comingSoonBadgeText: {
    color: '#60778A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  communityLabel: {
    marginTop: 28,
  },

  communityCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 18,
  },

  communityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  communityEyebrow: {
    color: '#75C7F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  communityTitle: {
    color: '#F3EFE3',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },

  communityText: {
    color: '#8FA2B3',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },

  communityStat: {
    borderTopWidth: 1,
    borderTopColor: '#20354A',
    marginTop: 16,
    paddingTop: 14,
  },

  communityStatNumber: {
    color: '#F3EFE3',
    fontSize: 27,
    fontWeight: '900',
  },

  communityStatLabel: {
    color: '#75C7F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 2,
  },
});