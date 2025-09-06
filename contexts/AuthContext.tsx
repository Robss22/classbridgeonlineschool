'use client';
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase, checkDatabaseHealth } from '../lib/supabaseClient';
import { getUserFriendlyErrorMessage, logTechnicalError, getAuthErrorMessage } from '../utils/errorHandler';

// Define types for the auth context
interface UserMetadata {
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
}

interface User {
  id: string;
  email?: string;  // Made optional to match Supabase User type
  auth_user_id?: string | null | undefined;
  created_at?: string | null | undefined;
  updated_at?: string | null | undefined;
  first_name?: string | null | undefined;
  last_name?: string | null | undefined;
  full_name?: string | null | undefined;
  role?: string | null | undefined;
  password_changed?: boolean | null | undefined;
  status?: string | null | undefined;
  academic_year?: string | null | undefined;
  curriculum?: string | null | undefined;
  registration_number?: string | null | undefined;
  class?: string | null | undefined;
  program_id?: string | null | undefined;
  level_id?: string | null | undefined;
  user_metadata?: UserMetadata | undefined;
  [key: string]: unknown | undefined; // Allow additional properties
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  // Simplified initialization
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async (): Promise<void> => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setAuthError('Authentication service unavailable');
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          await fetchUserProfile(session.user);
        } else if (mounted) {
          setUser(null);
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          
          if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserProfile(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setAuthError('');
          }
        });

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Simplified fetchUserProfile
  const fetchUserProfile = useCallback(async (authUser: { id: string; email?: string | undefined; user_metadata?: Record<string, any> }) => {
    if (!authUser?.id) {
      console.error('Invalid auth user object:', authUser);
      return;
    }
    
    try {
      // Try to fetch user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      if (error) {
        // Create basic user profile if not found
        const metadata = authUser.user_metadata as UserMetadata || {};
        const basicProfile: User = {
          id: authUser.id,
          auth_user_id: authUser.id,
          email: authUser.email || '',
          first_name: metadata.first_name || '',
          last_name: metadata.last_name || '',
          full_name: metadata.full_name || authUser.email || 'User',
          role: metadata.role || 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          password_changed: false
        };
        
        setUser(basicProfile);
        return;
      }
      
      // Use fetched profile
      const profileData = profile as Record<string, unknown>;
      const userProfile: User = {
        id: String(profileData.id || authUser.id),
        email: String(profileData.email || authUser.email || ''),
        role: String(profileData.role || 'student'),
        first_name: String(profileData.first_name || ''),
        last_name: String(profileData.last_name || ''),
        full_name: String(profileData.full_name || profileData.email || authUser.email || 'User')
      };
      
      setUser(userProfile);
      
    } catch (error: unknown) {
      console.error('Error fetching user profile:', error);
      
      // Set basic user info as fallback
      const metadata = authUser.user_metadata as UserMetadata || {};
      const basicUser: User = {
        id: authUser.id,
        email: String(authUser.email || ''),
        role: metadata.role || 'student',
        first_name: metadata.first_name || '',
        last_name: metadata.last_name || '',
        full_name: metadata.full_name || authUser.email || 'User'
      };
      setUser(basicUser);
    }
  }, []);

  // Simplified sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError('');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      
      if (data?.user) {
        await fetchUserProfile(data.user);
        return { success: true };
      } else {
        setAuthError('Sign in failed');
        return { success: false, error: 'Sign in failed' };
      }
      
    } catch (error: any) {
      setAuthError(error.message || 'Sign in failed');
      return { success: false, error: error.message || 'Sign in failed' };
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthError('');
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthError('Sign out failed');
    }
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }, [user]);

  // CRITICAL FIX: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    authError,
    signIn,
    signOut,
    changePassword
  }), [user, loading, authError, signIn, signOut, changePassword]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
