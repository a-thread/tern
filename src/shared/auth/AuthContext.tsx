import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@shared/backend/supabase';

type AuthResult = { error?: string; needsConfirmation?: boolean };

type AuthContextValue = {
  /** True while the stored session is being restored on launch. */
  loading: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Only mounted when Supabase is configured — see AuthGate. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase!.auth.signUp({ email, password });
    // With email confirmation on, sign-up succeeds without a session.
    return { error: error?.message, needsConfirmation: !error && !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase!.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ loading, session, signIn, signUp, signOut }),
    [loading, session, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Null when running on local mock data (no account). */
export function useAuth() {
  return useContext(AuthContext);
}
