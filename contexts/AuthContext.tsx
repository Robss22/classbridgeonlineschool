'use client';
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase, checkDatabaseHealth } from '../lib/supabaseClient';

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
  
  // CRITICAL FIX: Use refs to prevent infinite loops
  const isInitializing = useRef(false);
  const hasInitialized = useRef(false);
  const authListener = useRef<{ data: { subscription: { unsubscribe: () => void } } } | null>(null);

  // Debug logging for component lifecycle
  useEffect(() => {
    console.log('🔐 [AuthProvider] Component mounted');
    return () => {
      console.log('🔐 [AuthProvider] Component unmounting');
      // Clean up auth listener properly
      if (authListener.current?.data?.subscription) {
        authListener.current.data.subscription.unsubscribe();
      }
    };
  }, []);

  // CRITICAL FIX: Prevent multiple initializations
  const initializeAuth = useCallback(async () => {
    if (isInitializing.current || hasInitialized.current) {
      console.log('🔐 [AuthProvider] Already initializing or initialized, skipping...');
      return;
    }

    isInitializing.current = true;
    console.log('🔐 [AuthProvider] Starting auth initialization...');

    try {
      // Test database connection first
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        throw new Error('Database connection failed');
      }

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [AuthProvider] Session error:', sessionError);
        setAuthError(sessionError.message);
        return;
      }

      if (session?.user) {
        console.log('🔐 [AuthProvider] Found existing session for user:', session.user.id);
        await fetchUserProfile(session.user);
      } else {
        console.log('🔐 [AuthProvider] No existing session found');
        setUser(null);
      }

      // Set up auth state change listener with proper subscription handling
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 [AuthProvider] Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthError('');
        }
      });

      // Store the subscription for cleanup
      authListener.current = { data: { subscription } };

      hasInitialized.current = true;
      console.log('🔐 [AuthProvider] Auth initialization completed successfully');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [AuthProvider] Auth initialization failed:', error);
      setAuthError(errorMessage || 'Authentication initialization failed');
    } finally {
      setLoading(false);
      isInitializing.current = false;
    }
  }, []);

  // CRITICAL FIX: Single initialization effect
  useEffect(() => {
    if (!hasInitialized.current) {
      initializeAuth();
    }
  }, [initializeAuth]);

  // Enhanced fetchUserProfile with better error handling
  const fetchUserProfile = useCallback(async (authUser: { id: string; email?: string | undefined; user_metadata?: Record<string, any> }) => {
    console.log('🔍 [AuthContext] fetchUserProfile called for:', {
      id: authUser.id,
      email: authUser.email,
      hasEmail: !!authUser.email
    });
    
    if (!authUser?.id) {
      console.error('❌ [AuthContext] Invalid auth user object:', authUser);
      throw new Error('Invalid authentication user object');
    }
    
    try {
      console.log('🔍 [AuthContext] Fetching user profile from database...');
      
      // Try to fetch user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('No rows returned')) {
          console.log('DEBUG [AuthContext] User profile not found, creating basic profile');
          
          // Get user metadata safely
          const metadata = authUser.user_metadata as UserMetadata || {};
          
          // Create a basic user profile
          const basicProfile: User = {
            id: authUser.id,
            auth_user_id: authUser.id,
            email: authUser.email || '',
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || '',
            full_name: metadata.full_name || authUser.email,
            role: metadata.role || 'student',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            password_changed: false
          };
          
          // Insert the basic profile
          const { error: insertError } = await supabase
            .from('users')
            .insert([basicProfile] as any);
          
          if (insertError) {
            console.warn('DEBUG [AuthContext] Failed to create profile:', insertError);
            // Continue with basic profile even if insert fails
          } else {
            console.log('DEBUG [AuthContext] Basic profile created successfully');
          }
          
          setUser(basicProfile);
          return;
        }
        
        throw new Error(`Failed to fetch user profile: ${error.message}`);
      }
      
      console.log('✅ [AuthContext] User profile fetched successfully:', profile);
      
      // Get the profile data safely
      const profileData = profile as Record<string, unknown>;
      
      // Cast the profile to User type and handle nullable fields
      const userProfile: User = {
        id: String(profileData.id || authUser.id),
        email: String(profileData.email || authUser.email || ''),
        role: String(profileData.role || 'student'),
        first_name: String(profileData.first_name || ''),
        last_name: String(profileData.last_name || ''),
        full_name: String(profileData.full_name || profileData.email || authUser.email)
      };
      
      setUser(userProfile);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [AuthContext] Error in fetchUserProfile:', error);
      setAuthError(errorMessage);
      
      // Set basic user info even if profile fetch fails
      const metadata = authUser.user_metadata as UserMetadata || {};
      const basicUser: User = {
        id: authUser.id,
        email: String(authUser.email || ''),
        role: metadata.role || 'student',
        first_name: metadata.first_name || '',
        last_name: metadata.last_name || '',
        full_name: metadata.full_name || authUser.email
      };
      setUser(basicUser);
    }
  }, []);

  // CRITICAL FIX: Simplified sign in without complex logic
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError('');
      
      console.log('🔐 [AuthProvider] Signing in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ [AuthProvider] Sign in error:', error);
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      
      if (data?.user) {
        console.log('✅ [AuthProvider] Sign in successful for user:', data.user.id);
        await fetchUserProfile(data.user);
        return { success: true };
      } else {
        setAuthError('No user data received');
        return { success: false, error: 'No user data received' };
      }
      
    } catch (error: any) {
      console.error('❌ [AuthProvider] Sign in exception:', error);
      const errorMessage = error.message || 'Sign in failed';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const signOut = useCallback(async () => {
    try {
      console.log('🔐 [AuthProvider] Signing out user');
      await supabase.auth.signOut();
      setUser(null);
      setAuthError('');
    } catch (error: any) {
      console.error('❌ [AuthProvider] Sign out error:', error);
      setAuthError(error.message || 'Sign out failed');
    }
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [AuthProvider] Change password error:', error);
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
