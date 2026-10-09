
import { checkProfileCompletion } from '@/lib/profile-completion';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';

type ProfileStatus =
  | 'checking'
  | 'guest'
  | 'complete'
  | 'incomplete'
  | 'error';

type OnboardingContextValue = {
  status: ProfileStatus;
  user: User | null;
  errorMessage: string;
  refreshProfile: () => Promise<void>;
};

const OnboardingContext =
  createContext<OnboardingContextValue | null>(null);

export function ProfileOnboardingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] =
    useState<ProfileStatus>('checking');

  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const requestId = useRef(0);
  const verifiedUserId = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const currentRequest = ++requestId.current;

    // Keep the existing navigation status while
    // checking the same user. If the account changes,
    // immediately restrict navigation.
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (currentRequest !== requestId.current) return;

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      const currentUser = session?.user ?? null;
      const currentUserId = currentUser?.id ?? null;

      if (currentUserId !== verifiedUserId.current) {
        verifiedUserId.current = null;
        setStatus('checking');
      }

      setUser(currentUser);
      setErrorMessage('');

      if (!currentUser) {
        verifiedUserId.current = null;
        setStatus('guest');
        return;
      }

      const result = await checkProfileCompletion(
        currentUser.id
      );

      if (currentRequest !== requestId.current) return;

      if (result.status === 'error') {
        setStatus('error');
        setErrorMessage(result.message);
        return;
      }

      verifiedUserId.current = currentUser.id;
      setStatus(result.status);
    } catch (error) {
      if (currentRequest !== requestId.current) return;

      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not check profile.'
      );
    }
  }, []);

  useEffect(() => {
    void refreshProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // A different user must not inherit the
        // previous user's verified profile status.
        const incomingUserId =
          session?.user?.id ?? null;

        if (
          incomingUserId !== verifiedUserId.current
        ) {
          requestId.current += 1;
          verifiedUserId.current = null;
          setStatus('checking');
          setUser(session?.user ?? null);
        }

        // Supabase requests must happen outside
        // the auth-state callback.
        setTimeout(() => {
          void refreshProfile();
        }, 0);
      }
    );

    return () => {
      requestId.current += 1;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  return (
    <OnboardingContext.Provider
      value={{
        status,
        user,
        errorMessage,
        refreshProfile,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useProfileOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error(
      'useProfileOnboarding must be used within ProfileOnboardingProvider'
    );
  }

  return context;
}
