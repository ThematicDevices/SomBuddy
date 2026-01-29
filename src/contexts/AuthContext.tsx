import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper to check if an error is an AbortError (should be ignored)
const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && (
    error.name === 'AbortError' ||
    error.message.includes('AbortError') ||
    error.message.includes('signal is aborted')
  );
};

// Auth-specific errors that indicate corrupted session
const isCorruptedSessionError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('invalid token') ||
      message.includes('jwt expired') ||
      message.includes('invalid jwt') ||
      message.includes('session not found') ||
      message.includes('invalid refresh token') ||
      message.includes('refresh token not found')
    );
  }
  return false;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs for debouncing and cleanup
  const mountedRef = useRef(true);
  const profileFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Skip if we already fetched for this user recently
    if (lastFetchedUserIdRef.current === userId) {
      return profile;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Don't log AbortError - it's expected during rapid state changes
        if (!isAbortError(error)) {
          console.error('Error fetching profile:', error);
        }
        return null;
      }

      lastFetchedUserIdRef.current = userId;
      return data as Profile;
    } catch (error) {
      // Don't log AbortError
      if (!isAbortError(error)) {
        console.error('Error fetching profile:', error);
      }
      return null;
    }
  }, [profile]);

  const clearCorruptedSession = useCallback(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Cleared corrupted session data from localStorage');
    } catch (clearError) {
      console.warn('Failed to clear localStorage:', clearError);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    lastFetchedUserIdRef.current = null;
  }, []);

  // Debounced profile fetch to prevent rapid-fire fetches
  const debouncedFetchProfile = useCallback((userId: string) => {
    // Clear any pending fetch
    if (profileFetchTimeoutRef.current) {
      clearTimeout(profileFetchTimeoutRef.current);
    }

    // Delay the fetch to allow auth state to stabilize
    profileFetchTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      const fetchedProfile = await fetchProfile(userId);
      if (mountedRef.current && fetchedProfile) {
        setProfile(fetchedProfile);
      }
    }, 100);
  }, [fetchProfile]);

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          // Don't log AbortError
          if (!isAbortError(error)) {
            console.error('Session error:', error);
          }
          if (isCorruptedSessionError(error)) {
            clearCorruptedSession();
          }
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          debouncedFetchProfile(session.user.id);
        }
      } catch (error) {
        // Ignore AbortError completely
        if (isAbortError(error)) return;

        console.error('Session initialization error:', error);

        if (mountedRef.current) {
          if (isCorruptedSessionError(error) || (error instanceof Error && error.message.includes('timed out'))) {
            clearCorruptedSession();
          }
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mountedRef.current) return;

        console.log('Auth state change:', event);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use debounced fetch to prevent rapid profile fetches
          debouncedFetchProfile(session.user.id);
        } else {
          setProfile(null);
          lastFetchedUserIdRef.current = null;
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          lastFetchedUserIdRef.current = null;
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    );

    return () => {
      mountedRef.current = false;
      if (profileFetchTimeoutRef.current) {
        clearTimeout(profileFetchTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [debouncedFetchProfile, clearCorruptedSession]);

  // Refresh session when app becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session) {
        supabase.auth.getSession().catch((error: unknown) => {
          if (!isAbortError(error)) {
            console.error('Visibility refresh error:', error);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    lastFetchedUserIdRef.current = null;
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const previousProfile = profile;
    setProfile(prev => prev ? { ...prev, ...updates } : null);

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      setProfile(previousProfile);
      return { error: new Error(error.message) };
    }

    return { error: null };
  }, [user, profile]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
