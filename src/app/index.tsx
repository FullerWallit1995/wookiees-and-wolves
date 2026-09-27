import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BRAND HEADER */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/wookiees-wolves-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.tagline}>
          STAR WARS • WOLVES BASKETBALL • TWO BEST FRIENDS
        </Text>

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
            <Text style={styles.kicker}>NEW EPISODE</Text>

            <Text style={styles.episodeTitle}>
              This is the Pilot
            </Text>

            <Text style={styles.episodeDescription}>
              Introductions, Wolves PF Debacle, Starfighter & MORE
            </Text>

            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                WATCH / LISTEN
              </Text>
            </Pressable>
          </View>
        </View>

        {/* PREDICTOR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wolves Predictor</Text>

          <Pressable
            style={styles.sectionButton}
            onPress={() => router.push('/predictor')}
          >
            <Text style={styles.sectionLink}>OPEN</Text>
          </Pressable>
        </View>

        <View style={styles.predictorCard}>
          <View>
            <Text style={styles.kicker}>YOUR SEASON</Text>
            <Text style={styles.record}>0–0</Text>
            <Text style={styles.muted}>82 games left to predict</Text>
          </View>

          <View style={styles.predictorBadge}>
            <Text style={styles.wolfIcon}>🐺</Text>
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
            onPress={() => router.push('/den')}
          >
            <Text style={styles.denIcon}>🐺</Text>
            <Text style={styles.denTitle}>The Pack</Text>
            <Text style={styles.denDescription}>
              Wolves & NBA
            </Text>
          </Pressable>

          <Pressable
            style={styles.denCard}
            onPress={() => router.push('/den')}
          >
            <Text style={styles.denIcon}>✦</Text>
            <Text style={styles.denTitle}>The Cantina</Text>
            <Text style={styles.denDescription}>
              Star Wars
            </Text>
          </Pressable>
        </View>

        {/* FROM W&W */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>From W&W</Text>
        </View>

        <View style={styles.postCard}>
          <View style={styles.postCategory}>
            <Text style={styles.postCategoryText}>WOLVES</Text>
          </View>

          <Text style={styles.postTitle}>
            What's your Wolves prediction this season?
          </Text>

          <Text style={styles.postText}>
            Head to the Predictor and build your record game by game.
          </Text>
        </View>

        <View style={styles.postCard}>
          <View style={[styles.postCategory, styles.starWarsCategory]}>
            <Text style={styles.postCategoryText}>STAR WARS</Text>
          </View>

          <Text style={styles.postTitle}>
            What's your Top 5 Star Wars?
          </Text>

          <Text style={styles.postText}>
            The debate belongs in The Cantina.
          </Text>
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
    marginTop: 18,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  predictorBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#172A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  wolfIcon: {
    fontSize: 30,
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

  denIcon: {
    fontSize: 25,
    marginBottom: 16,
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
});