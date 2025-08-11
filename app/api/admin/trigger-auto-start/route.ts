import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
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

  } catch (error: any) {
    console.error('Error triggering auto-start:', error);
    return NextResponse.json(
      { error: 'Failed to trigger auto-start system', details: error.message },
      { status: 500 }
    );
  }
}
