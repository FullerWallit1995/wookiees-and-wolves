import { useEpisodes } from '@/hooks/useEpisodes';

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

export default function EpisodesScreen() {
  const {
    episodes,
    latestEpisode,
    loading,
    error,
  } = useEpisodes();

  const olderEpisodes = episodes.slice(1);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Loading episodes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !latestEpisode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Couldn't load episodes.
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
        <Text style={styles.eyebrow}>
          WOOKIEES & WOLVES
        </Text>

        <Text style={styles.title}>
          Episodes
        </Text>

        <Text style={styles.subtitle}>
          Watch, listen and catch up on the latest from W&W.
        </Text>

        {/* FEATURED EPISODE */}
        <Text style={styles.sectionLabel}>
          LATEST EPISODE
        </Text>

        <View style={styles.featuredCard}>
          <View style={styles.artworkContainer}>
            <Image
              source={require('../../../assets/wookiees-wolves-logo.png')}
              style={styles.artwork}
              resizeMode="contain"
            />

            <View style={styles.latestBadge}>
              <Text style={styles.latestBadgeText}>
                NEW
              </Text>
            </View>
          </View>

          <View style={styles.featuredContent}>
            <Text style={styles.episodeMeta}>
              {latestEpisode.date}
              {latestEpisode.duration
                ? ` • ${latestEpisode.duration}`
                : ''}
            </Text>

            <Text style={styles.featuredTitle}>
              {latestEpisode.title}
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  if (latestEpisode.youtube) {
                    Linking.openURL(
                      latestEpisode.youtube
                    );
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>
                  WATCH
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  if (latestEpisode.spotify) {
                    Linking.openURL(
                      latestEpisode.spotify
                    );
                  }
                }}
              >
                <Text style={styles.secondaryButtonText}>
                  LISTEN
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* MORE EPISODES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            All Episodes
          </Text>

          <Text style={styles.episodeCount}>
            {episodes.length} EPISODES
          </Text>
        </View>

        {olderEpisodes.map((episode) => (
          <View
            key={episode.id}
            style={styles.episodeCard}
          >
            <View style={styles.smallArtwork}>
              <Image
                source={require('../../../assets/wookiees-wolves-logo.png')}
                style={styles.smallArtworkImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.episodeInfo}>
              <Text style={styles.episodeMeta}>
                {episode.date}
                {episode.duration
                  ? ` • ${episode.duration}`
                  : ''}
              </Text>

              <Text style={styles.episodeTitle}>
                {episode.title}
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </View>
        ))}

        {/* FOLLOW */}
        <View style={styles.followCard}>
          <Text style={styles.followEyebrow}>
            DON'T MISS AN EPISODE
          </Text>

          <Text style={styles.followTitle}>
            Follow Wookiees & Wolves
          </Text>

          <Text style={styles.followText}>
            New episodes, Wolves takes, Star Wars discussions
            and more.
          </Text>

          <View style={styles.followButtons}>
            <Pressable
              style={styles.platformButton}
              onPress={() =>
                Linking.openURL(
                  'https://www.youtube.com/@WookieesAndWolves'
                )
              }
            >
              <Text style={styles.platformButtonText}>
                YOUTUBE
              </Text>
            </Pressable>

            <Pressable
              style={styles.platformButton}
              onPress={() =>
                Linking.openURL(
                  'https://open.spotify.com/show/033WNBaM4MFNX4gyvnPAsf?si=GpFz1TW8S9unJlWYjMy0Ag'
                )
              }
            >
              <Text style={styles.platformButtonText}>
                SPOTIFY
              </Text>
            </Pressable>

            <Pressable
              style={styles.platformButton}
              onPress={() =>
                Linking.openURL(
                  'https://podcasts.apple.com/us/podcast/wookiees-wolves/id6815386721'
                )
              }
            >
              <Text style={styles.platformButtonText}>
                APPLE
              </Text>
            </Pressable>
          </View>
        </View>
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
    marginBottom: 26,
  },

  sectionLabel: {
    color: '#75C7F0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 10,
  },

  featuredCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
  },

  artworkContainer: {
    height: 230,
    backgroundColor: '#07111F',
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  artwork: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },

  latestBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#75C7F0',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  latestBadgeText: {
    color: '#07111F',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  featuredContent: {
    padding: 20,
  },

  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  statusText: {
    color: '#8FA2B3',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  episodeMeta: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 6,
  },

  featuredTitle: {
    color: '#F3EFE3',
    fontSize: 24,
    fontWeight: '900',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  primaryButton: {
    backgroundColor: '#75C7F0',
    borderRadius: 9,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },

  primaryButtonText: {
    color: '#07111F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  secondaryButton: {
    backgroundColor: '#172A3C',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 9,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },

  secondaryButtonText: {
    color: '#DCE8EF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#F3EFE3',
    fontSize: 21,
    fontWeight: '900',
  },

  episodeCount: {
    color: '#708599',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  episodeCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallArtwork: {
    width: 72,
    height: 72,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#0A1521',
  },

  smallArtworkImage: {
    width: '100%',
    height: '100%',
  },

  episodeInfo: {
    flex: 1,
    paddingHorizontal: 13,
  },

  episodeTitle: {
    color: '#F3EFE3',
    fontSize: 15,
    fontWeight: '800',
  },

  arrow: {
    color: '#75C7F0',
    fontSize: 28,
    fontWeight: '300',
    paddingRight: 3,
  },

  followCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 20,
    marginTop: 20,
  },

  followEyebrow: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  followTitle: {
    color: '#F3EFE3',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },

  followText: {
    color: '#8FA2B3',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  followButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },

  platformButton: {
    flex: 1,
    backgroundColor: '#172A3C',
    borderWidth: 1,
    borderColor: '#31516B',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },

  platformButtonText: {
    color: '#DCE8EF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});