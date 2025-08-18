'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AUTO_LOGOUT_CONFIG } from '@/config/autoLogout';

interface GlobalAutoLogoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  excludedPaths?: readonly string[];
}

export default function GlobalAutoLogout({
  timeoutMinutes = AUTO_LOGOUT_CONFIG.TIMEOUT_MINUTES,
  warningMinutes = AUTO_LOGOUT_CONFIG.WARNING_MINUTES,
  excludedPaths = AUTO_LOGOUT_CONFIG.EXCLUDED_PATHS
}: GlobalAutoLogoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Check if current path should be excluded from auto-logout
  const isExcludedPath = excludedPaths.some(path => pathname.startsWith(path));

  // Reset timers on user activity
  const resetTimers = useCallback(() => {
    if (isExcludedPath) return; // Don't set timers on excluded paths
    
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timer
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000; // Convert to milliseconds
    warningRef.current = setTimeout(() => {
      // Show warning dialog
      if (confirm(AUTO_LOGOUT_CONFIG.WARNING_MESSAGE)) {
        resetTimers(); // Reset if user confirms
      }
    }, warningTime);

    // Set logout timer
    const logoutTime = timeoutMinutes * 60 * 1000; // Convert to milliseconds
    timeoutRef.current = setTimeout(async () => {
      try {
        // Sign out from Supabase
        await supabase.auth.signOut();
        router.push(AUTO_LOGOUT_CONFIG.LOGOUT_REDIRECT_PATH);
      } catch (error) {
        console.error('Error during auto-logout:', error);
        // Force redirect even if logout fails
        router.push(AUTO_LOGOUT_CONFIG.LOGOUT_REDIRECT_PATH);
      }
    }, logoutTime);
  }, [timeoutMinutes, warningMinutes, isExcludedPath, router]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Set up activity listeners
  useEffect(() => {
    // Don't set up listeners on excluded paths
    if (isExcludedPath) return;

    // Add event listeners
    AUTO_LOGOUT_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    resetTimers();

    // Cleanup function
    return () => {
      AUTO_LOGOUT_CONFIG.ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [handleActivity, resetTimers, isExcludedPath]);

  // Check if user is still authenticated (only on protected paths)
  useEffect(() => {
    if (isExcludedPath) return;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // User is not authenticated, redirect to login
        router.push(AUTO_LOGOUT_CONFIG.LOGOUT_REDIRECT_PATH);
      }
    };

    // Check auth status every 5 minutes
    const authCheckInterval = setInterval(checkAuth, AUTO_LOGOUT_CONFIG.SESSION_CHECK_INTERVAL_MINUTES * 60 * 1000);
    
    return () => clearInterval(authCheckInterval);
  }, [router, isExcludedPath]);

  // Reset timers when pathname changes
  useEffect(() => {
    resetTimers();
  }, [pathname, resetTimers]);

  return null; // This component doesn't render anything
}
