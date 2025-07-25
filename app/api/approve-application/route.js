// app/api/approve-application/route.js
// This is a Next.js App Router API Route.

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with the service_role key for server-side admin actions.
// This key has full privileges and should NEVER be exposed to the client.
// Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in your .env.local
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { application_id } = await req.json();

    if (!application_id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Invoke your Supabase Edge Function by its name.
    // The `supabaseAdmin.functions.invoke` method handles forming the correct URL
    // and authorizing the call using the service_role key.
    const { data, error } = await supabaseAdmin.functions.invoke('approve-application', {
      body: { application_id: application_id },
      // No need for 'Authorization' header here; the service_role client handles it.
    });

    if (error) {
      console.error("Supabase Edge Function invocation error:", error);
      // Return the error from the Edge Function to the client
      return NextResponse.json({
        error: error.message || 'Failed to invoke Supabase Edge Function',
        details: error.details || 'No additional details.'
      }, {
        status: error.status || 500, // Use the status from the Edge Function error if available
      });
    }

    // If the Edge Function returns data, pass it back to the client
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Next.js API Route processing error:", error);
    // Handle unexpected errors during the API route processing itself
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}