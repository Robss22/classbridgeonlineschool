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
function generateMeetingLink(platform: string = 'Google Meet'): { link: string, platform: string } {
  switch (platform.toLowerCase()) {
    case 'google meet':
    case 'google':
      return {
        link: `https://meet.google.com/${generateMeetingId()}`,
        platform: 'Google Meet'
      }
    case 'zoom':
      // Generate a random Zoom meeting ID (10 digits)
      const zoomId = Math.floor(Math.random() * 9000000000) + 1000000000
      return {
        link: `https://zoom.us/j/${zoomId}`,
        platform: 'Zoom'
      }
    case 'teams':
      // Microsoft Teams uses a different format
      const teamsId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      return {
        link: `https://teams.microsoft.com/l/meetup-join/${teamsId}`,
        platform: 'Microsoft Teams'
      }
    default:
      // Default to Google Meet
      return {
        link: `https://meet.google.com/${generateMeetingId()}`,
        platform: 'Google Meet'
      }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { live_class_id, platform = 'Google Meet' } = body;

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
