import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { errorHandler } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const subjectId = searchParams.get('subject_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('live_classes_view')
      .select('*')
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, scheduled_date, start_time, end_time, subject_id, level_id, teacher_id, meeting_platform, max_participants } = body;

    // Validate required fields
    if (!title || !scheduled_date || !start_time || !end_time || !subject_id || !level_id || !teacher_id) {
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
        teacher_id,
        meeting_platform: meeting_platform || 'Zoom',
        max_participants: max_participants || 50,
        status: 'scheduled',
        academic_year: new Date().getFullYear().toString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const appError = errorHandler.handleSupabaseError(error, 'create_live_class', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}
