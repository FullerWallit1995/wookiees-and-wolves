import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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

if (error || data?.success !== true) {
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

      /*
       * The Auth user no longer exists remotely,
       * but clear any persisted local session too.
       */
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
          Manage your Wookiees & Wolves account
          and privacy options.
        </Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>
            PRIVACY
          </Text>

          <Text style={styles.sectionTitle}>
            Privacy Policy
          </Text>

          <Text style={styles.sectionText}>
            Learn what information Wookiees & Wolves
            collects and how it is used.
          </Text>

          <View style={styles.comingSoonButton}>
            <Text style={styles.comingSoonText}>
              PRIVACY POLICY COMING NEXT
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.sectionCard,
            styles.dangerCard,
          ]}
        >
          <Text style={styles.dangerEyebrow}>
            DANGER ZONE
          </Text>

          <Text style={styles.sectionTitle}>
            Delete Account
          </Text>

          <Text style={styles.sectionText}>
            Permanently delete your W&W account and
            associated account data, including your
            profile, Predictor picks, likes, poll votes
            and avatar.
          </Text>

          {!showDeleteConfirm ? (
            <Pressable
              style={styles.deleteButton}
              onPress={() => {
  setShowDeleteConfirm(true);

  setTimeout(() => {
    scrollRef.current?.scrollToEnd({
      animated: true,
    });
  }, 150);
}}
            >
              <Text style={styles.deleteButtonText}>
                DELETE MY ACCOUNT
              </Text>
            </Pressable>
          ) : (
            <View style={styles.confirmArea}>
              <Text style={styles.confirmTitle}>
                This cannot be undone.
              </Text>

              <Text style={styles.confirmText}>
                Type DELETE below to confirm that you
                want to permanently delete your account.
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
                disabled={!canDelete || deleting}
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
                  <Text style={styles.cancelButtonText}>
                    CANCEL
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
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
flex: {
  flex: 1,
},
  content: {
    paddingHorizontal: 18,
    paddingBottom: 50,
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
    marginBottom: 28,
  },

  sectionCard: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  sectionEyebrow: {
    color: '#75C7F0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  sectionTitle: {
    color: '#F3EFE3',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 5,
  },

  sectionText: {
    color: '#8FA2B3',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  comingSoonButton: {
    borderWidth: 1,
    borderColor: '#2A4053',
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    opacity: 0.6,
  },

  comingSoonText: {
    color: '#8FA2B3',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  dangerCard: {
    borderColor: '#55383D',
  },

  dangerEyebrow: {
    color: '#C98389',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: '#7A434A',
    backgroundColor: '#21181D',
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },

  deleteButtonText: {
    color: '#D98B91',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  confirmArea: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#55383D',
    paddingTop: 18,
  },

  confirmTitle: {
    color: '#D98B91',
    fontSize: 15,
    fontWeight: '900',
  },

  confirmText: {
    color: '#A98A8E',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  confirmInput: {
    backgroundColor: '#160F13',
    borderWidth: 1,
    borderColor: '#55383D',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#F3EFE3',
    fontSize: 14,
    marginTop: 14,
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
    marginTop: 4,
  },

  cancelButtonText: {
    color: '#8FA2B3',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});