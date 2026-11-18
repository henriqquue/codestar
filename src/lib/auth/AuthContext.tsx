'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/src/lib/supabase/client';
import { UserProfile, UserRole } from '@/src/lib/auth/redirect';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.warn('Erro ao carregar perfil:', error.message);
          return null;
        }

        if (data) {
          return {
            id: data.id,
            name: data.name,
            avatar_url: data.avatar_url,
            role: data.role as UserRole,
            created_at: data.created_at,
            updated_at: data.updated_at,
          } as UserProfile;
        }
        return null;
      } catch {
        return null;
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(user.id);
    setProfile(p);
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            const p = await fetchProfile(currentUser.id);
            if (mounted) setProfile(p);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        const p = await fetchProfile(authUser.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signOut,
      refreshProfile,
    }),
    [user, profile, loading, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return ctx;
}
