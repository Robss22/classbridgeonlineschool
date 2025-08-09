import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase.types';

// Load Supabase URL and Anon Key from environment variables
// These variables must be prefixed with NEXT_PUBLIC_ to be accessible in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

// --- Important ---
// Supabase Service Role Key (process.env.SUPABASE_SERVICE_ROLE_KEY)
// should ONLY be used in server-side code (e.g., Next.js API Routes, Edge Functions)
// Never expose it directly in client-side JavaScript.
// Your existing code had a floating reference to it, which is now removed.
// ---

// Optional: Add a check for missing environment variables during development
// This helps catch configuration issues early.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL or Anon Key is missing! Please check your .env.local file and ensure you have restarted your development server.'
  );
}

// Debug logging for development
if (typeof window !== 'undefined') {
  console.log('Supabase client initialization:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl?.substring(0, 20) + '...'
  });
}

// Create and export the Supabase client instance
// This client uses the anonymous key and is safe for client-side operations.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);