import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { errorHandler } from '@/lib/errorHandler';

// Generate a random meeting ID for Google Meet using 3-4-3 pattern (e.g., abc-defg-hij)
function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (len: number) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `${rand(3)}-${rand(4)}-${rand(3)}`;
}

// Generate a meeting link based on platform
// To ensure links are joinable without provider APIs, default to Jitsi Meet.
function generateMeetingLink(platform: string = 'Jitsi Meet'): { link: string, platform: string } {
  switch ((platform || 'Jitsi Meet').toLowerCase()) {
    case 'jitsi':
    case 'jitsi meet':
      return {
        link: `https://meet.jit.si/${generateMeetingId()}`,
        platform: 'Jitsi Meet'
      }
    case 'google meet':
    case 'google':
    case 'zoom':
    case 'teams':
      // Fallback to Jitsi unless proper provider integration exists
      return {
        link: `https://meet.jit.si/${generateMeetingId()}`,
        platform: 'Jitsi Meet'
      }
    default:
      return {
        link: `https://meet.jit.si/${generateMeetingId()}`,
        platform: 'Jitsi Meet'
      }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { live_class_id, platform = 'Jitsi Meet' } = body;

    if (!live_class_id) {
      return NextResponse.json(
        { error: 'Live class ID is required', success: false },
        { status: 400 }
      );
    }

    // Generate new meeting link
    const generatedMeeting = generateMeetingLink(platform);
    
    // Update the live class with the new meeting link
    const { data, error } = await supabase
      .from('live_classes')
      .update({ 
        meeting_link: generatedMeeting.link,
        meeting_platform: generatedMeeting.platform
      })
      .eq('live_class_id', live_class_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      data, 
      success: true,
      message: `Generated new ${generatedMeeting.platform} meeting link`,
      meeting_link: generatedMeeting.link,
      meeting_platform: generatedMeeting.platform
    });
  } catch (error) {
    console.error('[API] Error generating meeting link:', error);
    const appError = errorHandler.handleSupabaseError(error, 'generate_meeting_link', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}
