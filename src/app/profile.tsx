import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR W&W</Text>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>W&W</Text>
        </View>

        <Text style={styles.name}>Guest Fan</Text>
        <Text style={styles.handle}>Your profile is coming soon.</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0–0</Text>
            <Text style={styles.statLabel}>PREDICTOR</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stat}>
            <Text style={styles.statNumber}>—</Text>
            <Text style={styles.statLabel}>ACCURACY</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Eventually, this becomes yours.</Text>
          <Text style={styles.body}>
            Your picks, stats, community activity and W&W profile will all live here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 120, alignItems: 'center' },
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
    marginBottom: 28,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#16283A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#79C8FF',
  },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 14,
  },
  handle: { color: '#8EA5BD', marginTop: 4 },
  stats: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#111E2D',
    borderRadius: 18,
    marginTop: 28,
    marginBottom: 16,
    paddingVertical: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNumber: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  statLabel: {
    color: '#8EA5BD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  divider: { width: 1, backgroundColor: '#22364B' },
  card: {
    width: '100%',
    backgroundColor: '#111E2D',
    borderWidth: 1,
    borderColor: '#22364B',
    borderRadius: 18,
    padding: 20,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: { color: '#AAB9C8', fontSize: 15, lineHeight: 22 },
});