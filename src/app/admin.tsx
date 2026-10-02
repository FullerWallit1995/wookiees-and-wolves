import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Prediction = 'W' | 'L';
type AdminSection = 'predictor' | 'den';
type DenContentType = 'post' | 'poll';
type DenCategory =
  | 'pack'
  | 'cantina'
  | 'both';
  type AdminGame = {
  game_id: number;
  game_date: string;
  opponent: string;
  location: 'HOME' | 'AWAY' | null;
  picks_lock_at: string | null;
};
type AdminDenItem = {
  id: number;
  type: 'post' | 'poll';
  category: DenCategory;
  content: string;
  published: boolean;
  created_at: string;
};
type GameResult = {
  game_id: number;
  result: Prediction;
  final: boolean;
  updated_at: string;
};

export default function AdminScreen() {
  const router = useRouter();
const scrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [results, setResults] = useState<
    Record<number, GameResult>
  >({});
  const [savingGameId, setSavingGameId] =
    useState<number | null>(null);
const [adminSection, setAdminSection] =
  useState<AdminSection>('predictor');
  const [denContentType, setDenContentType] =
  useState<DenContentType>('post');

const [denCategory, setDenCategory] =
  useState<DenCategory>('pack');

const [postText, setPostText] =
  useState('');

const [pollQuestion, setPollQuestion] =
  useState('');

const [pollOptions, setPollOptions] =
  useState(['', '']);
const [recentDenContent, setRecentDenContent] =
  useState<AdminDenItem[]>([]);

const [denContentLoading, setDenContentLoading] =
  useState(false);

const [managingDenId, setManagingDenId] =
  useState<string | null>(null);
const [publishingDen, setPublishingDen] =
  useState(false);
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
  const loadRecentDenContent =
  useCallback(async () => {
    setDenContentLoading(true);

    try {
      const [
        { data: posts, error: postsError },
        { data: polls, error: pollsError },
      ] = await Promise.all([
        supabase
          .from('posts')
          .select(
            'id, category, content, published, created_at'
          )
          .order('created_at', {
            ascending: false,
          })
          .limit(10),

        supabase
          .from('polls')
          .select(
            'id, category, question, published, created_at'
          )
          .order('created_at', {
            ascending: false,
          })
          .limit(10),
      ]);

      if (postsError || pollsError) {
        console.log(
          'Could not load recent Den content:',
          postsError ?? pollsError
        );
        return;
      }

      const items: AdminDenItem[] = [
        ...(posts ?? []).map((post) => ({
          id: post.id,
          type: 'post' as const,
          category: post.category as DenCategory,
          content: post.content,
          published: post.published,
          created_at: post.created_at,
        })),

        ...(polls ?? []).map((poll) => ({
          id: poll.id,
          type: 'poll' as const,
          category: poll.category as DenCategory,
          content: poll.question,
          published: poll.published,
          created_at: poll.created_at,
        })),
      ];

      items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      setRecentDenContent(items.slice(0, 10));
    } finally {
      setDenContentLoading(false);
    }
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

await Promise.all([
  loadData(),
  loadRecentDenContent(),
]);
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();
  }, [
  loadData,
  loadRecentDenContent,
  router,
]);

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

async function publishPost() {
  const cleanText = postText.trim();

  if (!cleanText) {
    Alert.alert(
      'Post is empty',
      'Enter something to publish.'
    );
    return;
  }

  Alert.alert(
    'Publish post?',
    `Publish this to ${
      denCategory === 'pack'
  ? 'The Pack'
  : denCategory === 'cantina'
    ? 'The Cantina'
    : 'All of The Den'
    }?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Publish',
        onPress: async () => {
          try {
            setPublishingDen(true);

            const { error } = await supabase
              .from('posts')
              .insert({
                category: denCategory,
                content: cleanText,
                published: true,
              });

            if (error) {
              console.log(
                'Could not publish Den post:',
                error
              );

              Alert.alert(
                'Post not published',
                'Something went wrong publishing this post.'
              );

              return;
            }

            setPostText('');
await loadRecentDenContent();
            Alert.alert(
              'Post published',
              `Your post is now live in ${
                denCategory === 'pack'
  ? 'The Pack'
  : denCategory === 'cantina'
    ? 'The Cantina'
    : 'All of The Den'
              }.`
            );
          } finally {
            setPublishingDen(false);
          }
        },
      },
    ]
  );
}

async function publishPoll() {
  const cleanQuestion = pollQuestion.trim();

  const cleanOptions = pollOptions
    .map((option) => option.trim())
    .filter(Boolean);

  if (!cleanQuestion) {
    Alert.alert(
      'Question is empty',
      'Enter a poll question.'
    );
    return;
  }

  if (cleanOptions.length < 2) {
    Alert.alert(
      'More options needed',
      'Enter at least two poll options.'
    );
    return;
  }

  Alert.alert(
    'Publish poll?',
    `Publish this poll to ${
      denCategory === 'pack'
  ? 'The Pack'
  : denCategory === 'cantina'
    ? 'The Cantina'
    : 'All of The Den'
    }?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Publish',
        onPress: async () => {
          try {
            setPublishingDen(true);

            const {
              data: poll,
              error: pollError,
            } = await supabase
              .from('polls')
              .insert({
                category: denCategory,
                question: cleanQuestion,
                published: true,
              })
              .select('id')
              .single();

            if (pollError || !poll) {
              console.log(
                'Could not publish Den poll:',
                pollError
              );

              Alert.alert(
                'Poll not published',
                'Something went wrong creating this poll.'
              );

              return;
            }

            const optionRows =
              cleanOptions.map(
                (option, index) => ({
                  poll_id: poll.id,
                  option_text: option,
                  sort_order: index + 1,
                })
              );

            const { error: optionsError } =
              await supabase
                .from('poll_options')
                .insert(optionRows);

            if (optionsError) {
              console.log(
                'Could not create poll options:',
                optionsError
              );

              /*
               * Don't leave a broken published poll
               * behind if its options failed.
               */
              await supabase
                .from('polls')
                .delete()
                .eq('id', poll.id);

              Alert.alert(
                'Poll not published',
                'Something went wrong creating the poll options.'
              );

              return;
            }

            setPollQuestion('');
            setPollOptions(['', '']);
await loadRecentDenContent();
            Alert.alert(
              'Poll published',
              `Your poll is now live in ${
                denCategory === 'pack'
  ? 'The Pack'
  : denCategory === 'cantina'
    ? 'The Cantina'
    : 'All of The Den'
              }.`
            );
          } finally {
            setPublishingDen(false);
          }
        },
      },
    ]
  );
}
async function setDenPublished(
  item: AdminDenItem,
  published: boolean
) {
  const key = `${item.type}-${item.id}`;

  try {
    setManagingDenId(key);

    const table =
      item.type === 'post'
        ? 'posts'
        : 'polls';

    const { error } = await supabase
      .from(table)
      .update({
        published,
      })
      .eq('id', item.id);

    if (error) {
      console.log(
        'Could not update Den content:',
        error
      );

      Alert.alert(
        'Content not updated',
        'Something went wrong updating this item.'
      );

      return;
    }

    await loadRecentDenContent();
  } finally {
    setManagingDenId(null);
  }
}
function confirmDeleteDenItem(
  item: AdminDenItem
) {
  Alert.alert(
    `Delete ${item.type}?`,
    'This permanently deletes this item and cannot be undone.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteDenItem(item),
      },
    ]
  );
}

async function deleteDenItem(
  item: AdminDenItem
) {
  const key = `${item.type}-${item.id}`;

  try {
    setManagingDenId(key);

    const table =
      item.type === 'post'
        ? 'posts'
        : 'polls';

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', item.id);

    if (error) {
      console.log(
        'Could not delete Den content:',
        error
      );

      Alert.alert(
        'Content not deleted',
        'Something went wrong deleting this item.'
      );

      return;
    }

    await loadRecentDenContent();
  } finally {
    setManagingDenId(null);
  }
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
  <KeyboardAvoidingView
    style={styles.flex}
    behavior={
      Platform.OS === 'ios'
        ? 'padding'
        : undefined
    }
  >
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
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
<View style={styles.adminTabs}>
  <Pressable
    style={[
      styles.adminTab,
      adminSection === 'predictor' &&
        styles.adminTabActive,
    ]}
    onPress={() =>
      setAdminSection('predictor')
    }
  >
    <Text
      style={[
        styles.adminTabText,
        adminSection === 'predictor' &&
          styles.adminTabTextActive,
      ]}
    >
      PREDICTOR
    </Text>
  </Pressable>

  <Pressable
    style={[
      styles.adminTab,
      adminSection === 'den' &&
        styles.adminTabActive,
    ]}
    onPress={() =>
      setAdminSection('den')
    }
  >
    <Text
      style={[
        styles.adminTabText,
        adminSection === 'den' &&
          styles.adminTabTextActive,
      ]}
    >
      THE DEN
    </Text>
  </Pressable>
</View>
{adminSection === 'predictor' && (
  <>
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
          </>
)}
{adminSection === 'den' && (
  <>
    <Text style={styles.sectionLabel}>
      CREATE DEN CONTENT
    </Text>

    <View style={styles.denCreateCard}>
      <Text style={styles.denFieldLabel}>
        CONTENT TYPE
      </Text>

      <View style={styles.denChoiceRow}>
        <Pressable
          style={[
            styles.denChoiceButton,
            denContentType === 'post' &&
              styles.denChoiceButtonActive,
          ]}
          onPress={() =>
            setDenContentType('post')
          }
        >
          <Text
            style={[
              styles.denChoiceText,
              denContentType === 'post' &&
                styles.denChoiceTextActive,
            ]}
          >
            POST
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.denChoiceButton,
            denContentType === 'poll' &&
              styles.denChoiceButtonActive,
          ]}
          onPress={() =>
            setDenContentType('poll')
          }
        >
          <Text
            style={[
              styles.denChoiceText,
              denContentType === 'poll' &&
                styles.denChoiceTextActive,
            ]}
          >
            POLL
          </Text>
        </Pressable>
      </View>

      <Text
        style={[
          styles.denFieldLabel,
          styles.denFieldSpacing,
        ]}
      >
        PUBLISH TO
      </Text>

      <View style={styles.denChoiceRow}>
        <Pressable
          style={[
            styles.denChoiceButton,
            denCategory === 'pack' &&
              styles.denChoiceButtonActive,
          ]}
          onPress={() =>
            setDenCategory('pack')
          }
        >
          <Text
            style={[
              styles.denChoiceText,
              denCategory === 'pack' &&
                styles.denChoiceTextActive,
            ]}
          >
            THE PACK
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.denChoiceButton,
            denCategory === 'cantina' &&
              styles.denChoiceButtonActive,
          ]}
          onPress={() =>
            setDenCategory('cantina')
          }
        >
          <Text
            style={[
              styles.denChoiceText,
              denCategory === 'cantina' &&
                styles.denChoiceTextActive,
            ]}
          >
            THE CANTINA
          </Text>
        </Pressable>
        <Pressable
  style={[
    styles.denChoiceButton,
    denCategory === 'both' &&
      styles.denChoiceButtonActive,
  ]}
  onPress={() =>
    setDenCategory('both')
  }
>
  <Text
    style={[
      styles.denChoiceText,
      denCategory === 'both' &&
        styles.denChoiceTextActive,
    ]}
  >
    ALL OF THE DEN
  </Text>
</Pressable>
      </View>

      {denContentType === 'post' ? (
        <>
          <Text
            style={[
              styles.denFieldLabel,
              styles.denFieldSpacing,
            ]}
          >
            POST
          </Text>

          <TextInput
            style={[
              styles.denInput,
              styles.denLargeInput,
            ]}
            onFocus={() => {
  setTimeout(() => {
    scrollRef.current?.scrollToEnd({
      animated: true,
    });
  }, 150);
}}
            value={postText}
            onChangeText={setPostText}
            placeholder="What do you want to post?"
            placeholderTextColor="#53697B"
            multiline
            textAlignVertical="top"
            editable={!publishingDen}
          />

          <Pressable
            style={[
              styles.denPublishButton,
              publishingDen &&
                styles.disabledButton,
            ]}
            disabled={publishingDen}
            onPress={publishPost}
          >
            <Text
              style={
                styles.denPublishButtonText
              }
            >
              {publishingDen
                ? 'PUBLISHING...'
                : 'PUBLISH POST'}
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text
            style={[
              styles.denFieldLabel,
              styles.denFieldSpacing,
            ]}
          >
            QUESTION
          </Text>

          <TextInput
          onFocus={() => {
  setTimeout(() => {
    scrollRef.current?.scrollToEnd({
      animated: true,
    });
  }, 150);
}}
            style={styles.denInput}
            value={pollQuestion}
            onChangeText={setPollQuestion}
            placeholder="Ask the community..."
            placeholderTextColor="#53697B"
            editable={!publishingDen}
          />

          <Text
            style={[
              styles.denFieldLabel,
              styles.denFieldSpacing,
            ]}
          >
            OPTIONS
          </Text>

          {pollOptions.map(
            (option, index) => (
              <TextInput
                key={index}
                style={[
                  styles.denInput,
                  index > 0 &&
                    styles.denOptionSpacing,
                ]}
                value={option}
                onFocus={() => {
  setTimeout(() => {
    scrollRef.current?.scrollToEnd({
      animated: true,
    });
  }, 150);
}}
                onChangeText={(value) => {
                  setPollOptions(
                    (current) =>
                      current.map(
                        (
                          currentOption,
                          optionIndex
                        ) =>
                          optionIndex === index
                            ? value
                            : currentOption
                      )
                  );
                }}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor="#53697B"
                editable={!publishingDen}
              />
            )
          )}

          {pollOptions.length < 4 && (
            <Pressable
              style={styles.addOptionButton}
              onPress={() =>
                setPollOptions((current) => [
                  ...current,
                  '',
                ])
              }
            >
              <Text
                style={
                  styles.addOptionButtonText
                }
              >
                + ADD OPTION
              </Text>
            </Pressable>
          )}

          {pollOptions.length > 2 && (
            <Pressable
              style={styles.removeOptionButton}
              onPress={() =>
                setPollOptions((current) =>
                  current.slice(0, -1)
                )
              }
            >
              <Text
                style={
                  styles.removeOptionButtonText
                }
              >
                REMOVE LAST OPTION
              </Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.denPublishButton,
              publishingDen &&
                styles.disabledButton,
            ]}
            disabled={publishingDen}
            onPress={publishPoll}
          >
            <Text
              style={
                styles.denPublishButtonText
              }
            >
              {publishingDen
                ? 'PUBLISHING...'
                : 'PUBLISH POLL'}
            </Text>
          </Pressable>
        </>
      )}
    </View>
    <Text
  style={[
    styles.sectionLabel,
    styles.denRecentLabel,
  ]}
>
  RECENT DEN CONTENT
</Text>

{denContentLoading ? (
  <View style={styles.emptyCard}>
    <Text style={styles.emptyText}>
      Loading Den content...
    </Text>
  </View>
) : recentDenContent.length === 0 ? (
  <View style={styles.emptyCard}>
    <Text style={styles.emptyTitle}>
      Nothing published yet
    </Text>

    <Text style={styles.emptyText}>
      Posts and polls you create will appear here.
    </Text>
  </View>
) : (
  recentDenContent.map((item) => {
    const key =
      `${item.type}-${item.id}`;

    const managing =
      managingDenId === key;

    const categoryLabel =
      item.category === 'pack'
        ? 'THE PACK'
        : item.category === 'cantina'
          ? 'THE CANTINA'
          : 'ALL OF THE DEN';

    return (
      <View
        key={key}
        style={styles.denContentCard}
      >
        <View style={styles.denContentMeta}>
          <Text style={styles.denContentType}>
            {item.type === 'post'
              ? 'POST'
              : 'POLL'}
          </Text>

          <Text style={styles.denContentCategory}>
            {categoryLabel}
          </Text>

          <Text
            style={[
              styles.denContentStatus,
              !item.published &&
                styles.denContentStatusHidden,
            ]}
          >
            {item.published
              ? 'LIVE'
              : 'HIDDEN'}
          </Text>
        </View>

        <Text style={styles.denContentText}>
          {item.content}
        </Text>

        <View style={styles.denContentActions}>
          <Pressable
            style={[
              styles.denManageButton,
              managing &&
                styles.disabledButton,
            ]}
            disabled={managing}
            onPress={() =>
              setDenPublished(
                item,
                !item.published
              )
            }
          >
            <Text
              style={
                styles.denManageButtonText
              }
            >
              {item.published
                ? 'UNPUBLISH'
                : 'REPUBLISH'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.denDeleteButton,
              managing &&
                styles.disabledButton,
            ]}
            disabled={managing}
            onPress={() =>
              confirmDeleteDenItem(item)
            }
          >
            <Text
              style={
                styles.denDeleteButtonText
              }
            >
              DELETE
            </Text>
          </Pressable>
        </View>
      </View>
    );
  })
)}
  </>
)}
          </ScrollView>
  </KeyboardAvoidingView>
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
flex: {
  flex: 1,
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
  adminTabs: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 26,
},

adminTab: {
  flex: 1,
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
},

adminTabActive: {
  backgroundColor: '#75C7F0',
  borderColor: '#75C7F0',
},

adminTabText: {
  color: '#8FA2B3',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},

adminTabTextActive: {
  color: '#07111F',
},

denCreateCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 18,
  padding: 18,
},

denFieldLabel: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.3,
  marginBottom: 8,
},

denFieldSpacing: {
  marginTop: 20,
},

denChoiceRow: {
  flexDirection: 'row',
  gap: 8,
},

denChoiceButton: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#2A4053',
  backgroundColor: '#0B1723',
  borderRadius: 9,
  paddingVertical: 10,
  alignItems: 'center',
},

denChoiceButtonActive: {
  backgroundColor: '#75C7F0',
  borderColor: '#75C7F0',
},

denChoiceText: {
  color: '#8FA2B3',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.8,
},

denChoiceTextActive: {
  color: '#07111F',
},

denInput: {
  backgroundColor: '#0B1723',
  borderWidth: 1,
  borderColor: '#2A4053',
  borderRadius: 9,
  paddingHorizontal: 13,
  paddingVertical: 12,
  color: '#F3EFE3',
  fontSize: 14,
},

denLargeInput: {
  minHeight: 120,
},

denOptionSpacing: {
  marginTop: 8,
},

addOptionButton: {
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 9,
  paddingVertical: 10,
  alignItems: 'center',
  marginTop: 10,
},

addOptionButtonText: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.8,
},

removeOptionButton: {
  alignItems: 'center',
  paddingVertical: 9,
  marginTop: 3,
},

removeOptionButtonText: {
  color: '#C98389',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.7,
},

denPublishButton: {
  backgroundColor: '#75C7F0',
  borderRadius: 9,
  paddingVertical: 13,
  alignItems: 'center',
  marginTop: 20,
},

denPublishButtonText: {
  color: '#07111F',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1,
},
denRecentLabel: {
  marginTop: 28,
},

denContentCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 14,
  padding: 15,
  marginBottom: 9,
},

denContentMeta: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 7,
  flexWrap: 'wrap',
},

denContentType: {
  color: '#75C7F0',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 1,
},

denContentCategory: {
  color: '#8FA2B3',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.8,
},

denContentStatus: {
  color: '#7FB994',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.8,
},

denContentStatusHidden: {
  color: '#C98389',
},

denContentText: {
  color: '#F3EFE3',
  fontSize: 15,
  fontWeight: '800',
  lineHeight: 21,
  marginTop: 9,
},

denContentActions: {
  flexDirection: 'row',
  gap: 8,
  marginTop: 14,
},

denManageButton: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 8,
  paddingVertical: 9,
  alignItems: 'center',
},

denManageButtonText: {
  color: '#75C7F0',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.8,
},

denDeleteButton: {
  borderWidth: 1,
  borderColor: '#55383D',
  backgroundColor: '#21181D',
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 9,
  alignItems: 'center',
},

denDeleteButtonText: {
  color: '#C98389',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.8,
},
});