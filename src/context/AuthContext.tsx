import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
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

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = !isSupabaseConfigured;

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

    // Check existing session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    if (isDemo) {
      setUser(DEMO_USER);
      return null;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }, [isDemo]);

  const signOut = useCallback(async () => {
    if (!isDemo) {
      await supabase.auth.signOut();
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
