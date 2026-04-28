import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  recoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  clearRecovery: () => void;
  isDemo: boolean;
}

const DEMO_USER: User = {
  id: 'demo-user-001',
  name: 'Sushanth Gade',
  email: 'student@example.com',
  phone: '+91 98765 43210',
  role: 'trainee',
  organization: 'Demo Organization',
  designation: 'Environmental Consultant',
};

// Detect recovery URL synchronously at module load time (before any React render).
// Covers both URL formats Supabase uses:
//   Old implicit flow:  https://app.com/#access_token=...&type=recovery
//   New PKCE flow:      https://app.com/?token_hash=...&type=recovery
function detectRecoveryUrl(): boolean {
  try {
    const hash   = window.location.hash;
    const search = window.location.search;
    return hash.includes('type=recovery') || search.includes('type=recovery');
  } catch {
    return false;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]               = useState<User | null>(null);
  const [loading, setLoading]         = useState(true);
  // Initialise synchronously — if the URL contains recovery tokens we know
  // immediately on first render, before any async work completes.
  const [recoveryMode, setRecoveryMode] = useState(detectRecoveryUrl);
  const isDemo = !isSupabaseConfigured;

  // Keep a ref so the onAuthStateChange closure always sees the current value
  const recoveryRef = useRef(recoveryMode);
  recoveryRef.current = recoveryMode;

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUser({
        id:           data.id,
        name:         data.name,
        email:        data.email,
        phone:        data.phone,
        role:         data.role,
        organization: data.organization,
        designation:  data.designation,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }

    // If we already detected a recovery URL, don't try to establish a normal
    // session — just wait for Supabase to fire the PASSWORD_RECOVERY event.
    if (recoveryRef.current) {
      setLoading(false);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        // Double-check: don't log in if we're in recovery mode
        if (recoveryRef.current) { setLoading(false); return; }
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Supabase confirmed this is a recovery session
        setRecoveryMode(true);
        setLoading(false);
        return;
      }
      // While in recovery mode, ignore all other auth events so we don't
      // accidentally log the user in with the short-lived recovery session.
      if (recoveryRef.current) return;

      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemo, loadProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (isDemo) { setUser(DEMO_USER); return null; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }, [isDemo]);

  const signOut = useCallback(async () => {
    if (!isDemo) await supabase.auth.signOut();
    setUser(null);
  }, [isDemo]);

  const clearRecovery = useCallback(() => {
    setRecoveryMode(false);
    setUser(null);
    // Remove recovery tokens from URL so a page refresh doesn't re-trigger
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, recoveryMode, signIn, signOut, clearRecovery, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
