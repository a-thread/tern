import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@shared/backend/supabase';
import { parseAuthLink } from './authUrl';

type AuthContextValue = {
  /** True while the stored session is being restored on launch. */
  loading: boolean;
  session: Session | null;
  /** Trying the app without an account: mock data, kept in memory only. */
  isGuest: boolean;
  /** Set when a password-reset link was opened; the app then asks for a new password. */
  passwordRecoveryPending: boolean;
  /** Where the sign-in flow should open (after "Create account" from preview). */
  startOnSignUp: boolean;
  continueAsGuest: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  /** Ends the session — or, for a guest, just leaves the preview. */
  signOut: (options?: { toSignUp?: boolean }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Only mounted when Supabase is configured — see AuthGate. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [passwordRecoveryPending, setRecovery] = useState(false);
  const [startOnSignUp, setStartOnSignUp] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Email confirmation and password-reset links open the app with the
  // session tokens in the URL; use them to sign the person in.
  useEffect(() => {
    if (!supabase) return;
    const handle = async (url: string | null) => {
      const link = url ? parseAuthLink(url) : null;
      if (!link) return;
      const { error } = await supabase!.auth.setSession({
        access_token: link.accessToken,
        refresh_token: link.refreshToken,
      });
      if (!error && link.type === 'recovery') setRecovery(true);
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);

  const redirectTo = Linking.createURL('/');

  const continueAsGuest = useCallback(() => setIsGuest(true), []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase!.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
    },
    [redirectTo],
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
    },
    [redirectTo],
  );

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase!.auth.updateUser({ password });
    if (error) throw error;
    setRecovery(false);
  }, []);

  const signOut = useCallback(
    async (options?: { toSignUp?: boolean }) => {
      setStartOnSignUp(Boolean(options?.toSignUp));
      if (isGuest) {
        setIsGuest(false);
        return;
      }
      await supabase!.auth.signOut();
    },
    [isGuest],
  );

  const value = useMemo(
    () => ({
      loading,
      session,
      isGuest,
      passwordRecoveryPending,
      startOnSignUp,
      continueAsGuest,
      signIn,
      signUp,
      sendPasswordReset,
      updatePassword,
      signOut,
    }),
    [
      loading,
      session,
      isGuest,
      passwordRecoveryPending,
      startOnSignUp,
      continueAsGuest,
      signIn,
      signUp,
      sendPasswordReset,
      updatePassword,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Null when running on local mock data with no Supabase keys (no account). */
export function useAuth() {
  return useContext(AuthContext);
}
