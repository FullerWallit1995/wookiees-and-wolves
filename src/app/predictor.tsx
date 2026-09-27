import AsyncStorage from '@react-native-async-storage/async-storage';
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

const games: Game[] = [
 {
  id: 1,
  date: 'OCT 21',
  opponent: 'Miami Heat',
  location: 'AWAY',
  month: 'OCTOBER',
},
{
  id: 2,
  date: 'OCT 23',
  opponent: 'Orlando Magic',
  location: 'AWAY',
  month: 'OCTOBER',
},
{
  id: 3,
  date: 'OCT 25',
  opponent: 'Toronto Raptors',
  location: 'HOME',
  month: 'OCTOBER',
},
{
  id: 4,
  date: 'OCT 26',
  opponent: 'Cleveland Cavaliers',
  location: 'AWAY',
  month: 'OCTOBER',
},
{
  id: 5,
  date: 'OCT 28',
  opponent: 'Golden State Warriors',
  location: 'HOME',
  month: 'OCTOBER',
},
{
  id: 6,
  date: 'OCT 30',
  opponent: 'LA Clippers',
  location: 'HOME',
  month: 'OCTOBER',
},
{
  id: 7,
  date: 'OCT 31',
  opponent: 'San Antonio Spurs',
  location: 'AWAY',
  month: 'OCTOBER',
},
{
  id: 8,
  date: 'NOV 2',
  opponent: 'Milwaukee Bucks',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 9,
  date: 'NOV 4',
  opponent: 'Houston Rockets',
  location: 'AWAY',
  month: 'NOVEMBER',
},
{
  id: 10,
  date: 'NOV 6',
  opponent: 'New Orleans Pelicans',
  location: 'AWAY',
  month: 'NOVEMBER',
},
{
  id: 11,
  date: 'NOV 8',
  opponent: 'Utah Jazz',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 12,
  date: 'NOV 12',
  opponent: 'Dallas Mavericks',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 13,
  date: 'NOV 14',
  opponent: 'Chicago Bulls',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 14,
  date: 'NOV 16',
  opponent: 'Portland Trail Blazers',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 15,
  date: 'NOV 17',
  opponent: 'Portland Trail Blazers',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 16,
  date: 'NOV 19',
  opponent: 'New York Knicks',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 17,
  date: 'NOV 21',
  opponent: 'Memphis Grizzlies',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 18,
  date: 'NOV 23',
  opponent: 'Brooklyn Nets',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 19,
  date: 'NOV 25',
  opponent: 'Oklahoma City Thunder',
  location: 'AWAY',
  month: 'NOVEMBER',
},
{
  id: 20,
  date: 'NOV 27',
  opponent: 'Memphis Grizzlies',
  location: 'HOME',
  month: 'NOVEMBER',
},
{
  id: 21,
  date: 'NOV 29',
  opponent: 'Sacramento Kings',
  location: 'AWAY',
  month: 'NOVEMBER',
},
{
  id: 22,
  date: 'DEC 1',
  opponent: 'Portland Trail Blazers',
  location: 'AWAY',
  month: 'DECEMBER',
},
{
  id: 23,
  date: 'DEC 2',
  opponent: 'LA Clippers',
  location: 'AWAY',
  month: 'DECEMBER',
},
{
  id: 24,
  date: 'DEC TBD',
  opponent: 'Opponent TBD',
  month: 'DECEMBER',
  available: false,
  note: 'NBA Cup scheduling window',
},
{
  id: 25,
  date: 'DEC TBD',
  opponent: 'Opponent TBD',
  month: 'DECEMBER',
  available: false,
  note: 'NBA Cup scheduling window',
},
{
  id: 26,
  date: 'DEC 12',
  opponent: 'Phoenix Suns',
  location: 'AWAY',
  month: 'DECEMBER',
},
{
  id: 27,
  date: 'DEC 14',
  opponent: 'Utah Jazz',
  location: 'AWAY',
  month: 'DECEMBER',
},
{
  id: 28,
  date: 'DEC 16',
  opponent: 'Los Angeles Lakers',
  location: 'HOME',
  month: 'DECEMBER',
},
{
  id: 29,
  date: 'DEC 18',
  opponent: 'Los Angeles Lakers',
  location: 'HOME',
  month: 'DECEMBER',
},
{
  id: 30,
  date: 'DEC 21',
  opponent: 'Phoenix Suns',
  location: 'HOME',
  month: 'DECEMBER',
},
{
  id: 31,
  date: 'DEC 23',
  opponent: 'Milwaukee Bucks',
  location: 'AWAY',
  month: 'DECEMBER',
},
{
  id: 32,
  date: 'DEC 25',
  opponent: 'Oklahoma City Thunder',
  location: 'HOME',
  month: 'DECEMBER',
},
{
  id: 33,
  date: 'DEC 27',
  opponent: 'Golden State Warriors',
  location: 'AWAY',
  month: 'DECEMBER',
},
{
  id: 34,
  date: 'DEC 28',
  opponent: 'Denver Nuggets',
  location: 'AWAY',
  month: 'DECEMBER',
},
{
  id: 35,
  date: 'DEC 31',
  opponent: 'Denver Nuggets',
  location: 'HOME',
  month: 'DECEMBER',
},
// JANUARY
{
  id: 36,
  date: 'JAN 2',
  opponent: 'Indiana Pacers',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 37,
  date: 'JAN 3',
  opponent: 'San Antonio Spurs',
  location: 'HOME',
  month: 'JANUARY',
},
{
  id: 38,
  date: 'JAN 5',
  opponent: 'Houston Rockets',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 39,
  date: 'JAN 7',
  opponent: 'Toronto Raptors',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 40,
  date: 'JAN 8',
  opponent: 'Washington Wizards',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 41,
  date: 'JAN 11',
  opponent: 'Cleveland Cavaliers',
  location: 'HOME',
  month: 'JANUARY',
},
{
  id: 42,
  date: 'JAN 14',
  opponent: 'Chicago Bulls',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 43,
  date: 'JAN 16',
  opponent: 'Philadelphia 76ers',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 44,
  date: 'JAN 18',
  opponent: 'New York Knicks',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 45,
  date: 'JAN 20',
  opponent: 'Houston Rockets',
  location: 'HOME',
  month: 'JANUARY',
},
{
  id: 46,
  date: 'JAN 22',
  opponent: 'San Antonio Spurs',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 47,
  date: 'JAN 24',
  opponent: 'Detroit Pistons',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 48,
  date: 'JAN 25',
  opponent: 'Memphis Grizzlies',
  location: 'AWAY',
  month: 'JANUARY',
},
{
  id: 49,
  date: 'JAN 27',
  opponent: 'Denver Nuggets',
  location: 'HOME',
  month: 'JANUARY',
},
{
  id: 50,
  date: 'JAN 29',
  opponent: 'Charlotte Hornets',
  location: 'HOME',
  month: 'JANUARY',
},
{
  id: 51,
  date: 'JAN 31',
  opponent: 'Phoenix Suns',
  location: 'HOME',
  month: 'JANUARY',
},

// FEBRUARY
{
  id: 52,
  date: 'FEB 2',
  opponent: 'Portland Trail Blazers',
  location: 'AWAY',
  month: 'FEBRUARY',
},
{
  id: 53,
  date: 'FEB 4',
  opponent: 'Sacramento Kings',
  location: 'AWAY',
  month: 'FEBRUARY',
},
{
  id: 54,
  date: 'FEB 6',
  opponent: 'Miami Heat',
  location: 'HOME',
  month: 'FEBRUARY',
},
{
  id: 55,
  date: 'FEB 7',
  opponent: 'Utah Jazz',
  location: 'HOME',
  month: 'FEBRUARY',
},
{
  id: 56,
  date: 'FEB 9',
  opponent: 'Brooklyn Nets',
  location: 'AWAY',
  month: 'FEBRUARY',
},
{
  id: 57,
  date: 'FEB 12',
  opponent: 'Boston Celtics',
  location: 'AWAY',
  month: 'FEBRUARY',
},
{
  id: 58,
  date: 'FEB 15',
  opponent: 'Charlotte Hornets',
  location: 'AWAY',
  month: 'FEBRUARY',
},
{
  id: 59,
  date: 'FEB 18',
  opponent: 'San Antonio Spurs',
  location: 'HOME',
  month: 'FEBRUARY',
},
{
  id: 60,
  date: 'FEB 26',
  opponent: 'Indiana Pacers',
  location: 'HOME',
  month: 'FEBRUARY',
},
{
  id: 61,
  date: 'FEB 28',
  opponent: 'Boston Celtics',
  location: 'HOME',
  month: 'FEBRUARY',
},

// MARCH
{
  id: 62,
  date: 'MAR 2',
  opponent: 'Oklahoma City Thunder',
  location: 'AWAY',
  month: 'MARCH',
},
{
  id: 63,
  date: 'MAR 5',
  opponent: 'Phoenix Suns',
  location: 'AWAY',
  month: 'MARCH',
},
{
  id: 64,
  date: 'MAR 7',
  opponent: 'Denver Nuggets',
  location: 'AWAY',
  month: 'MARCH',
},
{
  id: 65,
  date: 'MAR 8',
  opponent: 'New Orleans Pelicans',
  location: 'HOME',
  month: 'MARCH',
},
{
  id: 66,
  date: 'MAR 10',
  opponent: 'Atlanta Hawks',
  location: 'HOME',
  month: 'MARCH',
},
{
  id: 67,
  date: 'MAR 13',
  opponent: 'Philadelphia 76ers',
  location: 'HOME',
  month: 'MARCH',
},
{
  id: 68,
  date: 'MAR 14',
  opponent: 'Washington Wizards',
  location: 'HOME',
  month: 'MARCH',
},
{
  id: 69,
  date: 'MAR 16',
  opponent: 'New Orleans Pelicans',
  location: 'AWAY',
  month: 'MARCH',
},
{
  id: 70,
  date: 'MAR 18',
  opponent: 'Utah Jazz',
  location: 'AWAY',
  month: 'MARCH',
},
{
  id: 71,
  date: 'MAR 22',
  opponent: 'Detroit Pistons',
  location: 'HOME',
  month: 'MARCH',
},
{
  id: 72,
  date: 'MAR 24',
  opponent: 'Dallas Mavericks',
  location: 'HOME',
  month: 'MARCH',
},
{
  id: 73,
  date: 'MAR 26',
  opponent: 'Orlando Magic',
  location: 'HOME',
  month: 'MARCH',
},
{
  id: 74,
  date: 'MAR 28',
  opponent: 'Oklahoma City Thunder',
  location: 'HOME',
  month: 'MARCH',
},
{
  id: 75,
  date: 'MAR 29',
  opponent: 'Atlanta Hawks',
  location: 'AWAY',
  month: 'MARCH',
},
{
  id: 76,
  date: 'MAR 31',
  opponent: 'Sacramento Kings',
  location: 'HOME',
  month: 'MARCH',
},

// APRIL
{
  id: 77,
  date: 'APR 2',
  opponent: 'Golden State Warriors',
  location: 'HOME',
  month: 'APRIL',
},
{
  id: 78,
  date: 'APR 4',
  opponent: 'Dallas Mavericks',
  location: 'AWAY',
  month: 'APRIL',
},
{
  id: 79,
  date: 'APR 6',
  opponent: 'LA Clippers',
  location: 'AWAY',
  month: 'APRIL',
},
{
  id: 80,
  date: 'APR 7',
  opponent: 'Los Angeles Lakers',
  location: 'AWAY',
  month: 'APRIL',
},
{
  id: 81,
  date: 'APR 9',
  opponent: 'Los Angeles Lakers',
  location: 'AWAY',
  month: 'APRIL',
},
{
  id: 82,
  date: 'APR 11',
  opponent: 'Houston Rockets',
  location: 'HOME',
  month: 'APRIL',
}
];
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
  const [predictions, setPredictions] = useState<
    Record<number, Prediction>
  >({});
  const [predictionsLoaded, setPredictionsLoaded] = useState(false);

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

  function makePrediction(gameId: number, prediction: Prediction) {
    setPredictions((current) => ({
      ...current,
      [gameId]: prediction,
    }));
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

{/* SCHEDULE */}
<View style={styles.gamesHeader}>
  <Text style={styles.sectionTitle}>Schedule</Text>
  <Text style={styles.gameCount}>82 GAMES</Text>
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

{game.note && (
  <Text style={styles.gameNote}>
    {game.note}
  </Text>
)}
              </View>

              <View style={styles.pickButtons}>
                <Pressable
  disabled={game.available === false}
  style={[
    styles.pickButton,
    prediction === 'W' && styles.winSelected,
    game.available === false && styles.disabledPickButton,
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
  disabled={game.available === false}
  style={[
    styles.pickButton,
    prediction === 'L' && styles.lossSelected,
    game.available === false && styles.disabledPickButton,
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

        <Text style={styles.demoNote}>
          Prototype schedule — full 82-game schedule coming next.
        </Text>
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

resetButtonText: {
  color: '#C98389',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1,
},
  demoNote: {
    color: '#60778A',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
});