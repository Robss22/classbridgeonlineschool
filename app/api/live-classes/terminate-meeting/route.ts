import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MeetingTerminationService } from '@/lib/services/meetingTerminationService';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { live_class_id, force_disconnect = false } = body;

    if (!live_class_id) {
      return NextResponse.json(
        { error: 'Live class ID is required', success: false },
        { status: 400 }
      );
    }

    console.log(`[API] Terminating meeting for live class: ${live_class_id}`);

    let terminationResult;

    if (force_disconnect) {
      // Force disconnect all participants and terminate meeting
      terminationResult = await MeetingTerminationService.forceDisconnectParticipants(live_class_id);
    } else {
      // Normal meeting termination
      terminationResult = await MeetingTerminationService.terminateMeeting(live_class_id);
    }

    if (terminationResult.success) {
      // Update the live class status to completed if not already
      const { error: updateError } = await supabase
        .from('live_classes')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('live_class_id', live_class_id);

      if (updateError) {
        console.warn('Failed to update live class status:', updateError);
      }

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
    console.error('[API] Error terminating meeting:', error);
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
  } catch (error) {
    console.error('[API] Error getting meeting status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get meeting status', 
        success: false 
      },
      { status: 500 }
    );
  }
}
