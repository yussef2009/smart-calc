import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUser = (supabaseUser: any) => {
  if (!supabaseUser) return null;
  return {
    ...supabaseUser,
    uid: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
    photoURL: supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.email || 'U')}&background=random`
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check local storage for demo user
    const savedUser = localStorage.getItem('smart_calc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsDemo(true);
      setLoading(false);
      return;
    }

    // Initialize Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapSupabaseUser(session?.user) ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user) ?? null);
      setIsDemo(false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email inbox to verify your account before logging in.');
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: name,
          full_name: name
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) throw error;

    if (data.user && data.session === null) {
      throw new Error('Account created! Please check your email to verify your account.');
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      id: 'guest_' + Math.random().toString(36).substr(2, 9),
      displayName: 'Guest User',
      email: 'guest@smartcalc.local',
      photoURL: 'https://ui-avatars.com/api/?name=Guest+User&background=0D8ABC&color=fff'
    };
    localStorage.setItem('smart_calc_user', JSON.stringify(guestUser));
    setUser(guestUser);
    setIsDemo(true);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('smart_calc_user');
      setUser(null);
      setIsDemo(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        signInWithGoogle, 
        signInWithEmail, 
        signUpWithEmail, 
        loginAsGuest, 
        logout, 
        isDemo 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

