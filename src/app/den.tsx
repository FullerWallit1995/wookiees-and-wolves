import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DenScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>W&W COMMUNITY</Text>
        <Text style={styles.title}>The Den</Text>
        <Text style={styles.subtitle}>
          Wolves. Star Wars. Two fandoms, one community.
        </Text>

        <View style={styles.sectionRow}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionEmoji}>🐺</Text>
            <Text style={styles.sectionTitle}>The Pack</Text>
            <Text style={styles.body}>Wolves & NBA</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEmoji}>✦</Text>
            <Text style={styles.sectionTitle}>The Cantina</Text>
            <Text style={styles.body}>Star Wars</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>COMING SOON</Text>
          <Text style={styles.cardTitle}>Join the conversation.</Text>
          <Text style={styles.body}>
            Polls, questions, reactions and discussions from the W&W community.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 120 },
  eyebrow: {
    color: '#79C8FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 6,
  },
  subtitle: {
    color: '#8EA5BD',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 28,
  },
  sectionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  sectionCard: {
    flex: 1,
    backgroundColor: '#111E2D',
    borderWidth: 1,
    borderColor: '#22364B',
    borderRadius: 18,
    padding: 18,
  },
  sectionEmoji: { fontSize: 24, marginBottom: 12 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  card: {
    backgroundColor: '#111E2D',
    borderWidth: 1,
    borderColor: '#22364B',
    borderRadius: 18,
    padding: 20,
  },
  label: {
    color: '#79C8FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  body: { color: '#AAB9C8', fontSize: 14, lineHeight: 21 },
});