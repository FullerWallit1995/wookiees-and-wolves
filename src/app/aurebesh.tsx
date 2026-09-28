import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AurebeshScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Aurebesh: require('../../assets/fonts/Aurebesh.otf'),
  });

  const [input, setInput] = useState('');

  const translatedText = input.toUpperCase();

  async function shareTranslation() {
    if (!input.trim()) {
      return;
    }

    await Share.share({
      message: `${input}\n\n${translatedText}`,
    });
  }

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Loading translator...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* BACK */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            ‹ BACK
          </Text>
        </Pressable>

        {/* HEADER */}
        <Text style={styles.eyebrow}>W&W TOOLS</Text>

        <Text style={styles.title}>
          Aurebesh Translator
        </Text>

        <Text style={styles.subtitle}>
          Translate English text into Aurebesh using strict
          character-for-character transliteration.
        </Text>

        {/* INPUT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              ENGLISH
            </Text>

            {input.length > 0 && (
              <Pressable onPress={() => setInput('')}>
                <Text style={styles.clearText}>
                  CLEAR
                </Text>
              </Pressable>
            )}
          </View>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Enter something..."
            placeholderTextColor="#53697B"
            multiline
            autoCapitalize="characters"
            maxLength={250}
          />

          <Text style={styles.characterCount}>
            {input.length}/250
          </Text>
        </View>

        {/* ARROW */}
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>↓</Text>
        </View>

        {/* TRANSLATION */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            AUREBESH
          </Text>

          <View style={styles.translationBox}>
            {input.trim() ? (
              <Text style={styles.aurebeshText}>
                {translatedText}
              </Text>
            ) : (
              <Text style={styles.translationPlaceholder}>
                Your translation will appear here.
              </Text>
            )}
          </View>
        </View>

        {/* ACTIONS */}
        {input.trim().length > 0 && (
          <View style={styles.actions}>
            <Pressable
              style={styles.shareButton}
              onPress={shareTranslation}
            >
              <Text style={styles.shareButtonText}>
                SHARE
              </Text>
            </Pressable>
          </View>
        )}

        {/* INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            How it works
          </Text>

          <Text style={styles.infoText}>
            Each English letter is converted directly to its
            corresponding Aurebesh glyph. Letter combinations
            such as TH, SH, CH and NG remain separate characters.
          </Text>
        </View>

        {/* EXAMPLE */}
        <View style={styles.exampleCard}>
          <Text style={styles.exampleLabel}>
            EXAMPLE
          </Text>

          <Text style={styles.exampleEnglish}>
            MAY THE FORCE BE WITH YOU
          </Text>

          <Text style={styles.exampleAurebesh}>
            MAY THE FORCE BE WITH YOU
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
    paddingBottom: 80,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#8FA2B3',
    fontSize: 14,
    fontWeight: '700',
  },

 backButton: {
  alignSelf: 'flex-start',
  marginTop: 10,
  marginBottom: 20,
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
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    marginBottom: 28,
  },

  section: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 18,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionLabel: {
    color: '#75C7F0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 12,
  },

  clearText: {
    color: '#7F94A7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  input: {
    minHeight: 110,
    color: '#F3EFE3',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    textAlignVertical: 'top',
  },

  characterCount: {
    color: '#53697B',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 8,
  },

  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  arrow: {
    color: '#75C7F0',
    fontSize: 24,
    fontWeight: '700',
  },

  translationBox: {
    minHeight: 120,
    justifyContent: 'center',
  },

  aurebeshText: {
    color: '#F3EFE3',
    fontFamily: 'Aurebesh',
    fontSize: 28,
    lineHeight: 40,
  },

  translationPlaceholder: {
    color: '#53697B',
    fontSize: 15,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },

  shareButton: {
    backgroundColor: '#75C7F0',
    borderRadius: 9,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },

  shareButtonText: {
    color: '#07111F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  infoCard: {
    backgroundColor: '#0D1925',
    borderWidth: 1,
    borderColor: '#1C3042',
    borderRadius: 16,
    padding: 17,
    marginTop: 22,
  },

  infoTitle: {
    color: '#F3EFE3',
    fontSize: 15,
    fontWeight: '900',
  },

  infoText: {
    color: '#7F94A7',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  exampleCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#20354A',
    backgroundColor: '#101D2B',
  },

  exampleLabel: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  exampleEnglish: {
    color: '#8FA2B3',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
  },

  exampleAurebesh: {
    color: '#F3EFE3',
    fontFamily: 'Aurebesh',
    fontSize: 22,
    lineHeight: 32,
    marginTop: 10,
  },
});