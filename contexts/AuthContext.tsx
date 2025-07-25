'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Fetch user profile (including role) from your users table
  async function fetchUserProfile(authUser) {
    if (!authUser?.id) return null;
    let { data, error } = await supabase
      .from('users')
      .select('auth_user_id, id, role, email, full_name, first_name, last_name')
      .eq('auth_user_id', authUser.id)
      .single();
    console.log('DEBUG [AuthContext] fetch by auth_user_id:', { data, error });
    if (error || !data) {
      const fallback = await supabase
        .from('users')
        .select('auth_user_id, id, role, email, full_name, first_name, last_name')
        .eq('id', authUser.id)
        .single();
      data = fallback.data;
      error = fallback.error;
      console.log('DEBUG [AuthContext] fetch by id fallback:', { data, error });
      if (error || !data) {
        setAuthError('Error fetching user profile: ' + (error?.message || 'User profile not found'));
        console.error('Error fetching user profile:', error);
        return { ...authUser, role: undefined, error: 'User profile not found' };
      }
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
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
