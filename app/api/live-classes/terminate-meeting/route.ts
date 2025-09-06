import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MeetingTerminationService } from '@/lib/services/meetingTerminationService';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qznfggcxumubmjfmudat.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey || 'fallback-key');

export async function POST(request: NextRequest) {
  try {
    // Check if service role key is properly configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { live_class_id, force_disconnect = false } = body;

    if (!live_class_id) {
      return NextResponse.json(
        { error: 'Live class ID is required', success: false },
        { status: 400 }
      );
    }

    // Terminate meeting for live class

    let terminationResult;

    if (force_disconnect) {
      // Force disconnect all participants and terminate meeting
      terminationResult = await MeetingTerminationService.forceDisconnectParticipants(live_class_id);
    } else {
      // Simple class ending without complex participant tracking
      terminationResult = await MeetingTerminationService.endClassSimple(live_class_id);
    }

    if (terminationResult.success) {
      // The service already updates the live class status, so we don't need to do it again here
      // Success logging removed for production

      return NextResponse.json({
        success: true,
        message: terminationResult.message,
        data: {
          live_class_id,
          platform: terminationResult.platform,
          meeting_id: terminationResult.meetingId,
          terminated_at: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { 
          error: terminationResult.message, 
          success: false 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to terminate meeting', 
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const live_class_id = searchParams.get('live_class_id');

    if (!live_class_id) {
      return NextResponse.json(
        { error: 'Live class ID is required', success: false },
        { status: 400 }
      );
    }

    // Get meeting status and termination info
    const { data: liveClass, error: fetchError } = await supabase
      .from('live_classes')
      .select('title, status, meeting_platform, meeting_link, meeting_terminated_at, meeting_status')
      .eq('live_class_id', live_class_id)
      .single();

    if (fetchError || !liveClass) {
      return NextResponse.json(
        { error: 'Live class not found', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        live_class_id,
        title: liveClass.title,
        status: liveClass.status,
        platform: liveClass.meeting_platform,
        meeting_link: liveClass.meeting_link,
        terminated_at: liveClass.meeting_terminated_at,
        meeting_status: liveClass.meeting_status
      }
    });
  } catch {
    return NextResponse.json(
      { 
        error: 'Failed to get meeting status', 
        success: false 
      },
      { status: 500 }
    );
  }
}
