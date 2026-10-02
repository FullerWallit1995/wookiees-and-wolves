import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountPrivacyScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [confirmationText, setConfirmationText] =
    useState('');

  const [deleting, setDeleting] =
    useState(false);

  const canDelete =
    confirmationText.trim().toUpperCase() ===
    'DELETE';

  async function deleteAccount() {
    if (!canDelete || deleting) {
      return;
    }

    Alert.alert(
      'Permanently delete account?',
      'This will permanently delete your W&W account, profile, Predictor data, likes, votes and avatar. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: performDeletion,
        },
      ]
    );
  }

  async function performDeletion() {
    try {
      setDeleting(true);

      const { data, error } =
        await supabase.functions.invoke(
          'delete-account',
          {
            body: {},
          }
        );

      if (
        error ||
        data?.success !== true
      ) {
        console.log(
          'Could not delete account:',
          error ?? data
        );

        Alert.alert(
          'Account not deleted',
          'Something went wrong deleting your account. Please try again.'
        );

        return;
      }

      await supabase.auth.signOut();

      Alert.alert(
        'Account deleted',
        'Your Wookiees & Wolves account has been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace('/'),
          },
        ]
      );
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteConfirmation() {
    setShowDeleteConfirm(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 150);
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
            W&W ACCOUNT
          </Text>

          <Text style={styles.title}>
            Account & Privacy
          </Text>

          <Text style={styles.subtitle}>
            Manage your account, privacy and
            community settings.
          </Text>

          {/* PRIVACY & SUPPORT */}

          <Text style={styles.sectionLabel}>
            PRIVACY & SUPPORT
          </Text>

          <View style={styles.settingsCard}>
            <SettingsRow
              title="Privacy Policy"
              subtitle="How W&W handles your information"
              onPress={() =>
                Linking.openURL(
                  'https://www.wookieesandwolves.com/privacy/'
                )
              }
            />

            <View style={styles.rowDivider} />

            <SettingsRow
              title="Community Guidelines"
              subtitle="Standards for participating in The Den"
              onPress={() =>
                Linking.openURL(
                  'https://www.wookieesandwolves.com/community-guidelines/'
                )
              }
            />

            <View style={styles.rowDivider} />

            <SettingsRow
              title="Contact W&W"
              subtitle="Questions, support or community concerns"
              onPress={() =>
                Linking.openURL(
                  'mailto:wookieesandwolves@gmail.com?subject=W%26W%20Support'
                )
              }
            />
          </View>

          {/* ACCOUNT */}

          <Text style={styles.sectionLabel}>
            ACCOUNT
          </Text>

          {!showDeleteConfirm ? (
            <View style={styles.settingsCard}>
              <Pressable
                style={styles.deleteRow}
                onPress={openDeleteConfirmation}
              >
                <View style={styles.rowText}>
                  <Text style={styles.deleteRowTitle}>
                    Delete Account
                  </Text>

                  <Text style={styles.rowSubtitle}>
                    Permanently delete your W&W account
                    and associated data
                  </Text>
                </View>

                <Text style={styles.deleteArrow}>
                  ›
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.deleteCard}>
              <Text style={styles.dangerEyebrow}>
                DELETE ACCOUNT
              </Text>

              <Text style={styles.deleteTitle}>
                This cannot be undone.
              </Text>

              <Text style={styles.deleteDescription}>
                Permanently deleting your account will
                remove your W&W profile, avatar,
                Predictor data, likes and poll votes.
              </Text>

              <Text style={styles.confirmInstruction}>
                Type DELETE to continue.
              </Text>

              <TextInput
                style={styles.confirmInput}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="Type DELETE"
                placeholderTextColor="#6F5559"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!deleting}
              />

              <Pressable
                style={[
                  styles.finalDeleteButton,
                  (!canDelete || deleting) &&
                    styles.disabledButton,
                ]}
                disabled={
                  !canDelete || deleting
                }
                onPress={deleteAccount}
              >
                <Text
                  style={
                    styles.finalDeleteButtonText
                  }
                >
                  {deleting
                    ? 'DELETING...'
                    : 'PERMANENTLY DELETE ACCOUNT'}
                </Text>
              </Pressable>

              {!deleting && (
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setConfirmationText('');
                  }}
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    CANCEL
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <Text style={styles.footerText}>
            Need help with your account? Contact
            wookieesandwolves@gmail.com
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SettingsRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        pressed && styles.settingsRowPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>

        <Text style={styles.rowSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Text style={styles.rowArrow}>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

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
    marginBottom: 30,
  },

  sectionLabel: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 6,
  },

  settingsCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 26,
  },

  settingsRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  settingsRowPressed: {
    backgroundColor: '#142535',
  },

  rowText: {
    flex: 1,
    paddingRight: 12,
  },

  rowTitle: {
    color: '#F3EFE3',
    fontSize: 15,
    fontWeight: '800',
  },

  rowSubtitle: {
    color: '#7F94A7',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  rowArrow: {
    color: '#75C7F0',
    fontSize: 27,
    fontWeight: '300',
  },

  rowDivider: {
    height: 1,
    backgroundColor: '#20354A',
    marginLeft: 16,
  },

  deleteRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  deleteRowTitle: {
    color: '#D98B91',
    fontSize: 15,
    fontWeight: '800',
  },

  deleteArrow: {
    color: '#C98389',
    fontSize: 27,
    fontWeight: '300',
  },

  deleteCard: {
    backgroundColor: '#15171F',
    borderWidth: 1,
    borderColor: '#55383D',
    borderRadius: 16,
    padding: 18,
    marginBottom: 26,
  },

  dangerEyebrow: {
    color: '#C98389',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  deleteTitle: {
    color: '#F3EFE3',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },

  deleteDescription: {
    color: '#A98A8E',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  confirmInstruction: {
    color: '#D98B91',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 18,
  },

  confirmInput: {
    backgroundColor: '#0D1016',
    borderWidth: 1,
    borderColor: '#55383D',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#F3EFE3',
    fontSize: 14,
    marginTop: 9,
  },

  finalDeleteButton: {
    backgroundColor: '#7A434A',
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },

  finalDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  disabledButton: {
    opacity: 0.35,
  },

  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 3,
  },

  cancelButtonText: {
    color: '#8FA2B3',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footerText: {
    color: '#53697B',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 2,
  },
});