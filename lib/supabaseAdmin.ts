// src/lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Never expose this in the browser!

if (!serviceRoleKey) {
  throw new Error('Service Role Key missing! Check your .env.local file.');
}

// Configure to avoid token persistence
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false // Prevents storing sessions
  }
});

export default supabaseAdmin;