'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { SessionManager } from '@/lib/services/sessionManager';

interface UseSessionManagementOptions {
  checkInterval?: number; // How often to check session validity (in minutes)
  autoLogout?: boolean; // Whether to automatically logout on session expiry
  redirectOnInvalid?: string; // Where to redirect when session is invalid
}

export function useSessionManagement({
  checkInterval = 5, // Check every 5 minutes
  autoLogout = true,
  redirectOnInvalid = '/login'
}: UseSessionManagementOptions = {}) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout>();
  const activityTimeoutRef = useRef<NodeJS.Timeout>();
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Handle user activity to extend session
   */
  const handleUserActivity = useCallback(() => {
    // Clear existing timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Set new timeout for session extension
    activityTimeoutRef.current = setTimeout(async () => {
      await SessionManager.updateSessionActivity();
    }, 30000); // 30 seconds delay to avoid too frequent updates
  }, []);

  /**
   * Check session validity and handle accordingly
   */
  const checkSessionValidity = useCallback(async () => {
    try {
      const isValid = await SessionManager.isSessionValid();
      
      if (!isValid && autoLogout) {
        // Session is invalid, logout user
        await supabase.auth.signOut();
        
        // Clear any stored session data
        localStorage.removeItem('classbridge_session_id');
        localStorage.removeItem('classbridge_device_id');
        
        // Redirect to login
        if (redirectOnInvalid) {
          router.push(redirectOnInvalid);
        }
      }
    } catch (error) {
      console.error('Error checking session validity:', error);
    }
  }, [autoLogout, redirectOnInvalid, router]);

  /**
   * Create session for newly logged in user
   */
  const createUserSession = useCallback(async (userId: string) => {
    try {
      const session = await SessionManager.createSession(userId);
      if (session) {
        console.log('Session created successfully for device:', session.device_name);
        return session;
      }
    } catch (error) {
      console.error('Error creating user session:', error);
    }
    return null;
  }, []);

  /**
   * Force logout from all other devices
   */
  const forceLogoutOtherDevices = useCallback(async () => {
    try {
      const success = await SessionManager.forceLogoutOtherDevices();
      if (success) {
        console.log('Successfully logged out from all other devices');
        return true;
      }
    } catch (error) {
      console.error('Error force logging out other devices:', error);
    }
    return false;
  }, []);

  /**
   * Get current session information
   */
  const getCurrentSession = useCallback(async () => {
    try {
      return await SessionManager.getCurrentSession();
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }, []);

  /**
   * Get all active sessions for current user
   */
  const getActiveSessions = useCallback(async () => {
    try {
      return await SessionManager.getActiveSessions();
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }, []);

  /**
   * End current session
   */
  const endCurrentSession = useCallback(async () => {
    try {
      const success = await SessionManager.endSession();
      if (success) {
        console.log('Current session ended successfully');
        return true;
      }
    } catch (error) {
      console.error('Error ending current session:', error);
    }
    return false;
  }, []);

  /**
   * Extend current session
   */
  const extendSession = useCallback(async (hours: number = 2.5) => {
    try {
      const success = await SessionManager.extendSession(hours);
      if (success) {
        console.log(`Session extended by ${hours} hours`);
        return true;
      }
    } catch (error) {
      console.error('Error extending session:', error);
    }
    return false;
  }, []);

  /**
   * Get session statistics
   */
  const getSessionStats = useCallback(async () => {
    try {
      return await SessionManager.getSessionStats();
    } catch (error) {
      console.error('Error getting session stats:', error);
      return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 };
    }
  }, []);

  // Set up activity listeners
  useEffect(() => {
    // Only set up activity listeners if initialized
    if (!isInitialized) {
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [handleUserActivity, isInitialized]);

  // Set up periodic session checking
  useEffect(() => {
    // Only start session checking if we have a valid user session and are initialized
    if (!isInitialized) {
      console.log('[useSessionManagement] Waiting for initialization...');
      return;
    }

    const initializeSessionChecking = async () => {
      try {
        const currentSession = await SessionManager.getCurrentSession();
        if (currentSession) {
          console.log('[useSessionManagement] Starting session validation');
          // Check session validity immediately
          checkSessionValidity();

          // Set up interval for periodic checking
          intervalRef.current = setInterval(checkSessionValidity, checkInterval * 60 * 1000);
        }
      } catch (error) {
        console.log('[useSessionManagement] No active session yet, waiting for authentication');
      }
    };

    // Initialize with a delay to avoid conflicts
    const timer = setTimeout(initializeSessionChecking, 2000);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [checkSessionValidity, checkInterval, isInitialized]);

  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useSessionManagement] Auth state change:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in, create session with delay to avoid conflicts
        setTimeout(async () => {
          try {
            const sessionResult = await createUserSession(session.user.id);
            if (sessionResult) {
              console.log('[useSessionManagement] Session created successfully');
              setIsInitialized(true);
            }
          } catch (error) {
            console.error('[useSessionManagement] Error creating session:', error);
          }
        }, 1000); // 1 second delay
      } else if (event === 'SIGNED_OUT') {
        // User signed out, end session
        try {
          await endCurrentSession();
          console.log('[useSessionManagement] Session ended successfully');
          setIsInitialized(false);
        } catch (error) {
          console.error('[useSessionManagement] Error ending session:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [createUserSession, endCurrentSession]);

  // Don't return functions until initialized to prevent premature calls
  if (!isInitialized) {
    return {
      createUserSession: async () => null,
      getCurrentSession: async () => null,
      getActiveSessions: async () => [],
      endCurrentSession: async () => false,
      forceLogoutOtherDevices: async () => false,
      extendSession: async () => false,
      getSessionStats: async () => ({ totalSessions: 0, activeSessions: 0, expiredSessions: 0 }),
      checkSessionValidity: async () => {},
      isSessionValid: async () => false,
      isInitialized: false
    };
  }

  return {
    // Session management functions
    createUserSession,
    getCurrentSession,
    getActiveSessions,
    endCurrentSession,
    forceLogoutOtherDevices,
    extendSession,
    getSessionStats,
    
    // Session checking
    checkSessionValidity,
    
    // Utility functions
    isSessionValid: () => SessionManager.isSessionValid(),
    isInitialized: true
  };
}
