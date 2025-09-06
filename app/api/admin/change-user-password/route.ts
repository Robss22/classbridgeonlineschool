import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use fallback values to prevent build errors
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qznfggcxumubmjfmudat.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create client with fallback handling
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || 'fallback-key');

export async function POST(request: NextRequest) {
  try {
    // Check if service role key is properly configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const { userId, newPassword } = await request.json();
    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'User ID and password (min 6 chars) required.' }, { status: 400 });
    }
    // Update password using Supabase Auth Admin API
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 