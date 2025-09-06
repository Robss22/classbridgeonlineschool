import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qznfggcxumubmjfmudat.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Only throw error at runtime, not during build
if (typeof window === 'undefined' && (!supabaseUrl || !serviceRoleKey)) {
  console.warn('Missing Supabase URL or Service Role Key. Check your environment variables.');
}

// Create server-side Supabase client with service role key
export const createServerClient = (): SupabaseClient => {
  if (!serviceRoleKey) {
    throw new Error('Service role key is required for server-side operations');
  }
  
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
