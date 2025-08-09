import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorHandler } from '@/lib/errorHandler';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const teacherId = searchParams.get('teacher_id');
    const levelId = searchParams.get('level_id');
    const subjectId = searchParams.get('subject_id');
    const academicYear = searchParams.get('academic_year');
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('timetables')
      .select(`
        *,
        levels:level_id (name),
        subjects:subject_id (name),
        teachers:teacher_id (teacher_id, users:user_id (first_name, last_name))
      `);

    // Apply filters
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (levelId) {
      query = query.eq('level_id', levelId);
    }
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query.order('day_of_week, start_time');

    if (error) {
      throw errorHandler.createError('DATABASE_ERROR', 'Failed to fetch timetables', error);
    }

    // Cache the results
    const cacheKey = `timetables:${teacherId || 'all'}:${levelId || 'all'}:${subjectId || 'all'}:${academicYear || 'all'}`;
    cache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const errorResponse = errorHandler.handleSupabaseError(error, 'fetch_timetables');
    return NextResponse.json({ error: errorResponse.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['level_id', 'subject_id', 'teacher_id', 'day_of_week', 'start_time', 'end_time', 'academic_year'];
    for (const field of requiredFields) {
      if (!body[field]) {
        throw errorHandler.createError('VALIDATION_ERROR', `Missing required field: ${field}`);
      }
    }

    // Validate time format and logic
    const startTime = new Date(`2000-01-01T${body.start_time}`);
    const endTime = new Date(`2000-01-01T${body.end_time}`);
    
    if (startTime >= endTime) {
      throw errorHandler.createError('VALIDATION_ERROR', 'End time must be after start time');
    }

    // Check for teacher conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from('timetables')
      .select('timetable_id')
      .eq('teacher_id', body.teacher_id)
      .eq('day_of_week', body.day_of_week)
      .eq('is_active', true)
      .or(`start_time.lt.${body.end_time},end_time.gt.${body.start_time}`);

    if (conflictError) {
      throw errorHandler.createError('DATABASE_ERROR', 'Failed to check for conflicts', conflictError);
    }

    if (conflicts && conflicts.length > 0) {
      throw errorHandler.createError('VALIDATION_ERROR', 'Teacher has conflicting timetable entry');
    }

    const { data, error } = await supabase
      .from('timetables')
      .insert({
        level_id: body.level_id,
        subject_id: body.subject_id,
        teacher_id: body.teacher_id,
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
        room_name: body.room_name,
        meeting_platform: body.meeting_platform || 'Zoom',
        meeting_link: body.meeting_link,
        meeting_id: body.meeting_id,
        meeting_password: body.meeting_password,
        is_active: body.is_active !== false,
        academic_year: body.academic_year,
      })
      .select()
      .single();

    if (error) {
      throw errorHandler.createError('DATABASE_ERROR', 'Failed to create timetable', error);
    }

    // Clear related caches
    // cache.delete(cache.keys.timetables());
    // cache.delete(cache.keys.teacherTimetables(body.teacher_id));

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    const errorResponse = errorHandler.handleSupabaseError(error, 'create_timetable');
    return NextResponse.json({ error: errorResponse.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const timetableId = searchParams.get('id');

    if (!timetableId) {
      throw errorHandler.createError('VALIDATION_ERROR', 'Timetable ID is required');
    }

    // Check if timetable exists
    const { data: existing, error: fetchError } = await supabase
      .from('timetables')
      .select('teacher_id')
      .eq('timetable_id', timetableId)
      .single();

    if (fetchError || !existing) {
      throw errorHandler.createError('NOT_FOUND', 'Timetable not found');
    }

    // Validate time format if provided
    if (body.start_time && body.end_time) {
      const startTime = new Date(`2000-01-01T${body.start_time}`);
      const endTime = new Date(`2000-01-01T${body.end_time}`);
      
      if (startTime >= endTime) {
        throw errorHandler.createError('VALIDATION_ERROR', 'End time must be after start time');
      }
    }

    // Check for conflicts if time/day is being changed
    if (body.start_time || body.end_time || body.day_of_week) {
      const { data: conflicts, error: conflictError } = await supabase
        .from('timetables')
        .select('timetable_id')
        .eq('teacher_id', existing.teacher_id)
        .eq('day_of_week', body.day_of_week || existing.day_of_week)
        .neq('timetable_id', timetableId)
        .eq('is_active', true)
        .or(`start_time.lt.${body.end_time || existing.end_time},end_time.gt.${body.start_time || existing.start_time}`);

      if (conflictError) {
        throw errorHandler.createError('DATABASE_ERROR', 'Failed to check for conflicts', conflictError);
      }

      if (conflicts && conflicts.length > 0) {
        throw errorHandler.createError('VALIDATION_ERROR', 'Teacher has conflicting timetable entry');
      }
    }

    const { data, error } = await supabase
      .from('timetables')
      .update({
        level_id: body.level_id,
        subject_id: body.subject_id,
        teacher_id: body.teacher_id,
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
        room_name: body.room_name,
        meeting_platform: body.meeting_platform,
        meeting_link: body.meeting_link,
        meeting_id: body.meeting_id,
        meeting_password: body.meeting_password,
        is_active: body.is_active,
        academic_year: body.academic_year,
      })
      .eq('timetable_id', timetableId)
      .select()
      .single();

    if (error) {
      throw errorHandler.createError('DATABASE_ERROR', 'Failed to update timetable', error);
    }

    // Clear related caches
    // cache.delete(cache.keys.timetables());
    // cache.delete(cache.keys.teacherTimetables(existing.teacher_id));

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const errorResponse = errorHandler.handleSupabaseError(error, 'update_timetable');
    return NextResponse.json({ error: errorResponse.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const timetableId = searchParams.get('id');

    if (!timetableId) {
      throw errorHandler.createError('VALIDATION_ERROR', 'Timetable ID is required');
    }

    // Get teacher_id before deletion for cache clearing
    const { data: existing, error: fetchError } = await supabase
      .from('timetables')
      .select('teacher_id')
      .eq('timetable_id', timetableId)
      .single();

    if (fetchError || !existing) {
      throw errorHandler.createError('NOT_FOUND', 'Timetable not found');
    }

    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('timetable_id', timetableId);

    if (error) {
      throw errorHandler.createError('DATABASE_ERROR', 'Failed to delete timetable', error);
    }

    // Clear related caches
    // cache.delete(cache.keys.timetables());
    // cache.delete(cache.keys.teacherTimetables(existing.teacher_id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorResponse = errorHandler.handleSupabaseError(error, 'delete_timetable');
    return NextResponse.json({ error: errorResponse.message }, { status: 500 });
  }
}
