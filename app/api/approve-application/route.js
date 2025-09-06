// app/api/approve-application/route.js
// This is a Next.js App Router API Route.

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with the service_role key for server-side admin actions.
// This key has full privileges and should NEVER be exposed to the client.
// Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in your .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qznfggcxumubmjfmudat.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'fallback-key');

export async function POST(req) {
  try {
    // Check if service role key is properly configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const { application_id } = await req.json();

    if (!application_id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Invoke Edge Function
    const { data, error } = await supabaseAdmin.functions.invoke('approve-application', {
      body: { application_id: application_id },
    });

    if (error) {
      // Try to get more detailed error information
      let errorDetails = 'No additional details.';
      let errorStatus = 500;
      
      if (error.message) {
        errorDetails = error.message;
      }
      
      if (error.status) {
        errorStatus = error.status;
      }
      
      // Return the error from the Edge Function to the client
      return NextResponse.json({
        error: 'Edge Function returned a non-2xx status code',
        details: errorDetails,
        status: errorStatus,
        context: 'approve-application',
        timestamp: new Date().toISOString()
      }, {
        status: errorStatus,
      });
    }

    // Edge Function successful

    // If the Edge Function returns data, pass it back to the client
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    // Next.js API Route processing error
    // Handle unexpected errors during the API route processing itself
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      context: 'api-route-error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}