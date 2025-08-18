'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UseAutoLogoutOptions {
  timeoutMinutes?: number; // Default: 2 hours 30 minutes
  warningMinutes?: number; // Show warning before logout
  enableWarning?: boolean; // Whether to show warning modal
}

export function useAutoLogout({
  timeoutMinutes = 150, // 2 hours 30 minutes = 150 minutes
  warningMinutes = 5, // Show warning 5 minutes before logout
  enableWarning = true
}: UseAutoLogoutOptions = {}) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(warningMinutes);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Reset timers on user activity
  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timer
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000; // Convert to milliseconds
    warningRef.current = setTimeout(() => {
      if (enableWarning) {
        setShowWarning(true);
        setRemainingMinutes(warningMinutes);
      }
    }, warningTime);

    // Set logout timer
    const logoutTime = timeoutMinutes * 60 * 1000; // Convert to milliseconds
    timeoutRef.current = setTimeout(async () => {
      try {
        // Sign out from Supabase
        await supabase.auth.signOut();
        router.push('/login');
      } catch (error) {
        console.error('Error during auto-logout:', error);
        // Force redirect even if logout fails
        router.push('/login');
      }
    }, logoutTime);
  }, [timeoutMinutes, warningMinutes, enableWarning, router]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Handle staying logged in
  const handleStayLoggedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Handle immediate logout
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/login');
    }
  }, [router]);

  // Set up activity listeners
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    resetTimers();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [handleActivity, resetTimers]);

  // Check if user is still authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // User is not authenticated, redirect to login
        router.push('/login');
      }
    };

    // Check auth status every 5 minutes
    const authCheckInterval = setInterval(checkAuth, 5 * 60 * 1000);
    
    return () => clearInterval(authCheckInterval);
  }, [router]);

  return {
    showWarning,
    remainingMinutes,
    onStayLoggedIn: handleStayLoggedIn,
    onLogout: handleLogout
  };
}
