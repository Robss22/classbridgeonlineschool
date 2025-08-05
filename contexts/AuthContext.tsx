'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Change password function that updates both Supabase Auth and database
  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      console.log('🔐 [changePassword] Starting password change process');
      console.log('🔐 [changePassword] User object:', user);
      
      if (!user || !user.email) {
        console.error('❌ [changePassword] User or user email not available');
        return { success: false, error: 'User information not available. Please try logging in again.' };
      }
      
      // Validate password requirements
      if (!newPassword || newPassword.length < 6) {
        console.error('❌ [changePassword] Password too short');
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }
      
      // Step 1: Update password in Supabase Auth (this will verify current password automatically)
      console.log('🔐 [changePassword] Step 1: Updating password in Supabase Auth');
      console.log('🔐 [changePassword] New password length:', newPassword.length);
      
      const { data: updateData, error: updateAuthError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      console.log('🔐 [changePassword] Update response data:', updateData);
      console.log('🔐 [changePassword] Update response error:', updateAuthError);

      if (updateAuthError) {
        console.error('❌ [changePassword] Supabase Auth update failed:', updateAuthError);
        // Handle specific error cases
        if (updateAuthError.message?.includes('Invalid login credentials') || 
            updateAuthError.message?.includes('current password')) {
          return { success: false, error: 'Current password is incorrect' };
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
      
      // First try: Update by auth_user_id
      const { error: error1 } = await supabase
        .from('users')
        .update({ password_changed: true })
        .eq('auth_user_id', user.id);
      
      if (error1) {
        console.log('🔐 [changePassword] First attempt failed, trying by email:', error1);
        // Second try: Update by email
        const { error: error2 } = await supabase
          .from('users')
          .update({ password_changed: true })
          .eq('email', user.email);
        
        if (error2) {
          console.log('🔐 [changePassword] Second attempt failed, trying by id:', error2);
          // Third try: Update by id (in case auth_user_id is stored as id)
          const { error: error3 } = await supabase
            .from('users')
            .update({ password_changed: true })
            .eq('id', user.id);
          
          updateDbError = error3;
        }
      }

      if (updateDbError) {
        console.error('❌ [changePassword] All database update attempts failed:', updateDbError);
        // Password was changed in auth but flag update failed - still consider it a success
        // but warn the user they might need to contact support
        return { 
          success: true, 
          warning: 'Password updated successfully, but there was an issue updating your profile. If you experience login issues, please contact support.' 
        };
      }
      
      console.log('✅ [changePassword] Password and database updated successfully');
      
      // Step 3: Update the user object in context to reflect the change immediately
      setUser(prevUser => ({ ...prevUser, password_changed: true }));
      
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
  }, [isHydrated]);

  if (authError) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">{authError}</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      changePassword,
      isAuthenticated: !!user,
      loadingAuth: loading,
      isHydrated
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
