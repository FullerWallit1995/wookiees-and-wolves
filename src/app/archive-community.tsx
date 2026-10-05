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

type CommunityRanking = {
  item_id: number;
  title: string;
  average_rank: number;
  ranking_count: number;
  first_place_count: number;
  highest_rank: number;
  lowest_rank: number;
};

export default function ArchiveCommunityScreen() {
  const router = useRouter();

  const [rankings, setRankings] =
    useState<CommunityRanking[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [signedIn, setSignedIn] =
    useState(false);

  const loadCommunity =
    useCallback(async () => {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setSignedIn(!!user);

        if (!user) {
          setRankings([]);
          return;
        }

        const { data, error } =
          await supabase.rpc(
            'get_archive_community_ranking',
            {
              p_ranking_type: 'movies',
            }
          );

        if (error) {
          console.log(
            'Could not load community Archives:',
            error
          );

          setRankings([]);
          return;
        }

        setRankings(
          (data ?? []).map((row: any) => ({
            item_id: Number(row.item_id),
            title: row.title,
            average_rank: Number(
              row.average_rank
            ),
            ranking_count: Number(
              row.ranking_count
            ),
            first_place_count: Number(
              row.first_place_count
            ),
            highest_rank: Number(
              row.highest_rank
            ),
            lowest_rank: Number(
              row.lowest_rank
            ),
          }))
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadCommunity();
    }, [loadCommunity])
  );

  const memberCount =
    rankings[0]?.ranking_count ?? 0;

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
          COMMUNITY ARCHIVES
        </Text>

        <Text style={styles.title}>
          Movie Rankings
        </Text>

        <Text style={styles.subtitle}>
          The galaxy according to Wookiees &
          Wolves members.
        </Text>

        {!signedIn ? (
          <View style={styles.guestCard}>
            <Text style={styles.guestEyebrow}>
              W&W MEMBERS
            </Text>

            <Text style={styles.guestTitle}>
              Join the conversation
            </Text>

            <Text style={styles.guestText}>
              Sign in or create a W&W account
              to see the Community Archives.
            </Text>

            <View style={styles.guestActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/auth',
                    params: {
                      mode: 'signup',
                    },
                  })
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  CREATE ACCOUNT
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/auth',
                    params: {
                      mode: 'login',
                    },
                  })
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  SIGN IN
                </Text>
              </Pressable>
            </View>
          </View>
        ) : loading ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Reading the Archives...
            </Text>
          </View>
        ) : rankings.length === 0 ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>
              The Archives are empty
            </Text>

            <Text style={styles.statusText}>
              Be the first W&W member to submit
              a movie ranking.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {memberCount}
              </Text>

              <Text style={styles.summaryLabel}>
                {memberCount === 1
                  ? 'MEMBER RANKING'
                  : 'MEMBER RANKINGS'}
              </Text>

              <Text style={styles.summaryText}>
                Rankings are ordered by average
                position across submitted lists.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>
              COMMUNITY CONSENSUS
            </Text>

            {rankings.map((movie, index) => {
              const firstPlacePercent =
                movie.ranking_count > 0
                  ? Math.round(
                      (movie.first_place_count /
                        movie.ranking_count) *
                        100
                    )
                  : 0;

              return (
                <View
                  key={movie.item_id}
                  style={[
                    styles.rankingCard,
                    index === 0 &&
                      styles.topRankingCard,
                  ]}
                >
                  <View style={styles.rankBox}>
                    <Text
                      style={styles.rankNumber}
                    >
                      {String(
                        index + 1
                      ).padStart(2, '0')}
                    </Text>
                  </View>

                  <View style={styles.movieInfo}>
                    <Text
                      style={styles.movieTitle}
                    >
                      {movie.title}
                    </Text>

                    <Text
                      style={styles.averageText}
                    >
                      AVG. POSITION{' '}
                      {movie.average_rank.toFixed(
                        2
                      )}
                    </Text>

                    <View
                      style={styles.statRow}
                    >
                      <Text
                        style={styles.statText}
                      >
                        #1 BY{' '}
                        {firstPlacePercent}%
                      </Text>

                      <Text
                        style={styles.statDot}
                      >
                        •
                      </Text>

                      <Text
                        style={styles.statText}
                      >
                        RANGE #
                        {movie.highest_rank}–#
                        {movie.lowest_rank}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
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

  subtitle: {
    color: '#8FA2B3',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 24,
  },

  guestCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 18,
    padding: 18,
  },

  guestEyebrow: {
    color: '#75C7F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  guestTitle: {
    color: '#F3EFE3',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 5,
  },

  guestText: {
    color: '#8FA2B3',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  guestActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: '#75C7F0',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#07111F',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  summaryCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 26,
  },

  summaryNumber: {
    color: '#F3EFE3',
    fontSize: 34,
    fontWeight: '900',
  },

  summaryLabel: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginTop: 1,
  },

  summaryText: {
    color: '#8FA2B3',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
  },

  sectionLabel: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  rankingCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  topRankingCard: {
    borderColor: '#31516B',
  },

  rankBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#162A3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  rankNumber: {
    color: '#75C7F0',
    fontSize: 15,
    fontWeight: '900',
  },

  movieInfo: {
    flex: 1,
  },

  movieTitle: {
    color: '#F3EFE3',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },

  averageText: {
    color: '#75C7F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 5,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },

  statText: {
    color: '#708599',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  statDot: {
    color: '#40566A',
    fontSize: 8,
    marginHorizontal: 6,
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