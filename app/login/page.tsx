"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { getUserFriendlyErrorMessage, logTechnicalError } from '../../utils/errorHandler';
import ClientOnly from '../../components/ClientOnly';

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

    // Check Supabase config - these should always be available since we have fallbacks
    // The supabaseClient.ts already handles missing environment variables with fallbacks
    // So we can proceed with the login attempt

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
        <div className="bg-white p-10 rounded-lg shadow-lg max-w-sm w-full text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-5" />
          <p className="text-gray-700">Loading...</p>
          {offline && (
            <p className="text-red-500 mt-2">You are offline. Please check your internet connection.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300">
      <ClientOnly fallback={
        <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-md w-full border border-purple-100">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-5" />
            <p className="text-gray-700">Loading...</p>
          </div>
        </div>
      }>
        <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-md w-full border border-purple-100">
          {showWelcome ? (
            <div>
              <h2 className="text-center mb-5 text-gray-800">
                Welcome back, <span className="text-green-600 font-bold">{fullName}</span> 👋
              </h2>
              <div className="text-center text-gray-600">
                <p>Redirecting you to your dashboard...</p>
                <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mt-2" />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-center mb-6 text-gray-900 text-2xl font-bold">
                Welcome to Class Bridge Online School
              </h2>
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                {offline && (
                  <div className="text-red-500 text-center mb-2">
                    You are offline. Please check your internet connection.
                  </div>
                )}
                <label className="flex flex-col text-gray-700 font-medium">
                  Email:
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!loading}
                    required
                    className="px-4 py-3 mt-1.5 border-2 border-gray-300 rounded-lg text-base opacity-100 transition-colors duration-300 outline-none focus:border-purple-400 disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col text-gray-700 font-medium">
                  Password:
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!!loading}
                    required
                    className="px-4 py-3 mt-1.5 border-2 border-gray-300 rounded-lg text-base opacity-100 transition-colors duration-300 outline-none focus:border-purple-400 disabled:opacity-60"
                  />
                </label>
                <button
                  type="submit"
                  className={`px-6 py-3.5 text-white border-none rounded-lg text-base font-bold mt-4 w-full transition-all duration-300 relative ${
                    loading 
                      ? 'bg-blue-300 cursor-not-allowed opacity-70' 
                      : 'bg-purple-500 hover:bg-purple-600 hover:-translate-y-0.5 hover:shadow-lg'
                  }`}
                  disabled={!!loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="w-4.5 h-4.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2 inline-block" />
                      Logging in...
                    </span>
                  ) : 'Login'}
                </button>
              </form>
              {error && (
                <div className="mt-5">
                  <p className="text-red-500 text-center">{error}</p>
                  <button 
                    onClick={resetForm}
                    className="mt-2.5 px-4 py-2 bg-red-500 text-white border-none rounded cursor-pointer text-sm w-full hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </ClientOnly>
    </div>
  );
}

export default Login;