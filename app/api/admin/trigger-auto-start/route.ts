import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // Check if service role key is properly configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qznfggcxumubmjfmudat.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
  // Create client (kept for parity and future use)
  createClient(supabaseUrl, supabaseServiceKey);

    // Call the Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/auto-start-classes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Edge Function error: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Auto-start system triggered successfully',
      ...result
    });

  } catch (error: unknown) {
    console.error('Error triggering auto-start:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to trigger auto-start system', details: errorMessage },
      { status: 500 }
    );
  }
}
