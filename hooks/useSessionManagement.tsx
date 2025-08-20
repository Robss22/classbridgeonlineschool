'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
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
  
  // CRITICAL FIX: Use refs to prevent infinite loops
  const isInitializing = useRef(false);
  const hasInitialized = useRef(false);
  const lastAuthState = useRef<string>('');

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
      try {
        await SessionManager.updateSessionActivity();
      } catch (error) {
        console.warn('Session activity update failed:', error);
      }
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
      console.log('[useSessionManagement] Creating session for user:', userId);
      
      const session = await SessionManager.createSession(userId);
      if (session) {
        console.log('✅ Session created successfully for device:', session.device_name);
        return session;
      } else {
        console.warn('⚠️ Session creation returned null for user:', userId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating user session:', error);
      return null;
    }
  }, []);

  /**
   * Force logout from all other devices
   */
  const forceLogoutOtherDevices = useCallback(async () => {
    try {
      const success = await SessionManager.forceLogoutOtherDevices();
      if (success) {
        console.log('✅ Successfully logged out from all other devices');
        return true;
      }
    } catch (error) {
      console.error('❌ Error force logging out other devices:', error);
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
      console.error('❌ Error getting current session:', error);
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
      console.error('❌ Error getting active sessions:', error);
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
        console.log('✅ Current session ended successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ Error ending current session:', error);
    }
    return false;
  }, []);

  /**
   * Extend current session
   */
  const extendSession = useCallback(async () => {
    try {
      const success = await SessionManager.extendSession();
      if (success) {
        console.log('✅ Session extended successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ Error extending session:', error);
    }
    return false;
  }, []);

  /**
   * CRITICAL FIX: Initialize session management only once
   */
  const initializeSessionManagement = useCallback(async () => {
    if (isInitializing.current || hasInitialized.current) {
      console.log('[useSessionManagement] Already initializing or initialized, skipping...');
      return;
    }

    isInitializing.current = true;
    console.log('[useSessionManagement] Starting session management initialization...');

    try {
      // Get current auth state
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('[useSessionManagement] User authenticated, creating session...');
        
        // Check if user already has an active session
        const existingSession = await getCurrentSession();
        if (existingSession) {
          console.log('[useSessionManagement] User already has active session, skipping creation');
        } else {
          await createUserSession(user.id);
        }
      } else {
        console.log('[useSessionManagement] No authenticated user found');
      }

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        const currentAuthState = `${event}_${session?.user?.id || 'none'}`;
        
        // Prevent duplicate processing
        if (currentAuthState === lastAuthState.current) {
          console.log('[useSessionManagement] Duplicate auth state change, skipping:', currentAuthState);
          return;
        }
        
        lastAuthState.current = currentAuthState;
        console.log('[useSessionManagement] Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[useSessionManagement] User signed in, creating session...');
          
          // Check if user already has an active session
          const existingSession = await getCurrentSession();
          if (existingSession) {
            console.log('[useSessionManagement] User already has active session, skipping creation');
          } else {
            await createUserSession(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[useSessionManagement] User signed out, cleaning up...');
          // Clean up session data
          localStorage.removeItem('classbridge_session_id');
          localStorage.removeItem('classbridge_device_id');
        }
      });

      // Set up periodic session validation
      if (checkInterval > 0) {
        intervalRef.current = setInterval(checkSessionValidity, checkInterval * 60 * 1000);
      }

      // Set up activity monitoring
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, { passive: true });
      });

      hasInitialized.current = true;
      setIsInitialized(true);
      console.log('[useSessionManagement] Session management initialization completed successfully');

    } catch (error) {
      console.error('❌ [useSessionManagement] Initialization failed:', error);
    } finally {
      isInitializing.current = false;
    }
  }, [checkInterval, checkSessionValidity, createUserSession, handleUserActivity]);

  // CRITICAL FIX: Single initialization effect
  useEffect(() => {
    if (!hasInitialized.current) {
      initializeSessionManagement();
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      // Remove event listeners
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [initializeSessionManagement, handleUserActivity]);

  // CRITICAL FIX: Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    isInitialized,
    createUserSession,
    forceLogoutOtherDevices,
    getCurrentSession,
    getActiveSessions,
    endCurrentSession,
    extendSession,
    checkSessionValidity
  }), [
    isInitialized,
    createUserSession,
    forceLogoutOtherDevices,
    getCurrentSession,
    getActiveSessions,
    endCurrentSession,
    extendSession,
    checkSessionValidity
  ]);
}
