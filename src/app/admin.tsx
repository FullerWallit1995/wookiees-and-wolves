import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Prediction = 'W' | 'L';

type AdminGame = {
  game_id: number;
  game_date: string;
  opponent: string;
  location: 'HOME' | 'AWAY' | null;
  picks_lock_at: string | null;
};

type GameResult = {
  game_id: number;
  result: Prediction;
  final: boolean;
  updated_at: string;
};

export default function AdminScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [results, setResults] = useState<
    Record<number, GameResult>
  >({});
  const [savingGameId, setSavingGameId] =
    useState<number | null>(null);

  const loadData = useCallback(async () => {
    const { data: schedule, error: scheduleError } =
      await supabase
        .from('predictor_games')
        .select(
          'game_id, game_date, opponent, location, picks_lock_at'
        )
        .eq('season', '2026-27')
        .order('sort_order', { ascending: true });

    if (scheduleError) {
      console.log(
        'Could not load admin Predictor schedule:',
        scheduleError
      );
      return;
    }

    const { data: resultData, error: resultsError } =
      await supabase
        .from('predictor_results')
        .select('game_id, result, final, updated_at')
        .eq('season', '2026-27')
        .eq('final', true);

    if (resultsError) {
      console.log(
        'Could not load Predictor results:',
        resultsError
      );
      return;
    }

    const resultMap: Record<number, GameResult> = {};

    (resultData ?? []).forEach((row) => {
      if (row.result === 'W' || row.result === 'L') {
        resultMap[row.game_id] = {
          game_id: row.game_id,
          result: row.result,
          final: row.final,
          updated_at: row.updated_at,
        };
      }
    });

    setGames((schedule ?? []) as AdminGame[]);
    setResults(resultMap);
  }, []);

  useEffect(() => {
    async function loadAdmin() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/');
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profileError) {
          console.log(
            'Could not check admin role:',
            profileError
          );

          router.replace('/');
          return;
        }

        if (profile?.role !== 'admin') {
          Alert.alert(
            'Admin access required',
            'This area is only available to W&W admins.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/'),
              },
            ]
          );

          return;
        }

        setAuthorized(true);
        await loadData();
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();
  }, [loadData, router]);

  const lockedGames = games.filter((game) => {
    if (!game.picks_lock_at) {
      return false;
    }

    return new Date() >= new Date(game.picks_lock_at);
  });

  const gamesNeedingResults = lockedGames.filter(
    (game) => !results[game.game_id]
  );

  const recentResults = lockedGames
    .filter((game) => !!results[game.game_id])
    .reverse()
    .slice(0, 10);

  async function saveResult(
    game: AdminGame,
    result: Prediction
  ) {
    try {
      setSavingGameId(game.game_id);

      const { error } = await supabase
        .from('predictor_results')
        .upsert(
          {
            season: '2026-27',
            game_id: game.game_id,
            result,
            final: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'season,game_id',
          }
        );

      if (error) {
        console.log(
          'Could not save Predictor result:',
          error
        );

        Alert.alert(
          'Result not saved',
          'Something went wrong saving this result.'
        );

        return;
      }

      await loadData();
    } finally {
      setSavingGameId(null);
    }
  }

  function confirmNewResult(
    game: AdminGame,
    result: Prediction
  ) {
    Alert.alert(
      'Finalize game result?',
      `${game.location === 'HOME' ? 'vs.' : '@'} ${
        game.opponent
      }\n\nMark this game as a ${
        result === 'W' ? 'WIN' : 'LOSS'
      }?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: result === 'W' ? 'Mark Win' : 'Mark Loss',
          onPress: () => saveResult(game, result),
        },
      ]
    );
  }

  function confirmCorrection(
    game: AdminGame,
    result: Prediction
  ) {
    const currentResult = results[game.game_id]?.result;

    if (!currentResult || currentResult === result) {
      return;
    }

    Alert.alert(
      'Correct final result?',
      `This game is currently recorded as a ${
        currentResult === 'W' ? 'WIN' : 'LOSS'
      }.\n\nChange the final result to a ${
        result === 'W' ? 'WIN' : 'LOSS'
      }? This will affect Predictor grading and leaderboard accuracy.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Correct Result',
          style: 'destructive',
          onPress: () => saveResult(game, result),
        },
      ]
    );
  }

  function ResultButtons({
    game,
    correction = false,
  }: {
    game: AdminGame;
    correction?: boolean;
  }) {
    const currentResult = results[game.game_id]?.result;
    const saving = savingGameId === game.game_id;

    return (
      <View style={styles.resultButtons}>
        <Pressable
          style={[
            styles.resultButton,
            styles.winButton,
            currentResult === 'W' &&
              styles.selectedResultButton,
            saving && styles.disabledButton,
          ]}
          disabled={saving}
          onPress={() =>
            correction
              ? confirmCorrection(game, 'W')
              : confirmNewResult(game, 'W')
          }
        >
          <Text style={styles.resultButtonText}>
            W
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.resultButton,
            styles.lossButton,
            currentResult === 'L' &&
              styles.selectedResultButton,
            saving && styles.disabledButton,
          ]}
          disabled={saving}
          onPress={() =>
            correction
              ? confirmCorrection(game, 'L')
              : confirmNewResult(game, 'L')
          }
        >
          <Text style={styles.resultButtonText}>
            L
          </Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.muted}>
            Loading admin tools...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!authorized) {
    return (
      <SafeAreaView style={styles.container} />
    );
  }

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
          W&W ADMIN
        </Text>

        <Text style={styles.title}>
          Admin Tools
        </Text>

        <Text style={styles.subtitle}>
          Manage Wookiees & Wolves app content and
          Predictor results.
        </Text>

        <Text style={styles.sectionLabel}>
          NEEDS RESULT
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Games awaiting results
          </Text>

          <Text style={styles.infoNumber}>
            {gamesNeedingResults.length}
          </Text>

          <Text style={styles.infoText}>
            Locked games stay here until an admin
            records the final result.
          </Text>
        </View>

        {gamesNeedingResults.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Nothing to grade
            </Text>

            <Text style={styles.emptyText}>
              Games will appear here after their
              Predictor lock time passes.
            </Text>
          </View>
        ) : (
          gamesNeedingResults.map((game) => (
            <View
              key={game.game_id}
              style={styles.gameCard}
            >
              <View style={styles.gameInfo}>
                <Text style={styles.gameDate}>
                  {game.game_date}
                </Text>

                <Text style={styles.gameOpponent}>
                  {game.location === 'HOME'
                    ? 'vs.'
                    : '@'}{' '}
                  {game.opponent}
                </Text>
              </View>

              <ResultButtons game={game} />
            </View>
          ))
        )}

        <Text
          style={[
            styles.sectionLabel,
            styles.recentSectionLabel,
          ]}
        >
          RECENT RESULTS
        </Text>

        {recentResults.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No final results yet
            </Text>

            <Text style={styles.emptyText}>
              Finalized games will appear here.
            </Text>
          </View>
        ) : (
          recentResults.map((game) => {
            const result = results[game.game_id];

            return (
              <View
                key={game.game_id}
                style={styles.gameCard}
              >
                <View style={styles.gameInfo}>
                  <Text style={styles.gameDate}>
                    {game.game_date}
                  </Text>

                  <Text style={styles.gameOpponent}>
                    {game.location === 'HOME'
                      ? 'vs.'
                      : '@'}{' '}
                    {game.opponent}
                  </Text>

                  <Text style={styles.finalResult}>
                    FINAL RESULT:{' '}
                    {result.result === 'W'
                      ? 'WIN'
                      : 'LOSS'}
                  </Text>
                </View>

                <ResultButtons
                  game={game}
                  correction
                />
              </View>
            );
          })
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

  centered: {
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
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 28,
  },

  sectionLabel: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  recentSectionLabel: {
    marginTop: 28,
  },

  infoCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  infoTitle: {
    color: '#8FA2B3',
    fontSize: 11,
    fontWeight: '800',
  },

  infoNumber: {
    color: '#F3EFE3',
    fontSize: 40,
    fontWeight: '900',
    marginTop: 3,
  },

  infoText: {
    color: '#7F94A7',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  emptyCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#F3EFE3',
    fontSize: 16,
    fontWeight: '900',
  },

  emptyText: {
    color: '#8FA2B3',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 5,
  },

  gameCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  gameInfo: {
    flex: 1,
    paddingRight: 12,
  },

  gameDate: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  gameOpponent: {
    color: '#F3EFE3',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 5,
  },

  finalResult: {
    color: '#8FA2B3',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 6,
  },

  resultButtons: {
    flexDirection: 'row',
    gap: 7,
  },

  resultButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  winButton: {
    backgroundColor: '#32664B',
    borderColor: '#5C9A76',
  },

  lossButton: {
    backgroundColor: '#713D42',
    borderColor: '#A75A62',
  },

  selectedResultButton: {
    borderWidth: 3,
  },

  resultButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.4,
  },
});