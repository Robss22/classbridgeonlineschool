import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase.types';

// Load Supabase URL and Anon Key from environment variables
// These variables must be prefixed with NEXT_PUBLIC_ to be accessible in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qznfggcxumubmjfmudat.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bmZnZ2N4dW11Ym1qZm11ZGF0Iiwicm9sZSI6ImFub24iLCJleHAiOjIwNjYxNTk3MDJ9.ff';

// Enhanced validation and debugging for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  // Missing required environment variables
  // Current environment state
  
  throw new Error(
    `Supabase configuration is incomplete! Missing: ${missingVars.join(', ')}. ` +
    'Please check your .env.local file and ensure you have restarted your development server.'
  );
}

// Debug logging for development
if (typeof window !== 'undefined') {
  // Supabase client initialization
}

// Create and export the Supabase client instance
// This client uses the anonymous key and is safe for client-side operations.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Health check function to test database connectivity
export const checkDatabaseHealth = async () => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      return { healthy: false, error: error.message };
    }
    return { healthy: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { healthy: false, error: errorMessage };
  }
};

// Test the connection on client side
if (typeof window !== 'undefined') {
  // Test connection after a short delay
  setTimeout(async () => {
    try {
      // Testing Supabase connection
      const { error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        // Supabase connection test failed
      } else {
        // Supabase connection test successful
      }
    } catch {
      // Supabase connection test error
    }
  }, 1000);
}