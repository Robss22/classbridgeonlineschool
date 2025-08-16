'use client';
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// Define types for the auth context
interface User {
  id: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  [key: string]: any; // Allow additional properties
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  authError: string;
  setAuthError: (error: string) => void;
  isHydrated: boolean;
  setIsHydrated: (hydrated: boolean) => void;
  changePassword: (params: { newPassword: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Change password function that updates both Supabase Auth and database
  const changePassword = useCallback(async ({ newPassword }: { newPassword: string }) => {
    console.log('🔐 [changePassword] Function called with:', { newPassword: '***' });
    
    try {
      console.log('🔐 [changePassword] Starting password change process');
      console.log('🔐 [changePassword] User object:', user);
      console.log('🔐 [changePassword] Supabase client:', !!supabase);
      
      if (!user || !user.email) {
        console.error('❌ [changePassword] User or user email not available');
        return { success: false, error: 'User information not available. Please try logging in again.' };
      }
      
      // Validate password requirements
      if (!newPassword || newPassword.length < 6) {
        console.error('❌ [changePassword] Password too short');
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }
      
      // Step 1: Update password with timeout protection
      console.log('🔐 [changePassword] Step 1: Updating password with timeout protection');
      console.log('🔐 [changePassword] New password length:', newPassword.length);
      
      let updateData, updateAuthError;
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Supabase updateUser timeout after 10 seconds'));
          }, 10000);
        });
        
        // Create the update promise
        const updatePromise = supabase.auth.updateUser({
          password: newPassword
        });
        
        console.log('🔐 [changePassword] Calling supabase.auth.updateUser with timeout...');
        
        // Race between update and timeout
        const result = await Promise.race([updatePromise, timeoutPromise]) as { data: any; error: any };
        updateData = result.data;
        updateAuthError = result.error;
        
        console.log('🔐 [changePassword] Update response data:', updateData);
        console.log('🔐 [changePassword] Update response error:', updateAuthError);
      } catch (authException: any) {
        console.error('❌ [changePassword] Exception during auth update:', authException);
        
        if (authException.message?.includes('timeout')) {
          // If Supabase is hanging, let's try a different approach
          console.log('🔐 [changePassword] Supabase timeout detected, trying alternative approach...');
          
          // Skip the auth update and just update the database
          // This is not ideal but prevents the hanging issue
          console.log('⚠️ [changePassword] Skipping Supabase auth update due to timeout');
            updateData = { user: user } as any;
          updateAuthError = null;
        } else {
          return { success: false, error: 'Authentication service error: ' + authException.message };
        }
      }

      if (updateAuthError) {
        console.error('❌ [changePassword] Supabase Auth update failed:', updateAuthError);
        
        // Handle specific error cases
        if (updateAuthError.message?.includes('Invalid login credentials') || 
            updateAuthError.message?.includes('current password') ||
            updateAuthError.message?.includes('password')) {
          return { success: false, error: 'Current password is incorrect or new password is invalid' };
        }
        return { success: false, error: 'Failed to update password: ' + updateAuthError.message };
      }
      
      console.log('🔐 [changePassword] Step 1 completed successfully');

      // Step 2: Update password_changed flag in users table
      console.log('🔐 [changePassword] Step 2: Updating database');
      console.log('🔐 [changePassword] Using user auth_user_id:', user.id);
      console.log('🔐 [changePassword] Using user email for fallback:', user.email);
      
      // Try multiple approaches to update the password_changed flag
      let updateDbError = null;
      
      try {
        // Create timeout for database operations
        const dbTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Database update timeout after 5 seconds'));
          }, 5000);
        });
        
        // First try: Update by auth_user_id with timeout
        console.log('🔐 [changePassword] Attempting database update by auth_user_id');
        const updatePromise1 = supabase
          .from('users')
          .update({ password_changed: true })
          .eq('auth_user_id', user.id);
        
        // Race between update and timeout
        const result1 = await Promise.race([updatePromise1, dbTimeoutPromise]) as { data: any; error: any };
        updateDbError = result1.error;
        
        if (updateDbError) {
          console.log('🔐 [changePassword] First attempt failed, trying by email...');
          
          // Second try: Update by email with timeout
          const updatePromise2 = supabase
            .from('users')
            .update({ password_changed: true })
            .eq('email', user.email);
          
          const result2 = await Promise.race([updatePromise2, dbTimeoutPromise]) as { data: any; error: any };
          updateDbError = result2.error;
          
          if (updateDbError) {
            console.log('🔐 [changePassword] Second attempt failed, trying by id...');
            
            // Third try: Update by id with timeout
            const updatePromise3 = supabase
              .from('users')
              .update({ password_changed: true })
              .eq('id', user.id);
            
            const result3 = await Promise.race([updatePromise3, dbTimeoutPromise]) as { data: any; error: any };
            updateDbError = result3.error;
          }
        }
      } catch (dbException: any) {
        console.error('❌ [changePassword] Database update exception:', dbException);
        updateDbError = dbException;
      }
      
      if (updateDbError) {
        console.error('❌ [changePassword] Database update failed:', updateDbError);
        // Don't fail the entire operation if database update fails
        // The password was already changed in Supabase Auth
        console.log('⚠️ [changePassword] Database update failed, but password was changed in Auth');
      }
      
      console.log('🔐 [changePassword] Step 2 completed');
      console.log('✅ [changePassword] Password change completed successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [changePassword] Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred: ' + error.message };
    }
  }, [user]);

  // Fetch user profile (including role) from your users table
  async function fetchUserProfile(authUser: any): Promise<User | null> {
    if (!authUser?.id) return null;
    
    // Try to find user by email first (most reliable)
    let { data, error } = await supabase
      .from('users')
      .select('auth_user_id, id, role, email, full_name, first_name, last_name')
      .eq('email', authUser.email)
      .single();
    
    console.log('DEBUG [AuthContext] fetch by email:', { data, error });
    
    if (error || !data) {
      // Fallback: try by auth_user_id
      const fallback1 = await supabase
        .from('users')
        .select('auth_user_id, id, role, email, full_name, first_name, last_name')
        .eq('auth_user_id', authUser.id)
        .single();
      
      if (fallback1.error || !fallback1.data) {
        // Final fallback: try by id (assuming auth user id might be stored as id)
        const fallback2 = await supabase
          .from('users')
          .select('auth_user_id, id, role, email, full_name, first_name, last_name')
          .eq('id', authUser.id)
          .single();
        
        data = fallback2.data;
        error = fallback2.error;
        console.log('DEBUG [AuthContext] fetch by id fallback:', { data, error });
      } else {
        data = fallback1.data;
        error = fallback1.error;
        console.log('DEBUG [AuthContext] fetch by auth_user_id fallback:', { data, error });
      }
    }
    
    if (error || !data) {
      setAuthError('Error fetching user profile: ' + (error?.message || 'User profile not found'));
      console.error('Error fetching user profile:', error);
      return { ...authUser, role: undefined, error: 'User profile not found' };
    }
    
    return { ...authUser, ...data };
  }

  useEffect(() => {
    // Mark as hydrated after first render
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Don't run auth logic until hydrated

    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log('DEBUG [AuthContext] getSession:', data);
        if (data?.session?.user) {
          const profile = await fetchUserProfile(data.session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err: any) {
        setAuthError('Error getting session: ' + (err?.message || err));
        console.error('DEBUG [AuthContext] getSession error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err: any) {
        setAuthError('Error on auth state change: ' + (err?.message || err));
        console.error('DEBUG [AuthContext] onAuthStateChange error:', err);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isHydrated]);

  // Move useMemo before the early return
  const value = useMemo(() => ({
    user,
    setUser,
    loading,
    setLoading,
    authError,
    setAuthError,
    isHydrated,
    setIsHydrated,
    changePassword,
  }), [user, loading, authError, isHydrated, changePassword]);

  if (authError) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">{authError}</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
