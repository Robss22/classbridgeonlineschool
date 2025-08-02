'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Change password function that updates both Supabase Auth and database
  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      console.log('🔐 [changePassword] Starting password change process');
      
      // Step 1: Verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyError) {
        console.error('❌ [changePassword] Current password verification failed:', verifyError);
        return { success: false, error: 'Current password is incorrect' };
      }

      // Step 2: Update password in Supabase Auth
      const { error: updateAuthError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateAuthError) {
        console.error('❌ [changePassword] Supabase Auth update failed:', updateAuthError);
        return { success: false, error: 'Failed to update password: ' + updateAuthError.message };
      }

      // Step 3: Update password_changed flag in users table
      const { error: updateDbError } = await supabase
        .from('users')
        .update({ password_changed: true })
        .eq('auth_user_id', user.id);

      if (updateDbError) {
        console.error('❌ [changePassword] Database update failed:', updateDbError);
        return { success: false, error: 'Failed to update user status: ' + updateDbError.message };
      }

      console.log('✅ [changePassword] Password changed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [changePassword] Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred: ' + error.message };
    }
  };

  // Fetch user profile (including role) from your users table
  async function fetchUserProfile(authUser) {
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
      } catch (err) {
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
      } catch (err) {
        setAuthError('Error on auth state change: ' + (err?.message || err));
        console.error('DEBUG [AuthContext] onAuthStateChange error:', err);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (authError) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">{authError}</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      changePassword,
      isAuthenticated: !!user,
      loadingAuth: loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
