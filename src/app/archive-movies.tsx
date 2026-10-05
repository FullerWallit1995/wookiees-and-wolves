import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import DraggableFlatList, {
    RenderItemParams,
} from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

type ArchiveMovie = {
  id: number;
  title: string;
  sort_order: number;
};

export default function ArchiveMoviesScreen() {
  const router = useRouter();

  const [movies, setMovies] =
    useState<ArchiveMovie[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [signedIn, setSignedIn] =
    useState(false);

  const [hasSavedRanking, setHasSavedRanking] =
    useState(false);

  const [hasChanges, setHasChanges] =
    useState(false);

  const loadRanking =
    useCallback(async () => {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setSignedIn(!!user);

        const {
          data: movieData,
          error: movieError,
        } = await supabase
          .from('archive_items')
          .select('id, title, sort_order')
          .eq('ranking_type', 'movies')
          .eq('active', true)
          .order('sort_order', {
            ascending: true,
          });

        if (movieError) {
          console.log(
            'Could not load Archive movies:',
            movieError
          );

          Alert.alert(
            'Could not load movies',
            'Something went wrong loading The Archives.'
          );

          return;
        }

        const availableMovies =
          (movieData ?? []) as ArchiveMovie[];

        if (!user) {
          setMovies(availableMovies);
          setHasSavedRanking(false);
          setHasChanges(false);
          return;
        }

        const {
          data: rankingData,
          error: rankingError,
        } = await supabase
          .from('archive_rankings')
          .select('item_id, rank')
          .eq('user_id', user.id)
          .eq('ranking_type', 'movies')
          .order('rank', {
            ascending: true,
          });

        if (rankingError) {
          console.log(
            'Could not load movie ranking:',
            rankingError
          );

          setMovies(availableMovies);
          return;
        }

        if (
          rankingData &&
          rankingData.length ===
            availableMovies.length
        ) {
          const movieMap = new Map(
            availableMovies.map((movie) => [
              movie.id,
              movie,
            ])
          );

          const rankedMovies = rankingData
            .map((ranking) =>
              movieMap.get(ranking.item_id)
            )
            .filter(
              (
                movie
              ): movie is ArchiveMovie =>
                !!movie
            );

          if (
            rankedMovies.length ===
            availableMovies.length
          ) {
            setMovies(rankedMovies);
            setHasSavedRanking(true);
            setHasChanges(false);
            return;
          }
        }

        setMovies(availableMovies);
        setHasSavedRanking(false);
        setHasChanges(false);
      } finally {
        setLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadRanking();
    }, [loadRanking])
  );

  

  async function saveRanking() {
    if (!signedIn) {
      Alert.alert(
        'Join The Archives',
        'Create a W&W account or sign in to save your Star Wars rankings.',
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
                params: {
                  mode: 'login',
                },
              }),
          },
          {
            text: 'Create Account',
            onPress: () =>
              router.push({
                pathname: '/auth',
                params: {
                  mode: 'signup',
                },
              }),
          },
        ]
      );
function renderMovie({
  item,
  drag,
  isActive,
  getIndex,
}: RenderItemParams<ArchiveMovie>) {
  const index = getIndex() ?? 0;

  return (
    <View
      style={[
        styles.movieRow,
        isActive && styles.movieRowActive,
      ]}
    >
      <View style={styles.rankBox}>
        <Text style={styles.rankNumber}>
          {String(index + 1).padStart(2, '0')}
        </Text>
      </View>

      <Text style={styles.movieTitle}>
        {item.title}
      </Text>

      <Pressable
        style={[
          styles.dragHandle,
          isActive && styles.dragHandleActive,
        ]}
        onLongPress={drag}
        delayLongPress={150}
        disabled={isActive}
      >
        <Text style={styles.dragHandleText}>
          ☰
        </Text>
      </Pressable>
    </View>
  );
}
      return;
    }

    if (movies.length === 0 || saving) {
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.rpc(
        'save_archive_ranking',
        {
          p_ranking_type: 'movies',
          p_item_ids: movies.map(
            (movie) => movie.id
          ),
        }
      );

      if (error) {
        console.log(
          'Could not save movie ranking:',
          error
        );

        Alert.alert(
          'Ranking not saved',
          'Something went wrong saving your Movie Archives.'
        );

        return;
      }

      setHasSavedRanking(true);
      setHasChanges(false);

      Alert.alert(
        'Ranking saved',
        'Your Star Wars Movie Archives have been updated.'
      );
    } finally {
      setSaving(false);
    }
  }
function renderMovie({
  item,
  drag,
  isActive,
  getIndex,
}: RenderItemParams<ArchiveMovie>) {
  const index = getIndex() ?? 0;

  return (
    <View
      style={[
        styles.movieRow,
        isActive && styles.movieRowActive,
      ]}
    >
      <View style={styles.rankBox}>
        <Text style={styles.rankNumber}>
          {String(index + 1).padStart(2, '0')}
        </Text>
      </View>

      <Text style={styles.movieTitle}>
        {item.title}
      </Text>

      <Pressable
        style={[
          styles.dragHandle,
          isActive && styles.dragHandleActive,
        ]}
        onLongPress={drag}
        delayLongPress={150}
        disabled={isActive}
      >
        <Text style={styles.dragHandleText}>
          ☰
        </Text>
      </Pressable>
    </View>
  );
}
  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <DraggableFlatList
  data={movies}
  keyExtractor={(item) =>
    String(item.id)
  }
  renderItem={renderMovie}
  onDragEnd={({ data }) => {
    setMovies(data);
    setHasChanges(true);
  }}
  activationDistance={8}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={styles.content}
  ListHeaderComponent={
    <>
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
        Star Wars Movies
      </Text>

      <Text style={styles.subtitle}>
        Rank the galaxy from favorite to
        least favorite.
      </Text>

      {!signedIn && !loading && (
        <View style={styles.guestCard}>
          <Text style={styles.guestEyebrow}>
            W&W MEMBERS
          </Text>

          <Text style={styles.guestTitle}>
            Make it yours
          </Text>

          <Text style={styles.guestText}>
            You can arrange the movies now,
            but you'll need a W&W account to
            save your ranking.
          </Text>
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>
          YOUR RANKING
        </Text>

        <Text style={styles.instructionsText}>
          Press and hold the handle, then drag
          each movie into place. Favorite at
          the top.
        </Text>
      </View>

      {loading && (
        <View style={styles.statusCard}>
          <ActivityIndicator />

          <Text style={styles.statusText}>
            Loading the galaxy...
          </Text>
        </View>
      )}
    </>
  }
  ListFooterComponent={
    !loading && movies.length > 0 ? (
      <>
        <Pressable
          style={[
            styles.saveButton,
            saving &&
              styles.saveButtonDisabled,
          ]}
          disabled={saving}
          onPress={saveRanking}
        >
          <Text style={styles.saveButtonText}>
            {saving
              ? 'SAVING...'
              : hasSavedRanking &&
                  !hasChanges
                ? 'RANKING SAVED ✓'
                : hasSavedRanking
                  ? 'SAVE CHANGES'
                  : 'SAVE MY RANKING'}
          </Text>
        </Pressable>

        {hasSavedRanking && (
          <Text style={styles.savedNote}>
            Your ranking is saved to your W&W
            profile. You can change it anytime.
          </Text>
        )}
      </>
    ) : null
  }
/>
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
    marginBottom: 22,
  },

  guestCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 16,
    padding: 17,
    marginBottom: 18,
  },

  guestEyebrow: {
    color: '#75C7F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  guestTitle: {
    color: '#F3EFE3',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },

  guestText: {
    color: '#8FA2B3',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  instructions: {
    marginBottom: 12,
  },

  instructionsTitle: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  instructionsText: {
    color: '#708599',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  movieRow: {
    minHeight: 64,
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rankBox: {
    width: 42,
    height: 42,
    borderRadius: 9,
    backgroundColor: '#162A3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rankNumber: {
    color: '#75C7F0',
    fontSize: 14,
    fontWeight: '900',
  },

  movieTitle: {
    flex: 1,
    color: '#F3EFE3',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
    paddingRight: 8,
  },
movieRowActive: {
  borderColor: '#75C7F0',
  backgroundColor: '#14283A',
  transform: [{ scale: 1.02 }],
},

dragHandle: {
  width: 42,
  height: 42,
  borderRadius: 9,
  borderWidth: 1,
  borderColor: '#31516B',
  backgroundColor: '#162A3C',
  alignItems: 'center',
  justifyContent: 'center',
},

dragHandleActive: {
  borderColor: '#75C7F0',
  backgroundColor: '#1D3549',
},

dragHandleText: {
  color: '#75C7F0',
  fontSize: 19,
  fontWeight: '900',
},

statusText: {
  color: '#8FA2B3',
  fontSize: 13,
  fontWeight: '700',
  marginTop: 10,
},

  saveButton: {
    backgroundColor: '#75C7F0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: '#07111F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  savedNote: {
    color: '#60778A',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },

  statusCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },

});