import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { errorHandler } from '@/lib/errorHandler';
import { canStartLiveClass } from '@/utils/timeValidation';

// Generate a random meeting ID for Google Meet using 3-4-3 pattern (e.g., abc-defg-hij)
function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (len: number) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `${rand(3)}-${rand(4)}-${rand(3)}`;
}

// Enhanced platform configuration with security features
const platformConfig = {
  'Jitsi Meet': {
    generateLink: () => `https://meet.jit.si/${generateMeetingId()}`,
    embedConfig: { 
      prejoinPageEnabled: false,
      startWithAudioMuted: true,
      startWithVideoMuted: false,
      disableModeratorIndicator: false,
      enableClosePage: true,
      lobby: {
        enabled: true,
        autoKnock: false
      }
    }
  },
  'Google Meet': {
    generateLink: () => `https://meet.google.com/${generateMeetingId()}`,
    embedConfig: { 
      height: '100%', 
      width: '100%',
      allowMicrophone: true,
      allowCamera: true
    }
  },
  'Zoom': {
    generateLink: () => `https://zoom.us/j/${Math.random().toString(36).substring(2, 15)}`,
    embedConfig: { 
      height: '100%', 
      width: '100%',
      passcode: Math.random().toString(36).substring(2, 8)
    }
  }
};

// Generate a meeting link based on platform with enhanced security
function generateMeetingLink(platform: string = 'Jitsi Meet'): { link: string, platform: string, config: Record<string, unknown> } {
  const platformKey = (platform || 'Jitsi Meet').toLowerCase();
  
  switch (platformKey) {
    case 'jitsi':
    case 'jitsi meet': {
      const config = platformConfig['Jitsi Meet'];
      return {
        link: config.generateLink(),
        platform: 'Jitsi Meet',
        config: config.embedConfig
      };
    }
    case 'google meet':
    case 'google': {
      const googleConfig = platformConfig['Google Meet'];
      return {
        link: googleConfig.generateLink(),
        platform: 'Google Meet',
        config: googleConfig.embedConfig
      };
    }
    case 'zoom': {
      const zoomConfig = platformConfig['Zoom'];
      return {
        link: zoomConfig.generateLink(),
        platform: 'Zoom',
        config: zoomConfig.embedConfig
      };
    }
    default: {
      const defaultConfig = platformConfig['Jitsi Meet'];
      return {
        link: defaultConfig.generateLink(),
        platform: 'Jitsi Meet',
        config: defaultConfig.embedConfig
      };
    }
  }
}

interface LiveClass {
  created_at?: string | null;
  created_by?: string | null;
  description?: string | null;
  end_time?: string | null;
  live_class_id?: string;
  meeting_link?: string | null;
  scheduled_date?: string | null;
  start_time?: string | null;
  subject_id?: string | null;
  title?: string | null;
  status?: string | null;
  level_id?: string | null;
  program_id?: string | null;
  paper_id?: string | null;
  teacher_id?: string | null;
  meeting_platform?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  pre_class_buffer?: number | null;
  max_participants?: number | null;
  meeting_password?: string | null;
  recording_enabled?: boolean | null;
  waiting_room_enabled?: boolean | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const subjectId = searchParams.get('subject_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('live_classes')
      .select(`
        *,
        subjects:subject_id (name),
        levels:level_id (name),
        teachers:teacher_id (teacher_id, users:user_id (first_name, last_name))
      `)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const appError = errorHandler.handleSupabaseError(error, 'fetch_live_classes', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Live class ID is required', success: false },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required', success: false },
        { status: 400 }
      );
    }

    // If trying to start a class, validate the time first
    if (status === 'ongoing') {
      // Get the live class details to check scheduled time
      const { data: liveClassData, error: fetchError } = await supabase
        .from('live_classes')
        .select('scheduled_date, start_time, end_time')
        .eq('live_class_id', id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Failed to fetch live class details', success: false },
          { status: 500 }
        );
      }

      if (liveClassData && liveClassData.scheduled_date) {
        const validation = canStartLiveClass(liveClassData.scheduled_date || '', liveClassData.start_time || '', liveClassData.end_time || '', false);
        
        if (!validation.canStart) {
          return NextResponse.json(
            { error: validation.reason, success: false },
            { status: 400 }
          );
        }
      }
    }

    // Update the live class status
    const { data, error } = await supabase
      .from('live_classes')
      .update({ 
        status,
        ...(status === 'ongoing' ? { started_at: new Date().toISOString() } : {}),
        ...(status === 'completed' ? { ended_at: new Date().toISOString() } : {})
      } as LiveClass)
      .eq('live_class_id', id)
      .select()
      .single();

    // Supabase update result
    if (error) throw error;

    // Send notifications based on status change
    if (status === 'ongoing') {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/live-class`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            live_class_id: id,
            type: 'class_starting',
            recipients: 'both'
          })
        });
      } catch (notifError) {
        console.warn('Failed to send class starting notification:', notifError);
      }
    }

    // If class is being completed, terminate the meeting
    if (status === 'completed') {
      try {
        // Class completed, terminating meeting
        
        // Terminate the meeting
        const terminationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/live-classes/terminate-meeting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            live_class_id: id,
            force_disconnect: true // Force disconnect all participants
          })
        });

        if (terminationResponse.ok) {
          await terminationResponse.json();
          // Meeting terminated successfully
        } else {
          // Failed to terminate meeting
        }
      } catch {
        // Failed to terminate meeting
        // Don't fail the entire request if meeting termination fails
      }
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const appError = errorHandler.handleSupabaseError(error, 'update_live_class', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}

// Explicitly use the LiveClass type in the POST function
// Define response types
type LiveClassResponse = {
  data?: LiveClass;
  error?: string;
  success: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<LiveClassResponse>> {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      scheduled_date, 
      start_time, 
      end_time, 
      subject_id, 
      level_id, 
      program_id,
      paper_id,
      teacher_id, 
      meeting_platform, 
      meeting_link,
      status,
      pre_class_buffer = 15, // Default 15-minute buffer
      max_participants = 50,
      recording_enabled = false,
      waiting_room_enabled = true
    } = body;

    // Create live class request body

    // Validate required fields
    if (!title || !scheduled_date || !start_time || !end_time || !subject_id || !level_id || !teacher_id || !program_id) {
      // Missing required fields
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      );
    }

    // Auto-generate meeting link if not provided
    const shouldGenerate = !meeting_link || String(meeting_link).trim().length === 0;
    const generated = shouldGenerate ? generateMeetingLink(meeting_platform || 'Jitsi Meet') : null;

    // Generate meeting password for security
    const meeting_password = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('live_classes')
      .insert([{
        title,
        description,
        scheduled_date,
        start_time,
        end_time,
        subject_id,
        level_id,
        program_id,
        paper_id,
        teacher_id,
        meeting_platform: generated?.platform || meeting_platform || 'Jitsi Meet',
        meeting_link: generated?.link || meeting_link || '',
        meeting_password,
        status: status || 'scheduled',
        pre_class_buffer,
        max_participants,
        recording_enabled,
        waiting_room_enabled
      }])
      .select()
      .single();

    // Supabase insert result
    if (error) throw error;

    // Schedule notifications (only if app URL is configured)
    if (data && process.env.NEXT_PUBLIC_APP_URL) {
      try {
        const notify = async (delayMs: number, type: string) => {
          setTimeout(async () => {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/live-class`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  live_class_id: data.live_class_id,
                  type,
                  recipients: 'both'
                })
              });
            } catch {
              // avoid crashing server on missing URL in dev
            }
          }, delayMs);
        };

        await notify(30 * 60 * 1000, 'reminder_30min');
        await notify(5 * 60 * 1000, 'reminder_5min');
      } catch {
        // Ignore notification scheduling errors
      }
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const appError = errorHandler.handleSupabaseError(error, 'create_live_class', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}
