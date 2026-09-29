import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
type Prediction = 'W' | 'L';

type Game = {
  id: number;
  date: string;
  opponent: string;
  location?: 'HOME' | 'AWAY';
  month: string;
  available?: boolean;
  note?: string;
  picksLockAt?: string;
};


const months = [
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
];

export default function PredictorScreen() {
  const router = useRouter();
const [games, setGames] = useState<Game[]>([]);
const [gamesLoaded, setGamesLoaded] = useState(false);
const [results, setResults] = useState<
  Record<number, Prediction>
>({});
  const [predictions, setPredictions] = useState<
    Record<number, Prediction>
  >({});
  const [user, setUser] = useState<User | null>(null);


useEffect(() => {
  async function loadGames() {
    const { data, error } = await supabase
      .from('predictor_games')
      .select('*')
      .eq('season', '2026-27')
      .order('sort_order', { ascending: true });

    if (error) {
      console.log(
        'Could not load Predictor schedule:',
        error
      );

      setGamesLoaded(true);
      return;
    }

    if (data && data.length > 0) {
      const formattedGames: Game[] = data.map((game) => ({
  id: game.game_id,
  date: game.game_date,
  opponent: game.opponent,
  location: game.location ?? undefined,
  month: game.month,
  available: game.available,
  note: game.note ?? undefined,
  picksLockAt: game.picks_lock_at ?? undefined,
}));

      setGames(formattedGames);
    }

    setGamesLoaded(true);
  }

  loadGames();
}, []);
useEffect(() => {
  async function loadResults() {
    const { data, error } = await supabase
      .from('predictor_results')
      .select('game_id, result, final')
      .eq('season', '2026-27')
      .eq('final', true);

    if (error) {
      console.log(
        'Could not load Predictor results:',
        error
      );
      return;
    }

    const formattedResults: Record<number, Prediction> = {};

    (data ?? []).forEach((row) => {
      if (row.result === 'W' || row.result === 'L') {
        formattedResults[row.game_id] = row.result;
      }
    });

    setResults(formattedResults);
  }

  loadResults();
}, []);

useEffect(() => {
  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }

  loadUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);

  if (!session?.user) {
    setPredictions({});
  }
});

  return () => {
    subscription.unsubscribe();
  };
}, []);

useEffect(() => {
  async function loadPredictions() {
    if (!user) {
      setPredictions({});
      return;
    }

    const { data, error } = await supabase
      .from('predictor_predictions')
      .select('predictions')
      .eq('user_id', user.id)
      .eq('season', '2026-27')
      .maybeSingle();

    if (error) {
      console.log(
        'Could not load cloud predictions:',
        error
      );
      return;
    }

    setPredictions(
      (data?.predictions ?? {}) as Record<
        number,
        Prediction
      >
    );
  }

  loadPredictions();
}, [user]);

const [expandedMonths, setExpandedMonths] = useState<
  Record<string, boolean>
>({
  OCTOBER: true,
});
function toggleMonth(month: string) {
  setExpandedMonths((current) => ({
    ...current,
    [month]: !current[month],
  }));
}
  const wins = useMemo(
    () =>
      Object.values(predictions).filter(
        (prediction) => prediction === 'W'
      ).length,
    [predictions]
  );

  const losses = useMemo(
    () =>
      Object.values(predictions).filter(
        (prediction) => prediction === 'L'
      ).length,
    [predictions]
  );
  function expandAllMonths() {
  const expanded: Record<string, boolean> = {};

  months.forEach((month) => {
    expanded[month] = true;
  });

  setExpandedMonths(expanded);
}

function collapseAllMonths() {
  const collapsed: Record<string, boolean> = {};

  months.forEach((month) => {
    collapsed[month] = false;
  });

  setExpandedMonths(collapsed);
}
function getMonthStats(month: string) {
  const monthGames = games.filter(
    (game) => game.month === month
  );

  const monthWins = monthGames.filter(
    (game) => predictions[game.id] === 'W'
  ).length;

  const monthLosses = monthGames.filter(
    (game) => predictions[game.id] === 'L'
  ).length;

  const actionableGames = monthGames.filter(
    (game) =>
      game.available !== false &&
      !isGameLocked(game) &&
      !results[game.id]
  );

  const openUnpickedGames = actionableGames.filter(
    (game) => !predictions[game.id]
  );

  const hasActionableGames =
    actionableGames.length > 0;

  const allOpenGamesPicked =
    hasActionableGames &&
    openUnpickedGames.length === 0;

  const allKnownGamesLocked =
    monthGames.length > 0 &&
    monthGames
      .filter((game) => game.available !== false)
      .every(
        (game) =>
          isGameLocked(game) ||
          !!results[game.id]
      );

  let status: 'locked' | 'set' | 'needed';

  if (allKnownGamesLocked) {
    status = 'locked';
  } else if (allOpenGamesPicked) {
    status = 'set';
  } else {
    status = 'needed';
  }

  return {
    games: monthGames,
    wins: monthWins,
    losses: monthLosses,
    status,
    picksNeeded: openUnpickedGames.length,
  };
}

  const predicted = wins + losses;
  const openGames = games.filter(
  (game) =>
    game.available !== false &&
    !isGameLocked(game) &&
    !results[game.id]
);


const nextLockGame = [...openGames]
  .filter((game) => !!game.picksLockAt)
  .sort(
    (a, b) =>
      new Date(a.picksLockAt!).getTime() -
      new Date(b.picksLockAt!).getTime()
  )[0];

const nextLockFormatted = nextLockGame?.picksLockAt
  ? new Date(nextLockGame.picksLockAt).toLocaleString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    )
  : null;
  const gradedGameIds = Object.keys(results).map(Number);

const correctPicks = gradedGameIds.filter(
  (gameId) =>
    predictions[gameId] &&
    predictions[gameId] === results[gameId]
).length;

const incorrectPicks = gradedGameIds.filter(
  (gameId) =>
    predictions[gameId] &&
    predictions[gameId] !== results[gameId]
).length;

const gradedPicks = correctPicks + incorrectPicks;

const accuracy =
  gradedPicks > 0
    ? Math.round((correctPicks / gradedPicks) * 1000) / 10
    : 0;
    function isGameLocked(game: Game) {
  if (game.available === false) {
    return true;
  }

  if (!game.picksLockAt) {
    return true;
  }

  return new Date() >= new Date(game.picksLockAt);
}



async function makePrediction(
  game: Game,
  prediction: Prediction
) {
  if (
    isGameLocked(game) ||
    results[game.id]
  ) {
    return;
  }

  const nextPredictions: Record<number, Prediction> = {
    ...predictions,
  };

  if (predictions[game.id] === prediction) {
    delete nextPredictions[game.id];
  } else {
    nextPredictions[game.id] = prediction;
  }

if (!user) {
  Alert.alert(
    'Join the Predictor',
    'Create a W&W account or sign in to make picks, compete on the leaderboard, and track your accuracy.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign In',
        onPress: () =>
          router.push({
            pathname: '/auth',
            params: { mode: 'login' },
          }),
      },
      {
        text: 'Create Account',
        onPress: () =>
          router.push({
            pathname: '/auth',
            params: { mode: 'signup' },
          }),
      },
    ]
  );

  return;
}

  const { error } = await supabase
    .from('predictor_predictions')
    .upsert(
      {
        user_id: user.id,
        season: '2026-27',
        predictions: nextPredictions,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,season',
      }
    );

  if (error) {
    console.log(
      'Could not save prediction:',
      error
    );

    Alert.alert(
      'Pick not saved',
      'That game may have locked. Your previous pick has been kept.'
    );

    return;
  }

  setPredictions(nextPredictions);
}

  function clearOpenPredictions() {
  const openPickedGames = games.filter(
    (game) =>
      !isGameLocked(game) &&
      !results[game.id] &&
      !!predictions[game.id]
  );

  if (openPickedGames.length === 0) {
    Alert.alert(
      'No open picks',
      'You do not have any open picks to clear.'
    );
    return;
  }

  Alert.alert(
    'Clear open picks?',
    `This will remove ${openPickedGames.length} ${
      openPickedGames.length === 1 ? 'pick' : 'picks'
    } from games that are still open. Locked picks will not be changed.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Clear Picks',
        style: 'destructive',
        onPress: async () => {
          const nextPredictions = {
            ...predictions,
          };

          openPickedGames.forEach((game) => {
            delete nextPredictions[game.id];
          });

          if (!user) {
  return;
}

          const { error } = await supabase
            .from('predictor_predictions')
            .upsert(
              {
                user_id: user.id,
                season: '2026-27',
                predictions: nextPredictions,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'user_id,season',
              }
            );

          if (error) {
            console.log(
              'Could not clear open predictions:',
              error
            );

            Alert.alert(
              'Could not clear picks',
              'Your picks were not changed. Please try again.'
            );

            return;
          }

          setPredictions(nextPredictions);
        },
      },
    ]
  );
}
 
 
if (!gamesLoaded) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading schedule...
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
      >
        {/* HEADER */}
        <Text style={styles.eyebrow}>2026–27 SEASON</Text>
        <Text style={styles.title}>Wolves Predictor</Text>

        <Text style={styles.subtitle}>
            Pick the Wolves to win or lose. Each game locks at tipoff.
        </Text>
      
        {/* RECORD */}
        <View style={styles.recordCard}>
          <Text style={styles.recordLabel}>
            YOUR PREDICTED RECORD
          </Text>

          <Text style={styles.record}>
            {wins}–{losses}
          </Text>

          <View style={styles.recordStats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{wins}</Text>
              <Text style={styles.statLabel}>WINS</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.stat}>
              <Text style={styles.statNumber}>{losses}</Text>
              <Text style={styles.statLabel}>LOSSES</Text>
            </View>

            
          </View>
        </View>


{nextLockGame && (
  <View style={styles.nextLockCard}>
    <Text style={styles.nextLockEyebrow}>
      NEXT PICK LOCK
    </Text>

    <Text style={styles.nextLockOpponent}>
      {nextLockGame.location === 'HOME'
        ? 'vs.'
        : '@'}{' '}
      {nextLockGame.opponent}
    </Text>

    <Text style={styles.nextLockTime}>
      {nextLockFormatted}
    </Text>

    <Text style={styles.nextLockPick}>
      {predictions[nextLockGame.id]
        ? `YOUR PICK: ${predictions[nextLockGame.id]}`
        : 'PICK NEEDED'}
    </Text>
  </View>
)}
{!user && (
  <View style={styles.predictorGuestCard}>
    <Text style={styles.predictorGuestTitle}>
      JOIN THE PREDICTOR
    </Text>

    <Text style={styles.predictorGuestText}>
      Sign in or create a W&W account to make picks and compete on the leaderboard.
    </Text>

    <Pressable
      style={styles.predictorGuestButton}
      onPress={() =>
        router.push({
          pathname: '/auth',
          params: { mode: 'signup' },
        })
      }
    >
      <Text style={styles.predictorGuestButtonText}>
        CREATE ACCOUNT
      </Text>
    </Pressable>
  </View>
)}
{gradedPicks > 0 && (
  <View style={styles.accuracyCard}>
    <View style={styles.accuracyHeader}>
      <View>
        <Text style={styles.accuracyEyebrow}>
          PREDICTION ACCURACY
        </Text>

        <Text style={styles.accuracyNumber}>
          {accuracy}%
        </Text>
      </View>

      <View style={styles.gradedBadge}>
        <Text style={styles.gradedBadgeText}>
          {gradedPicks} GRADED
        </Text>
      </View>
    </View>

    <View style={styles.accuracyStats}>
      <View style={styles.accuracyStat}>
        <Text style={styles.correctNumber}>
          {correctPicks}
        </Text>
        <Text style={styles.accuracyStatLabel}>
          CORRECT
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.accuracyStat}>
        <Text style={styles.incorrectNumber}>
          {incorrectPicks}
        </Text>
        <Text style={styles.accuracyStatLabel}>
          INCORRECT
        </Text>
      </View>
    </View>
  </View>
)}

<Pressable
  style={styles.leaderboardButton}
  onPress={() => router.push('/leaderboard')}
>
  <View>
    <Text style={styles.leaderboardEyebrow}>
      COMMUNITY
    </Text>

    <Text style={styles.leaderboardTitle}>
      Predictor Leaderboard
    </Text>
  </View>

  <Text style={styles.leaderboardArrow}>›</Text>
</Pressable>
{/* SCHEDULE */}
<View style={styles.gamesHeader}>
  <View>
    <Text style={styles.sectionTitle}>
      Schedule
    </Text>

    <Text style={styles.gameCount}>
      82 GAMES
    </Text>
  </View>

  <View style={styles.scheduleActions}>
    <Pressable
      style={styles.scheduleActionButton}
      onPress={expandAllMonths}
    >
      <Text style={styles.scheduleActionText}>
        EXPAND ALL
      </Text>
    </Pressable>

    <Pressable
      style={styles.scheduleActionButton}
      onPress={collapseAllMonths}
    >
      <Text style={styles.scheduleActionText}>
        COLLAPSE ALL
      </Text>
    </Pressable>
  </View>
</View>

{months.map((month) => {
  const monthStats = getMonthStats(month);
  const expanded = !!expandedMonths[month];

  return (
    <View key={month} style={styles.monthContainer}>
      <Pressable
        style={styles.monthHeader}
        onPress={() => toggleMonth(month)}
      >
        <View>
          <View style={styles.monthTitleRow}>
  <Text style={styles.monthName}>
    {month}
  </Text>

 {monthStats.status === 'set' && (
  <View style={styles.completeBadge}>
    <Text style={styles.completeBadgeText}>
      ✓ SET
    </Text>
  </View>
)}

{monthStats.status === 'locked' && (
  <View style={styles.lockedMonthBadge}>
    <Text style={styles.lockedMonthBadgeText}>
      LOCKED
    </Text>
  </View>
)}

{monthStats.status === 'needed' &&
  monthStats.picksNeeded > 0 && (
    <View style={styles.neededBadge}>
      <Text style={styles.neededBadgeText}>
        {monthStats.picksNeeded}{' '}
        {monthStats.picksNeeded === 1
          ? 'PICK'
          : 'PICKS'}{' '}
        NEEDED
      </Text>
    </View>
  )}
</View>

         <Text style={styles.monthDetails}>
  {monthStats.games.length} games • Picks:{' '}
  {monthStats.wins}–{monthStats.losses}
</Text>
        </View>

        <Text style={styles.monthArrow}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>

      {expanded &&
        monthStats.games.map((game) => {
          const prediction = predictions[game.id];
          const actualResult = results[game.id];

const wasCorrect =
  actualResult &&
  prediction &&
  actualResult === prediction;
  const gameLocked =
  isGameLocked(game) || !!actualResult;

          return (
            <View key={game.id} style={styles.gameCard}>
              <View style={styles.gameInfo}>
                <View style={styles.dateRow}>
                  <Text style={styles.date}>
                    {game.date}
                  </Text>

                  <View
                    style={[
                      styles.locationBadge,
                      game.location === 'AWAY' &&
                        styles.awayBadge,
                    ]}
                  >
                    <Text style={styles.locationText}>
                      {game.location}
                    </Text>
                  </View>
                </View>

                <Text style={styles.opponent}>
  {game.location === 'HOME'
    ? 'vs.'
    : game.location === 'AWAY'
      ? '@'
      : ''}{' '}
  {game.opponent}
</Text>

{gameLocked && prediction && (
  <Text style={styles.lockedPickText}>
    YOUR PICK: {prediction}
  </Text>
)}

{game.note && (
  <Text style={styles.gameNote}>
    {game.note}
  </Text>
)}

{actualResult && (
  <View style={styles.resultRow}>
    <Text style={styles.resultText}>
      RESULT: {actualResult}
    </Text>

    {prediction && (
      <Text
        style={[
          styles.gradeText,
          wasCorrect
            ? styles.correctText
            : styles.incorrectText,
        ]}
      >
        {wasCorrect ? '✓ CORRECT' : '✕ INCORRECT'}
      </Text>
    )}
  </View>
)}
              </View>

              <View style={styles.pickButtons}>
                <Pressable
disabled={
  game.available === false || gameLocked
}
 style={[
    styles.pickButton,
    prediction === 'W' && styles.winSelected,
    (game.available === false ||
  (gameLocked && prediction !== 'W')) &&
  styles.disabledPickButton,
  ]}
  onPress={() => makePrediction(game, 'W')}
>
                  <Text
                    style={[
                      styles.pickButtonText,
                      prediction === 'W' &&
                        styles.selectedButtonText,
                    ]}
                  >
                    W
                  </Text>
                </Pressable>

                <Pressable
disabled={
  game.available === false || gameLocked
}  style={[
    styles.pickButton,
    prediction === 'L' && styles.lossSelected,
   (game.available === false ||
  (gameLocked && prediction !== 'L')) &&
  styles.disabledPickButton,
  ]}
  onPress={() => makePrediction(game, 'L')}
>
                  <Text
                    style={[
                      styles.pickButtonText,
                      prediction === 'L' &&
                        styles.selectedButtonText,
                    ]}
                  >
                    L
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
    </View>
  );
})}
{user && predicted > 0 && (
    <Pressable
    style={styles.clearPicksButton}
    onPress={clearOpenPredictions}
  >
    <Text style={styles.clearPicksButtonText}>
      CLEAR OPEN PICKS
    </Text>
  </Pressable>
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
    paddingBottom: 130,
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
  },

  subtitle: {
    color: '#8FA2B3',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    marginBottom: 24,
  },

  recordCard: {
    backgroundColor: '#101D2B',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#20354A',
    padding: 22,
    alignItems: 'center',
  },

  recordLabel: {
    color: '#75C7F0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  record: {
    color: '#F3EFE3',
    fontSize: 58,
    lineHeight: 68,
    fontWeight: '900',
  },

  recordStats: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#20354A',
  },

  stat: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    color: '#F3EFE3',
    fontSize: 20,
    fontWeight: '900',
  },

  statLabel: {
    color: '#7F94A7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 3,
  },

  divider: {
    width: 1,
    backgroundColor: '#20354A',
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },

  progressText: {
    color: '#8FA2B3',
    fontSize: 12,
    fontWeight: '700',
  },

  progressPercent: {
    color: '#75C7F0',
    fontSize: 12,
    fontWeight: '900',
  },
predictorGuestCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 16,
  padding: 17,
  marginTop: 14,
},

predictorGuestTitle: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.4,
},

predictorGuestText: {
  color: '#8FA2B3',
  fontSize: 12,
  lineHeight: 18,
  marginTop: 5,
},

predictorGuestButton: {
  backgroundColor: '#75C7F0',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
  marginTop: 13,
},

predictorGuestButtonText: {
  color: '#07111F',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},
  progressTrack: {
    height: 7,
    backgroundColor: '#152536',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 30,
  },
submitCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 16,
  padding: 17,
  marginBottom: 24,
},

submitStatus: {
  color: '#75C7F0',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1.5,
},

submitTitle: {
  color: '#F3EFE3',
  fontSize: 28,
  fontWeight: '900',
  marginTop: 6,
},
lockedPickText: {
  color: '#75C7F0',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1,
  marginTop: 6,
},
submitDescription: {
  color: '#8FA2B3',
  fontSize: 13,
  lineHeight: 19,
  marginTop: 6,
},

submitButton: {
  backgroundColor: '#75C7F0',
  borderRadius: 9,
  paddingVertical: 12,
  alignItems: 'center',
  marginTop: 14,
},

submitButtonDisabled: {
  opacity: 0.35,
},

submitButtonText: {
  color: '#07111F',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1,
},
  progressFill: {
    height: '100%',
    backgroundColor: '#75C7F0',
    borderRadius: 10,
  },

  gamesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#F3EFE3',
    fontSize: 21,
    fontWeight: '900',
  },

  gameCount: {
    color: '#708599',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 3,
  },
  monthContainer: {
  marginBottom: 10,
},
monthHeader: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 15,
  marginBottom: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

monthName: {
  color: '#F3EFE3',
  fontSize: 16,
  fontWeight: '900',
  letterSpacing: 1.2,
},
lockedMonthBadge: {
  backgroundColor: '#172636',
  borderRadius: 6,
  paddingHorizontal: 7,
  paddingVertical: 4,
},

lockedMonthBadgeText: {
  color: '#7F94A7',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.8,
},

neededBadge: {
  backgroundColor: '#3A3020',
  borderRadius: 6,
  paddingHorizontal: 7,
  paddingVertical: 4,
},

neededBadgeText: {
  color: '#D8B36A',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.7,
},
monthDetails: {
  color: '#7F94A7',
  fontSize: 11,
  fontWeight: '700',
  marginTop: 4,
},

monthArrow: {
  color: '#75C7F0',
  fontSize: 14,
  fontWeight: '900',
},
  gameCard: {
    backgroundColor: '#101D2B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#20354A',
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  gameInfo: {
    flex: 1,
    paddingRight: 10,
  },
gameNote: {
  color: '#6F8191',
  fontSize: 11,
  fontWeight: '600',
  marginTop: 4,
},
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  date: {
    color: '#75C7F0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  locationBadge: {
    backgroundColor: '#244438',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 8,
  },

  awayBadge: {
    backgroundColor: '#24384D',
  },

  locationText: {
    color: '#D9E2DF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
monthTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

completeBadge: {
  backgroundColor: '#294B3B',
  borderRadius: 6,
  paddingHorizontal: 7,
  paddingVertical: 4,
},

completeBadgeText: {
  color: '#8FD1A7',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.8,
},
  opponent: {
    color: '#F3EFE3',
    fontSize: 15,
    fontWeight: '800',
  },

  pickButtons: {
    flexDirection: 'row',
    gap: 7,
  },

  pickButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#31485C',
    backgroundColor: '#172636',
    justifyContent: 'center',
    alignItems: 'center',
  },
disabledPickButton: {
  opacity: 0.3,
  backgroundColor: '#101923',
  borderColor: '#263441',
},
  pickButtonText: {
    color: '#8FA2B3',
    fontSize: 15,
    fontWeight: '900',
  },

  winSelected: {
    backgroundColor: '#32664B',
    borderColor: '#5C9A76',
  },

  lossSelected: {
    backgroundColor: '#713D42',
    borderColor: '#A75A62',
  },

  selectedButtonText: {
    color: '#FFFFFF',
  },
resetButton: {
  alignSelf: 'flex-end',
  paddingHorizontal: 12,
  paddingVertical: 8,
  marginTop: -18,
  marginBottom: 26,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#55383D',
  backgroundColor: '#21181D',
},
loadingContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 30,
},

loadingText: {
  color: '#8FA2B3',
  fontSize: 15,
  fontWeight: '700',
},
resetButtonText: {
  color: '#C98389',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1,
},
deadlineCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 14,
  padding: 15,
  marginBottom: 20,
},

deadlineCardLocked: {
  backgroundColor: '#21181D',
  borderColor: '#55383D',
},

deadlineLabel: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.5,
},
predictorStatusCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 16,
  padding: 17,
  marginTop: 14,
},

predictorStatusRow: {
  flexDirection: 'row',
},

predictorStatusStat: {
  flex: 1,
  alignItems: 'center',
},

predictorStatusNumber: {
  color: '#F3EFE3',
  fontSize: 20,
  fontWeight: '900',
},

predictorStatusLabel: {
  color: '#7F94A7',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.9,
  marginTop: 3,
},

nextLockCard: {
  backgroundColor: '#122536',
  borderWidth: 2,
  borderColor: '#75C7F0',
  borderRadius: 18,
  padding: 18,
  marginTop: 14,
  marginBottom: 2,
},

nextLockEyebrow: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.5,
},

nextLockOpponent: {
  color: '#F3EFE3',
  fontSize: 23,
  fontWeight: '900',
  marginTop: 6,
},

nextLockTime: {
  color: '#8FA2B3',
  fontSize: 12,
  fontWeight: '700',
  marginTop: 3,
},

nextLockPick: {
  color: '#75C7F0',
  fontSize: 11,
  fontWeight: '900',
  letterSpacing: 1,
  marginTop: 12,
},
deadlineText: {
  color: '#F3EFE3',
  fontSize: 16,
  fontWeight: '900',
  marginTop: 5,
},

deadlineNote: {
  color: '#8FA2B3',
  fontSize: 12,
  marginTop: 5,
},
resultRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginTop: 6,
},

resultText: {
  color: '#8FA2B3',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.8,
},

gradeText: {
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.8,
},

correctText: {
  color: '#8FD1A7',
},

incorrectText: {
  color: '#D98B91',
},
accuracyCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 18,
  padding: 18,
  marginTop: 14,
},

accuracyHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

accuracyEyebrow: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.5,
},

accuracyNumber: {
  color: '#F3EFE3',
  fontSize: 34,
  fontWeight: '900',
  marginTop: 3,
},

gradedBadge: {
  backgroundColor: '#172A3C',
  borderRadius: 7,
  paddingHorizontal: 9,
  paddingVertical: 6,
},

gradedBadgeText: {
  color: '#8FA2B3',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 1,
},

accuracyStats: {
  flexDirection: 'row',
  borderTopWidth: 1,
  borderTopColor: '#20354A',
  marginTop: 14,
  paddingTop: 14,
},

accuracyStat: {
  flex: 1,
  alignItems: 'center',
},

correctNumber: {
  color: '#8FD1A7',
  fontSize: 20,
  fontWeight: '900',
},

incorrectNumber: {
  color: '#D98B91',
  fontSize: 20,
  fontWeight: '900',
},

accuracyStatLabel: {
  color: '#7F94A7',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 1,
  marginTop: 3,
},
leaderboardButton: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 16,
  padding: 17,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 14,
  marginBottom: 8,
},

leaderboardEyebrow: {
  color: '#75C7F0',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 1.5,
},

leaderboardTitle: {
  color: '#F3EFE3',
  fontSize: 17,
  fontWeight: '900',
  marginTop: 3,
},

leaderboardArrow: {
  color: '#75C7F0',
  fontSize: 30,
  fontWeight: '300',
},
scheduleActions: {
  flexDirection: 'row',
  gap: 7,
},

scheduleActionButton: {
  backgroundColor: '#162A3C',
  borderWidth: 1,
  borderColor: '#2C4A61',
  borderRadius: 7,
  paddingHorizontal: 9,
  paddingVertical: 7,
},

scheduleActionText: {
  color: '#75C7F0',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.7,
},
seasonStatusCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 18,
  padding: 20,
  marginTop: 16,
  marginBottom: 18,
},

seasonStatusEyebrow: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.5,
},

seasonAccuracy: {
  color: '#F3EFE3',
  fontSize: 42,
  fontWeight: '900',
  marginTop: 5,
},

seasonAccuracyLabel: {
  color: '#8FA2B3',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.2,
},

seasonStats: {
  flexDirection: 'row',
  borderTopWidth: 1,
  borderTopColor: '#20354A',
  marginTop: 16,
  paddingTop: 16,
},

seasonStat: {
  flex: 1,
  alignItems: 'center',
},

waitingText: {
  color: '#8FA2B3',
  fontSize: 13,
  lineHeight: 19,
  marginTop: 8,
},
rankSummary: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  borderTopWidth: 1,
  borderTopColor: '#20354A',
  marginTop: 16,
  paddingTop: 16,
},

rankSummaryLabel: {
  color: '#75C7F0',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 1.3,
},

rankSummaryNumber: {
  color: '#F3EFE3',
  fontSize: 28,
  fontWeight: '900',
  marginTop: 2,
},
clearPicksButton: {
  alignSelf: 'center',
  paddingHorizontal: 14,
  paddingVertical: 10,
  marginTop: 14,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#55383D',
  backgroundColor: '#21181D',
},

clearPicksButtonText: {
  color: '#C98389',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},
rankSummaryTotal: {
  color: '#8FA2B3',
  fontSize: 11,
  fontWeight: '700',
},
  demoNote: {
    color: '#60778A',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
});