import { useEpisodes } from '@/hooks/useEpisodes';
import { usePredictorSummary } from '@/hooks/usePredictorSummary';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] =
  useState<string | null>(null);
    const {
    latestEpisode,
    loading: episodesLoading,
  } = useEpisodes();
const {
  wins,
  losses,
  predicted,
  remaining,
  loading: predictorLoading,
} = usePredictorSummary();
useEffect(() => {
  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDisplayName(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.log(
        'Could not load Home profile:',
        error
      );
      return;
    }

    setDisplayName(data?.display_name ?? null);
  }

  loadProfile();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    loadProfile();
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BRAND HEADER */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/wookiees-wolves-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.tagline}>
          STAR WARS • WOLVES BASKETBALL • TWO BEST FRIENDS
        </Text>
        {displayName && (
  <Text style={styles.greeting}>
    Welcome back, {displayName}.
  </Text>
)}

        {/* LATEST EPISODE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Episode</Text>

          <Pressable
            style={styles.sectionButton}
            onPress={() => router.push('/episodes')}
          >
            <Text style={styles.sectionLink}>SEE ALL</Text>
          </Pressable>
        </View>

        <View style={styles.featureCard}>
  <View style={styles.featureAccent} />

  <View style={styles.featureContent}>
    <Text style={styles.kicker}>
      NEW EPISODE
    </Text>

    {episodesLoading ? (
      <Text style={styles.episodeDescription}>
        Loading latest episode...
      </Text>
    ) : latestEpisode ? (
      <>
        <Text style={styles.episodeMeta}>
          {latestEpisode.date}

        </Text>

        <Text style={styles.episodeTitle}>
          {latestEpisode.title}
        </Text>

        <View style={styles.episodeActions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (latestEpisode.youtube) {
                Linking.openURL(latestEpisode.youtube);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>
              WATCH
            </Text>
          </Pressable>

          <Pressable
            style={styles.listenButton}
            onPress={() => {
              if (latestEpisode.spotify) {
                Linking.openURL(latestEpisode.spotify);
              }
            }}
          >
            <Text style={styles.listenButtonText}>
              LISTEN
            </Text>
          </Pressable>
        </View>
      </>
    ) : (
      <Text style={styles.episodeDescription}>
        Latest episode unavailable.
      </Text>
    )}
  </View>
</View>

        {/* PREDICTOR */}
        <View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>
    Wolves Predictor
  </Text>
</View>

       <View style={styles.predictorCard}>
  <View style={styles.predictorTop}>
    <View style={styles.predictorInfo}>
      <Text style={styles.kicker}>YOUR SEASON</Text>

      <Text style={styles.record}>
        {predictorLoading ? '—' : `${wins}–${losses}`}
      </Text>

      <Text style={styles.muted}>
        {predictorLoading
          ? 'Loading your predictions...'
          : predicted === 82
            ? 'All 82 games predicted'
            : `${predicted} of 82 predicted • ${remaining} left`}
      </Text>
    </View>

    <Image
      source={require('../../../assets/wookiees-and-wolves-small-wolves-image.png')}
      style={styles.predictorLogo}
      resizeMode="contain"
    />
  </View>

  <View style={styles.predictorActions}>
    <Pressable
      style={styles.predictorActionPrimary}
      onPress={() => router.push('/predictor')}
    >
      <Text style={styles.predictorActionPrimaryText}>
        OPEN PREDICTOR
      </Text>
    </Pressable>

    <Pressable
      style={styles.predictorActionSecondary}
      onPress={() => router.push('/leaderboard')}
    >
      <Text style={styles.predictorActionSecondaryText}>
        LEADERBOARD
      </Text>
    </Pressable>
  </View>
</View>

         
        

        {/* THE DEN */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>The Den</Text>

          <Pressable
            style={styles.sectionButton}
            onPress={() => router.push('/den')}
          >
            <Text style={styles.sectionLink}>ENTER</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionDescription}>
          Two fandoms. One community.
        </Text>

        <View style={styles.denRow}>
          <Pressable
            style={styles.denCard}
            onPress={() =>
  router.push({
    pathname: '/den',
    params: { filter: 'pack' },
  })
}
          >
            <Image
  source={require('../../../assets/wookiees-and-wolves-small-wolves-image.png')}
  style={styles.denLogo}
  resizeMode="contain"
/>

<Text style={styles.denTitle}>The Pack</Text>
            <Text style={styles.denDescription}>
              Wolves & NBA
            </Text>
          </Pressable>

          <Pressable
            style={styles.denCard}
            onPress={() =>
  router.push({
    pathname: '/den',
    params: { filter: 'cantina' },
  })
}
          >
            <Image
  source={require('../../../assets/wookiees-and-wolves-small_sw_image.png')}
  style={styles.denLogo}
  resizeMode="contain"
/>

<Text style={styles.denTitle}>The Cantina</Text>
            <Text style={styles.denDescription}>
              Star Wars
            </Text>
          </Pressable>
        </View>

       
        <View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>W&W Tools</Text>
</View>

<Pressable
  style={styles.toolCard}
  onPress={() => {
    router.push('/aurebesh');
  }}
>
  <View style={styles.toolContent}>
    <Image
      source={require('../../../assets/wookiees-and-wolves-small_sw_image.png')}
      style={styles.toolLogo}
      resizeMode="contain"
    />

    <View style={styles.toolText}>
      <Text style={styles.kicker}>
        TRANSLATOR
      </Text>

      <Text style={styles.toolTitle}>
        Aurebesh Translator
      </Text>

      <Text style={styles.toolDescription}>
        Translate English into a galaxy far, far away.
      </Text>
    </View>
  </View>

  <Text style={styles.toolArrow}>›</Text>
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
toolCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 18,
  padding: 18,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},
toolContent: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
},

toolLogo: {
  width: 54,
  height: 54,
  marginRight: 14,
},

toolText: {
  flex: 1,
},
toolTitle: {
  color: '#F3EFE3',
  fontSize: 18,
  fontWeight: '900',
},

toolDescription: {
  color: '#8FA2B3',
  fontSize: 13,
  marginTop: 4,
},

toolArrow: {
  color: '#75C7F0',
  fontSize: 30,
  fontWeight: '300',
},
  content: {
    paddingHorizontal: 18,
    paddingBottom: 130,
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: 8,
  },

  logo: {
    width: '92%',
    height: 150,
  },

  tagline: {
    color: '#9DAFBD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 30,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#F3EFE3',
    fontSize: 21,
    fontWeight: '900',
  },
episodeMeta: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.2,
  marginBottom: 7,
},

episodeActions: {
  flexDirection: 'row',
  gap: 10,
  marginTop: 18,
},

listenButton: {
  alignSelf: 'flex-start',
  backgroundColor: '#172A3C',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 10,
  paddingHorizontal: 16,
  paddingVertical: 11,
},

listenButtonText: {
  color: '#DCE8EF',
  fontSize: 11,
  fontWeight: '900',
  letterSpacing: 1,
},
  sectionButton: {
    backgroundColor: '#162A3C',
    borderWidth: 1,
    borderColor: '#2C4A61',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  sectionLink: {
    color: '#75C7F0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  sectionDescription: {
    color: '#8FA2B3',
    fontSize: 14,
    marginTop: -4,
    marginBottom: 12,
  },

  featureCard: {
    backgroundColor: '#101D2B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#20354A',
    overflow: 'hidden',
    marginBottom: 28,
    flexDirection: 'row',
  },

  featureAccent: {
    width: 5,
    backgroundColor: '#75C7F0',
  },

  featureContent: {
    padding: 20,
    flex: 1,
  },

  kicker: {
    color: '#75C7F0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 7,
  },

  episodeTitle: {
    color: '#F3EFE3',
    fontSize: 25,
    fontWeight: '900',
  },

  episodeDescription: {
    color: '#A5B3BF',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },

  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#75C7F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  primaryButtonText: {
    color: '#07111F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

 predictorCard: {
  backgroundColor: '#101D2B',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#20354A',
  padding: 20,
  marginBottom: 28,
},
predictorTop: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

predictorInfo: {
  flex: 1,
  paddingRight: 12,
},

predictorActions: {
  flexDirection: 'row',
  gap: 9,
  marginTop: 18,
},

predictorActionPrimary: {
  flex: 1,
  backgroundColor: '#75C7F0',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
},

predictorActionPrimaryText: {
  color: '#07111F',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.8,
},

predictorActionSecondary: {
  flex: 1,
  backgroundColor: '#172A3C',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
},

predictorActionSecondaryText: {
  color: '#DCE8EF',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.8,
},
  record: {
    color: '#F3EFE3',
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 52,
  },

  muted: {
    color: '#8FA2B3',
    fontSize: 13,
  },


  denRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },

  denCard: {
    flex: 1,
    backgroundColor: '#101D2B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#20354A',
    padding: 18,
    minHeight: 135,
    justifyContent: 'flex-end',
  },

denLogo: {
  width: 52,
  height: 52,
  marginBottom: 14,
},

  denTitle: {
    color: '#F3EFE3',
    fontSize: 18,
    fontWeight: '900',
  },

  denDescription: {
    color: '#8FA2B3',
    fontSize: 13,
    marginTop: 3,
  },

  postCard: {
    backgroundColor: '#101D2B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#20354A',
    padding: 18,
    marginBottom: 12,
  },

  postCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#16425B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },

  starWarsCategory: {
    backgroundColor: '#355044',
  },

  postCategoryText: {
    color: '#F3EFE3',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  postTitle: {
    color: '#F3EFE3',
    fontSize: 17,
    fontWeight: '800',
  },

  postText: {
    color: '#8FA2B3',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  greeting: {
  color: '#75C7F0',
  fontSize: 13,
  fontWeight: '800',
  textAlign: 'center',
  marginTop: -18,
  marginBottom: 28,
},
predictorLogo: {
  width: 64,
  height: 64,
},
});