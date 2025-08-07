"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Handle hydration
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Automatically reset loading and welcome state on route change
  useEffect(() => {
    setLoading(false);
    setShowWelcome(false);
  }, [pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Login attempt started:', { email });
    console.log('Supabase client check:', { 
      hasClient: !!supabase, 
      hasAuth: !!supabase?.auth,
      envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      hasEnvKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    try {
      // Step 1: Authenticate with Supabase
      console.log('Step 1: Authenticating...');
      
      // Add timeout to prevent hanging
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout after 10 seconds')), 10000);
      });
      
      const { data: authData, error: authError } = await Promise.race([authPromise, timeoutPromise]);
      
      console.log('Auth response:', { user: authData?.user, authError });

      if (authError) {
        console.error('Authentication error:', authError);
        setError(`Authentication failed: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        console.error('No user returned from authentication');
        setError('Authentication failed: No user data received');
        setLoading(false);
        return;
      }

      // Step 2: Fetch user profile
      console.log('Step 2: Fetching user profile for ID:', authData.user.id);
      
      const profilePromise = supabase
        .from('users')
        .select('full_name, first_name, last_name, role, password_changed, auth_user_id')
        .eq('auth_user_id', authData.user.id)
        .single();
      
      const profileTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000);
      });
      
      let { data: profile, error: profileError } = await Promise.race([profilePromise, profileTimeoutPromise]);
      
      console.log('Profile fetch result:', { profile, profileError });

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Try fallback query by email
        console.log('Step 2b: Trying fallback query by email...');
        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from('users')
          .select('full_name, first_name, last_name, role, password_changed, auth_user_id')
          .eq('email', email)
          .single();
        
        console.log('Fallback profile result:', { fallbackProfile, fallbackError });
        
        if (fallbackError || !fallbackProfile) {
          setError(`Failed to fetch user profile: ${profileError.message}`);
          setLoading(false);
          return;
        }
        
        // Use fallback profile
        profile = fallbackProfile;
      }

      if (!profile) {
        console.error('No profile data found');
        setError('User profile not found in database');
        setLoading(false);
        return;
      }

      // Step 3: Set welcome message
      console.log('Step 3: Setting welcome message...');
      const displayName = (profile.full_name && profile.full_name.trim()) || 
                          ((profile.first_name && profile.last_name) ? 
                           (profile.first_name + ' ' + profile.last_name) : 
                           'User');
      
      setFullName(displayName);
      setShowWelcome(true);

      // Step 4: Navigate based on role
      console.log('Step 4: Determining navigation...', { 
        role: profile.role, 
        passwordChanged: profile.password_changed 
      });

      // Immediate navigation without delay
      console.log('Navigating immediately...');
      try {
        switch (profile.role) {
          case 'admin':
            console.log('Redirecting to admin dashboard');
            router.replace('/admin/dashboard');
            break;
          case 'teacher':
          case 'class_tutor':
            console.log('Redirecting to teacher dashboard');
            router.replace('/teachers/dashboard');
            break;
          case 'student':
            console.log('Redirecting to student dashboard');
            router.replace('/students/dashboard');
            break;
          default:
            console.log('Unknown role, redirecting to student dashboard');
            router.replace('/students/dashboard');
            break;
        }
      } catch (navError) {
        console.error('Navigation error:', navError);
        setError('Navigation failed. Please try again.');
        setLoading(false);
        setShowWelcome(false);
      }

    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    } finally {
      // Fallback: ensure loading is reset after 15 seconds
      setTimeout(() => {
        if (loading) {
          console.log('Fallback: Resetting loading state');
          setLoading(false);
        }
      }, 15000);
    }
  };

  // Reset function to clear states
  const resetForm = () => {
    setLoading(false);
    setShowWelcome(false);
    setError('');
    setFullName('');
  };

  // Show loading state until client is hydrated
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300">
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}>
          <div style={{ 
            display: 'inline-block',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #0070f3',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300">
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {showWelcome ? (
          <div>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
              Welcome back, <span style={{ color: 'green', fontWeight: 'bold' }}>{fullName}</span> 👋
            </h2>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <p>Redirecting you to your dashboard...</p>
              <div style={{ 
                display: 'inline-block',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #0070f3',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                animation: 'spin 1s linear infinite',
                marginTop: '10px'
              }} />
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
              Welcome to Class Bridge Online School
            </h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', color: '#555' }}>
                Email:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  style={{
                    padding: '10px',
                    marginTop: '5px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    opacity: loading ? 0.6 : 1
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', color: '#555' }}>
                Password:
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  style={{
                    padding: '10px',
                    marginTop: '5px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    opacity: loading ? 0.6 : 1
                  }}
                />
              </label>
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  backgroundColor: loading ? '#b3c6e6' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  marginTop: '10px',
                  transition: 'background-color 0.3s ease',
                  position: 'relative',
                  opacity: loading ? 0.7 : 1
                }}
                disabled={loading}
                onMouseOver={e => { if (!loading) e.currentTarget.style.backgroundColor = '#005bb5'; }}
                onMouseOut={e => { if (!loading) e.currentTarget.style.backgroundColor = '#0070f3'; }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="loader" style={{
                      border: '2px solid #f3f3f3',
                      borderTop: '2px solid #0070f3',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      marginRight: '8px',
                      animation: 'spin 1s linear infinite',
                      display: 'inline-block',
                    }} />
                    Logging in...
                  </span>
                ) : 'Login'}
              </button>
            </form>
            {error && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
                <button 
                  onClick={resetForm}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%'
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;