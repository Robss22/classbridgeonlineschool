import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { errorHandler } from '@/lib/errorHandler';

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

    console.log('[API] Supabase update result:', { data, error });
    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('[API] Error in PUT /api/live-classes:', error);
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
      status 
    } = body;

    console.log('[API] POST /api/live-classes body:', body);

    // Validate required fields
    if (!title || !scheduled_date || !start_time || !end_time || !subject_id || !level_id || !teacher_id || !program_id) {
      console.error('[API] Missing required fields', { title, scheduled_date, start_time, end_time, subject_id, level_id, teacher_id, program_id });
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      );
    }

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
        meeting_platform: meeting_platform || 'Google Meet',
        meeting_link: meeting_link || '',
        status: status || 'scheduled'
      }])
      .select()
      .single();

    console.log('[API] Supabase insert result:', { data, error });
    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('[API] Error in POST /api/live-classes:', error);
    const appError = errorHandler.handleSupabaseError(error, 'create_live_class', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}
