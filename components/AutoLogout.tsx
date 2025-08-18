'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface AutoLogoutProps {
  timeoutMinutes?: number; // Default: 2 hours 30 minutes
  warningMinutes?: number; // Show warning before logout
  onWarning?: () => void;
  onLogout?: () => void;
}

export default function AutoLogout({
  timeoutMinutes = 150, // 2 hours 30 minutes = 150 minutes
  warningMinutes = 5, // Show warning 5 minutes before logout
  onWarning,
  onLogout
}: AutoLogoutProps) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Reset timers on user activity
  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timer
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000; // Convert to milliseconds
    warningRef.current = setTimeout(() => {
      if (onWarning) {
        onWarning();
      } else {
        // Default warning behavior
        if (confirm('You will be logged out in 5 minutes due to inactivity. Click OK to stay logged in.')) {
          resetTimers(); // Reset if user confirms
        }
      }
    }, warningTime);

    // Set logout timer
    const logoutTime = timeoutMinutes * 60 * 1000; // Convert to milliseconds
    timeoutRef.current = setTimeout(async () => {
      try {
        // Sign out from Supabase
        await supabase.auth.signOut();
        
        if (onLogout) {
          onLogout();
        } else {
          // Default logout behavior
          router.push('/login');
        }
      } catch (error) {
        console.error('Error during auto-logout:', error);
        // Force redirect even if logout fails
        router.push('/login');
      }
    }, logoutTime);
  }, [timeoutMinutes, warningMinutes, onWarning, onLogout, router]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

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

  return null; // This component doesn't render anything
}
