import { useRouter } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DisclaimerScreen() {
  const router = useRouter();

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
          W&W LEGAL
        </Text>

        <Text style={styles.title}>
          Fan Project Disclaimer
        </Text>

        <Text style={styles.subtitle}>
          Wookiees & Wolves is an independent
          fan-created project.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Independent Fan Project
          </Text>

          <Text style={styles.bodyText}>
            Wookiees & Wolves is an independent
            fan-created podcast, community,
            website, and app. It is not
            affiliated with, endorsed by,
            sponsored by, or officially
            connected with Lucasfilm Ltd., The
            Walt Disney Company, the National
            Basketball Association, the
            Minnesota Timberwolves, or any of
            their affiliates.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Star Wars
          </Text>

          <Text style={styles.bodyText}>
            STAR WARS and related names,
            characters, logos, and other
            intellectual property are trademarks
            and/or property of their respective
            owners.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Minnesota Timberwolves & NBA
          </Text>

          <Text style={styles.bodyText}>
            The Minnesota Timberwolves, NBA,
            and related names, logos, and other
            intellectual property are trademarks
            and/or property of their respective
            owners.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Wookiees & Wolves
          </Text>

          <Text style={styles.bodyText}>
            References to third-party properties
            are used for fan discussion,
            commentary, rankings, predictions,
            and community purposes. Wookiees &
            Wolves claims no ownership of
            third-party intellectual property.
          </Text>
        </View>

        <Text style={styles.footerText}>
          Questions about Wookiees & Wolves can
          be sent to wookieesandwolves@gmail.com.
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

  card: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 18,
  },

  sectionTitle: {
    color: '#F3EFE3',
    fontSize: 16,
    fontWeight: '900',
  },

  bodyText: {
    color: '#8FA2B3',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  divider: {
    height: 1,
    backgroundColor: '#20354A',
    marginVertical: 18,
  },

  footerText: {
    color: '#53697B',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
  },
});