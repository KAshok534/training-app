import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  isDemo: boolean;  // true when running without real Supabase credentials
}

// ─── Mock user for demo mode ─────────────────────────────────────────────────

const DEMO_USER: User = {
  id: 'demo-user-001',
  name: 'Sushanth Gade',
  email: 'student@example.com',
  phone: '+91 98765 43210',
  role: 'trainee',
  organization: 'Demo Organization',
  designation: 'Environmental Consultant',
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = !isSupabaseConfigured;

  useEffect(() => {
    if (isDemo) {
      // Demo mode — no Supabase, no auth required
      setLoading(false);
      return;
    }

    // ── REAL AUTH: check existing session ─────────────────────────────────
    // TODO: Uncomment when Supabase is connected
    /*
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
    */

    setLoading(false);
  }, [isDemo]);

  // ── Load user profile from Supabase ───────────────────────────────────────
  // TODO: Call this after auth.getSession() or onAuthStateChange
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        organization: data.organization,
        designation: data.designation,
      });
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (isDemo) {
      // Demo mode: accept any credentials
      setUser(DEMO_USER);
      return null;
    }

    // ── REAL SIGN IN ─────────────────────────────────────────────────────────
    // TODO: Uncomment when Supabase is connected
    /*
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
    */

    // Temporary passthrough
    console.log('Sign in:', email, password);
    setUser(DEMO_USER);
    return null;
  }, [isDemo]);

  const signOut = useCallback(async () => {
    if (!isDemo) {
      // TODO: Uncomment when Supabase is connected
      // await supabase.auth.signOut();
    }
    setUser(null);
  }, [isDemo]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
