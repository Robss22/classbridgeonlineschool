"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { getUserFriendlyErrorMessage, logTechnicalError } from '../../utils/errorHandler';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [offline, setOffline] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Handle hydration
  useEffect(() => {
    setIsClient(true);
    setOffline(!navigator.onLine);
    window.addEventListener('online', () => setOffline(false));
    window.addEventListener('offline', () => setOffline(true));
    return () => {
      window.removeEventListener('online', () => setOffline(false));
      window.removeEventListener('offline', () => setOffline(true));
    };
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

    // Check network status
    if (offline) {
      setError('You appear to be offline. Please check your internet connection and try again.');
      setLoading(false);
      return;
    }

    // Check Supabase config
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError('Login service is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    // Set a maximum timeout for the entire login process
    const loginTimeout = setTimeout(() => {
      setError('Login process timed out. Please try again.');
      setLoading(false);
      setShowWelcome(false);
    }, 20000); // 20 seconds total timeout

    try {
      // Step 0: Test Supabase connection
      // Environment check
      
      try {
        const { error: testError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (testError) {
          // Supabase connection test failed
        } else {
          // Supabase connection test successful
        }
      } catch {
        // Supabase connection test error
      }

      // Step 1: Authenticate with Supabase
      // Starting Supabase authentication
      
      // Retry authentication up to 3 times with exponential backoff
      let authData, authError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Authentication attempt
          
          const authPromise = supabase.auth.signInWithPassword({
            email,
            password,
          });
          const authTimeoutPromise = new Promise<typeof authPromise>((_, reject) => {
            setTimeout(() => reject(new Error('Authentication is taking longer than expected. This might be due to network issues or server load. Please try again.')), 30000);
          });
          
          const result = await Promise.race([authPromise, authTimeoutPromise]);
          authData = result.data;
          authError = result.error;
          
          if (!authError) {
            // Authentication successful on attempt
            break;
          }
          
          if (attempt < 3) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s delays
            // Authentication failed, retrying
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (retryError: unknown) {
          authError = retryError;
          if (attempt < 3) {
            const delay = Math.pow(2, attempt) * 1000;
            // Authentication error, retrying
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // Auth response

      if (authError) {
        // Authentication error
        const errorMessage = authError instanceof Error ? authError.message : 'Unknown authentication error';
        setError(`Login failed: ${errorMessage}. Please check your credentials or try again later.`);
        setLoading(false);
        clearTimeout(loginTimeout);
        return;
      }

      if (!authData?.user) {
        // No user returned from authentication
        setError('Login failed: No user data received. Please try again.');
        setLoading(false);
        clearTimeout(loginTimeout);
        return;
      }

      // Step 2: Fetch user profile
      // Fetching user profile for ID
      
      const profilePromise = supabase
        .from('users')
        .select('full_name, first_name, last_name, role, password_changed, auth_user_id')
        .eq('auth_user_id', authData.user.id)
        .single();
      
      const profileTimeoutPromise = new Promise<typeof profilePromise>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 30 seconds')), 30000);
      });
      
      const result = await Promise.race([profilePromise, profileTimeoutPromise]);
      let profile = result.data;
      const profileError = result.error;
      
      // Profile fetch result

      if (profileError) {
        // Profile fetch error
        // Try fallback query by email
        // Step 2b: Trying fallback query by email
        const fallbackPromise = supabase
          .from('users')
          .select('full_name, first_name, last_name, role, password_changed, auth_user_id')
          .eq('email', email)
          .single();

        const fallbackTimeoutPromise = new Promise<typeof fallbackPromise>((_, reject) => {
          setTimeout(() => reject(new Error('Fallback profile fetch timeout after 30 seconds')), 30000);
        });

        const { data: fallbackProfile, error: fallbackError } = await Promise.race([fallbackPromise, fallbackTimeoutPromise]);
        
        // Fallback profile result
        
        if (fallbackError || !fallbackProfile) {
          logTechnicalError(profileError, 'Login Profile Fetch');
          const userFriendlyMessage = getUserFriendlyErrorMessage(profileError);
          setError(userFriendlyMessage);
          setLoading(false);
          clearTimeout(loginTimeout);
          return;
        }
        
        // Use fallback profile
        profile = fallbackProfile;
      }

      if (!profile) {
        // No profile data found
        setError('User profile not found in database. Please contact support.');
        setLoading(false);
        clearTimeout(loginTimeout);
        return;
      }

      // Step 3: Set welcome message
      // Setting welcome message
      const displayName = (profile.full_name && profile.full_name.trim()) || 
                          ((profile.first_name && profile.last_name) ? 
                           (profile.first_name + ' ' + profile.last_name) : 
                           'User');
      
      setFullName(displayName);
      setShowWelcome(true);

      // Step 4: Navigate based on role
      // Determining navigation
      
      // Clear the timeout since we're about to navigate
      clearTimeout(loginTimeout);

      // Immediate navigation without delay
      // Navigating immediately
      try {
        switch (profile.role) {
          case 'admin':
            // Redirecting to admin dashboard
            router.replace('/admin/dashboard');
            break;
          case 'teacher':
          case 'class_tutor':
            // Redirecting to teacher dashboard
            router.replace('/teachers/dashboard');
            break;
          case 'student':
            // Redirecting to student dashboard
            router.replace('/students/dashboard');
            break;
          default:
            // Unknown role, redirecting to student dashboard
            router.replace('/students/dashboard');
            break;
        }
      } catch {
        // Navigation error
        setError('Navigation failed. Please try again.');
        setLoading(false);
        setShowWelcome(false);
      }

    } catch (err) {
      logTechnicalError(err, 'Login General Error');
      clearTimeout(loginTimeout);
      
      const userFriendlyMessage = getUserFriendlyErrorMessage(err);
      setError(userFriendlyMessage);
      setLoading(false);
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
          {offline && (
            <p style={{ color: 'red', marginTop: '10px' }}>You are offline. Please check your internet connection.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300">
      <div style={{
        backgroundColor: 'white',
        padding: '48px 40px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        maxWidth: '420px',
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid rgba(160, 132, 232, 0.1)'
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
            <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold' }}>
              Welcome to Class Bridge Online School
            </h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {offline && (
                <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>
                  You are offline. Please check your internet connection.
                </div>
              )}
              <label style={{ display: 'flex', flexDirection: 'column', color: '#374151', fontWeight: '500' }}>
                Email:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!loading}
                  required
                  style={{
                    padding: '12px 16px',
                    marginTop: '6px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    opacity: loading ? 0.6 : 1,
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#A084E8'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', color: '#374151', fontWeight: '500' }}>
                Password:
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!loading}
                  required
                  style={{
                    padding: '12px 16px',
                    marginTop: '6px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    opacity: loading ? 0.6 : 1,
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#A084E8'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </label>
              <button
                type="submit"
                style={{
                  padding: '14px 24px',
                  backgroundColor: loading ? '#b3c6e6' : '#A084E8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '15px',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 6px rgba(160, 132, 232, 0.2)'
                }}
                disabled={!!loading}
                onMouseOver={e => { if (!loading) e.currentTarget.style.backgroundColor = '#8B6FD8'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(160, 132, 232, 0.3)'; }}
                onMouseOut={e => { if (!loading) e.currentTarget.style.backgroundColor = '#A084E8'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(160, 132, 232, 0.2)'; }}
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