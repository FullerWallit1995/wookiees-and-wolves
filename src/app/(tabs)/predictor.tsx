import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

type Game = {
  id: number;
  date: string;
  opponent: string;
  location?: 'HOME' | 'AWAY';
  month: string;
  available?: boolean;
  note?: string;
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
const [lockAt, setLockAt] = useState<string | null>(null);
const [seasonLoaded, setSeasonLoaded] = useState(false);
const [submittedAt, setSubmittedAt] =
  useState<string | null>(null);
  const [predictions, setPredictions] = useState<
    Record<number, Prediction>
  >({});
  const [predictionsLoaded, setPredictionsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
const [cloudLoaded, setCloudLoaded] = useState(false);
const [currentRank, setCurrentRank] =
  useState<number | null>(null);

const [leaderboardCount, setLeaderboardCount] =
  useState(0);
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
  async function loadSeason() {
    const { data, error } = await supabase
      .from('predictor_seasons')
      .select('lock_at')
      .eq('season', '2026-27')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.log(
        'Could not load Predictor season:',
        error
      );

      setSeasonLoaded(true);
      return;
    }

    setLockAt(data?.lock_at ?? null);
    setSeasonLoaded(true);
  }

  loadSeason();
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
    setCloudLoaded(false);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
useEffect(() => {
  async function loadRank() {
    if (!user) {
      setCurrentRank(null);
      setLeaderboardCount(0);
      return;
    }

    const { data, error } = await supabase.rpc(
      'get_predictor_leaderboard',
      {
        target_season: '2026-27',
      }
    );

    if (error) {
      console.log(
        'Could not load Predictor rank:',
        error
      );
      return;
    }

    const leaderboard = data ?? [];

    setLeaderboardCount(leaderboard.length);

    const userIndex = leaderboard.findIndex(
      (entry: { user_id: string }) =>
        entry.user_id === user.id
    );

    setCurrentRank(
      userIndex >= 0 ? userIndex + 1 : null
    );
  }

  loadRank();
}, [user, submittedAt, results]);
useEffect(() => {
  async function loadPredictions() {
    try {
      const savedPredictions = await AsyncStorage.getItem(
        'wolves-predictions-2026-27'
      );

      if (savedPredictions) {
        setPredictions(JSON.parse(savedPredictions));
      }
    } catch (error) {
      console.log('Could not load predictions:', error);
    } finally {
      setPredictionsLoaded(true);
    }
  }

  loadPredictions();
}, []);
useEffect(() => {
  async function syncInitialPredictions() {
    if (!user || !predictionsLoaded || cloudLoaded) {
      return;
    }

    const { data: cloudData, error } = await supabase
      .from('predictor_predictions')
      .select('predictions, submitted_at')
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
setSubmittedAt(cloudData?.submitted_at ?? null);
    if (cloudData?.predictions) {
      const cloudPredictions =
        cloudData.predictions as Record<number, Prediction>;

      setPredictions(cloudPredictions);
    } else if (Object.keys(predictions).length > 0) {
      const { error: uploadError } = await supabase
        .from('predictor_predictions')
        .insert({
          user_id: user.id,
          season: '2026-27',
          predictions,
        });

      if (uploadError) {
        console.log(
          'Could not upload local predictions:',
          uploadError
        );
        return;
      }
    }

    setCloudLoaded(true);
  }

  syncInitialPredictions();
}, [
  user,
  predictionsLoaded,
  cloudLoaded,
  predictions,
]);
useEffect(() => {
  async function savePredictions() {
    if (!predictionsLoaded) {
      return;
    }

    try {
      await AsyncStorage.setItem(
        'wolves-predictions-2026-27',
        JSON.stringify(predictions)
      );
    } catch (error) {
      console.log('Could not save predictions:', error);
    }
  }

  savePredictions();
}, [predictions, predictionsLoaded]);
useEffect(() => {
  async function savePredictionsToCloud() {
    if (
      !user ||
      !predictionsLoaded ||
      !cloudLoaded
    ) {
      return;
    }

    const { error } = await supabase
      .from('predictor_predictions')
      .upsert(
        {
          user_id: user.id,
          season: '2026-27',
          predictions,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,season',
        }
      );

    if (error) {
      console.log(
        'Could not save cloud predictions:',
        error
      );
    }
  }

  savePredictionsToCloud();
}, [
  predictions,
  user,
  predictionsLoaded,
  cloudLoaded,
]);
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

const availableGames = monthGames.filter(
  (game) => game.available !== false
);

const monthComplete =
  monthGames.length > 0 &&
  availableGames.length === monthGames.length &&
  monthWins + monthLosses === monthGames.length;

return {
  games: monthGames,
  wins: monthWins,
  losses: monthLosses,
  complete: monthComplete,
};
}

  const predicted = wins + losses;
  const remaining = 82 - predicted;
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
  const availableGames = games.filter(
  (game) => game.available !== false
);

const availableGameCount = availableGames.length;

const availablePredictedCount = availableGames.filter(
  (game) => !!predictions[game.id]
).length;

const readyToSubmit =
  availableGameCount > 0 &&
  availablePredictedCount === availableGameCount;
  const isLocked =
  !!lockAt && new Date() >= new Date(lockAt);

const formattedLockDate = lockAt
  ? new Date(lockAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  : null;

 function makePrediction(
  gameId: number,
  prediction: Prediction
) {
if (isLocked || results[gameId]) {
  return;
}

  setPredictions((current) => ({
    ...current,
    [gameId]: prediction,
  }));
}
  async function submitPredictions() {
  if (!user || isLocked || !readyToSubmit) {
    return;
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('predictor_predictions')
    .upsert(
      {
        user_id: user.id,
        season: '2026-27',
        predictions,
        submitted_at: now,
        updated_at: now,
      },
      {
        onConflict: 'user_id,season',
      }
    );

  if (error) {
    Alert.alert(
      'Could not submit picks',
      error.message
    );
    return;
  }

  setSubmittedAt(now);

  Alert.alert(
    'Picks submitted',
    'Your predictions are in. You can still make changes and resubmit until the deadline.'
  );
}
  function resetPredictions() {
  Alert.alert(
    'Reset all predictions?',
    'This will remove all of your picks for the 2026–27 season. This can’t be undone.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setPredictions({});

          try {
            await AsyncStorage.removeItem(
              'wolves-predictions-2026-27'
            );
          } catch (error) {
            console.log('Could not reset predictions:', error);
          }
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
          Pick every game and build your predicted Wolves record.
        </Text>
      <View
  style={[
    styles.deadlineCard,
    isLocked && styles.deadlineCardLocked,
  ]}
>
  <Text style={styles.deadlineLabel}>
    {isLocked ? 'PICKS LOCKED' : 'PICKS LOCK'}
  </Text>

  <Text style={styles.deadlineText}>
    {formattedLockDate ??
      'Deadline information unavailable'}
  </Text>

  {!isLocked && (
    <Text style={styles.deadlineNote}>
      You can change your predictions until the deadline.
    </Text>
  )}
</View>
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

            <View style={styles.divider} />

            <View style={styles.stat}>
              <Text style={styles.statNumber}>{remaining}</Text>
              <Text style={styles.statLabel}>LEFT</Text>
            </View>
          </View>
        </View>
{gradedPicks > 0 && !isLocked && (
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

  <Text style={styles.leaderboardArrow}>
    ›
  </Text>
</Pressable>
{!isLocked && (
  <>
        {/* PROGRESS */}
        
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {predicted} of 82 games predicted
          </Text>

          <Text style={styles.progressPercent}>
            {Math.round((predicted / 82) * 100)}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(predicted / 82) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.submitCard}>
  {isLocked ? (
    <>
      <Text style={styles.submitStatus}>
        PICKS LOCKED
      </Text>

      <Text style={styles.submitTitle}>
        {wins}–{losses}
      </Text>

      <Text style={styles.submitDescription}>
        Your 2026–27 predictions are locked.
      </Text>
    </>
  ) : submittedAt ? (
    <>
      <Text style={styles.submitStatus}>
        ✓ PICKS SUBMITTED
      </Text>

      <Text style={styles.submitDescription}>
        You can still change your picks and resubmit
        before the deadline.
      </Text>

      <Pressable
        style={styles.submitButton}
        onPress={submitPredictions}
        disabled={!readyToSubmit}
      >
        <Text style={styles.submitButtonText}>
          RESUBMIT PICKS
        </Text>
      </Pressable>
    </>
  ) : (
    <>
      <Text style={styles.submitStatus}>
        {readyToSubmit
          ? 'READY TO SUBMIT'
          : 'COMPLETE YOUR PICKS'}
      </Text>

      <Text style={styles.submitDescription}>
        {availablePredictedCount} of {availableGameCount}{' '}
        available games picked
      </Text>

      <Pressable
        style={[
          styles.submitButton,
          !readyToSubmit &&
            styles.submitButtonDisabled,
        ]}
        onPress={submitPredictions}
        disabled={!readyToSubmit}
      >
        <Text style={styles.submitButtonText}>
          SUBMIT PICKS
        </Text>
      </Pressable>
    </>
  )}
</View>
        {predicted > 0 && (
  
  <Pressable
    style={styles.resetButton}
    onPress={resetPredictions}
  >
    <Text style={styles.resetButtonText}>
      RESET PICKS
    </Text>
  </Pressable>
)}
  </>
)}
{isLocked && (
  <View style={styles.seasonStatusCard}>
    <Text style={styles.seasonStatusEyebrow}>
      SEASON PERFORMANCE
    </Text>

    {gradedPicks > 0 ? (
      <>
        <Text style={styles.seasonAccuracy}>
          {accuracy}%
        </Text>

        <Text style={styles.seasonAccuracyLabel}>
          PREDICTION ACCURACY
        </Text>

        <View style={styles.seasonStats}>
          <View style={styles.seasonStat}>
            <Text style={styles.correctNumber}>
              {correctPicks}
            </Text>
            <Text style={styles.accuracyStatLabel}>
              CORRECT
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.seasonStat}>
            <Text style={styles.incorrectNumber}>
              {incorrectPicks}
            </Text>
            <Text style={styles.accuracyStatLabel}>
              INCORRECT
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.seasonStat}>
            <Text style={styles.statNumber}>
              {gradedPicks}
            </Text>
            <Text style={styles.accuracyStatLabel}>
              GRADED
            </Text>
          </View>
        </View>
      </>
    ) : (
      <Text style={styles.waitingText}>
        Results will appear here as games are completed.
      </Text>
    )}
    {currentRank && (
  <View style={styles.rankSummary}>
    <View>
      <Text style={styles.rankSummaryLabel}>
        CURRENT RANK
      </Text>

      <Text style={styles.rankSummaryNumber}>
        #{currentRank}
      </Text>
    </View>

    <Text style={styles.rankSummaryTotal}>
      of {leaderboardCount}{' '}
      {leaderboardCount === 1
        ? 'entry'
        : 'entries'}
    </Text>
  </View>
)}
  </View>
)}
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

  {monthStats.complete && (
    <View style={styles.completeBadge}>
      <Text style={styles.completeBadgeText}>
        ✓ COMPLETE
      </Text>
    </View>
  )}
</View>

         <Text style={styles.monthDetails}>
  {monthStats.complete
    ? `${monthStats.games.length} games • ${monthStats.wins}–${monthStats.losses}`
    : `${monthStats.games.length} games • Picks: ${monthStats.wins}–${monthStats.losses}`}
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
  isLocked || !!actualResult;

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

{isLocked && prediction && (
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
  onPress={() => makePrediction(game.id, 'W')}
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
  onPress={() => makePrediction(game.id, 'L')}
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