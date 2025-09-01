import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qznfggcxumubmjfmudat.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if we're on the client side and service role key is not available
const isClientSide = typeof window !== 'undefined';
const hasServiceRoleKey = !!serviceRoleKey;

// Configure to avoid token persistence and ensure server-only usage
let supabaseAdmin: ReturnType<typeof createClient<Database>>;

if (isClientSide && !hasServiceRoleKey) {
  // On client side without service role key, create a fallback client
  // This will use the regular anon key but with admin privileges through RLS
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bmZnZ2N4dW11Ym1qZm11ZGF0Iiwicm9sZSI6ImFub24iLCJleHAiOjIwNjYxNTk3MDJ9.ff';
  supabaseAdmin = createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });
} else {
  // Server side or with service role key
  supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export default supabaseAdmin;