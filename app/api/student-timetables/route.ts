import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { errorHandler } from '@/lib/errorHandler';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    
    const studentId = searchParams.get('student_id');
    const timetableId = searchParams.get('timetable_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('student_timetables')
      .select(`
        *,
        timetables:timetable_id (
          *,
          levels:level_id (name),
          subjects:subject_id (name),
          teachers:teacher_id (teacher_id, users:user_id (first_name, last_name))
        ),
        users:student_id (first_name, last_name, email)
      `);

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (timetableId) {
      query = query.eq('timetable_id', timetableId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at');

    if (error) {
      throw errorHandler.createError('DATABASE_ERROR', 'Failed to fetch student timetables', error as unknown as Record<string, unknown>);
    }

    // Cache the results
    const cacheKey = `student_timetables:${studentId || 'all'}:${timetableId || 'all'}:${status || 'all'}`;
    cache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const errorResponse = errorHandler.handleSupabaseError(error, 'fetch_student_timetables');
    return NextResponse.json({ error: errorResponse.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['student_id', 'timetable_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        throw errorHandler.createError('VALIDATION_ERROR', `Missing required field: ${field}`);
      }
    }

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('student_timetables')
      .select('id')
      .eq('student_id', body.student_id)
      .eq('timetable_id', body.timetable_id)
      .single();

    if (existing) {
      throw errorHandler.createError('VALIDATION_ERROR', 'Student is already assigned to this timetable');
    }

    // Verify timetable exists and is active
    const { data: timetable, error: timetableError } = await supabase
      .from('timetables')
      .select('timetable_id, is_active')
      .eq('timetable_id', body.timetable_id)
      .single();

    if (timetableError || !timetable) {
      throw errorHandler.createError('NOT_FOUND', 'Timetable not found');
    }

    if (!timetable.is_active) {
      throw errorHandler.createError('VALIDATION_ERROR', 'Cannot assign student to inactive timetable');
    }

    const { data, error } = await supabase
      .from('student_timetables')
      .insert({
        student_id: body.student_id,
        timetable_id: body.timetable_id,
        enrollment_date: body.enrollment_date || new Date().toISOString().split('T')[0],
        status: body.status || 'active',
      })
      .select(`
        *,
        timetables:timetable_id (
          *,
          levels:level_id (name),
          subjects:subject_id (name),
          teachers:teacher_id (teacher_id, users:user_id (first_name, last_name))
        ),
        users:student_id (first_name, last_name, email)
      `)
      .single();

    if (error) {
      throw errorHandler.createError('DATABASE_ERROR', 'Failed to create student timetable assignment', error as unknown as Record<string, unknown>);
    }

    // Clear related caches
    // cache.delete(cache.keys.studentTimetables(body.student_id));
    // cache.delete(cache.keys.studentTimetableView(body.student_id));

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    const errorResponse = errorHandler.handleSupabaseError(error, 'create_student_timetable');
    return NextResponse.json({ error: errorResponse.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      throw errorHandler.createError('VALIDATION_ERROR', 'Assignment ID is required');
    }

    // Check if assignment exists
    const { data: existing, error: fetchError } = await supabase
      .from('student_timetables')
      .select('student_id, timetable_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !existing) {
      throw errorHandler.createError('NOT_FOUND', 'Student timetable assignment not found');
    }

    const { data, error } = await supabase
      .from('student_timetables')
      .update({
        enrollment_date: body.enrollment_date,
        status: body.status,
      })
      .eq('id', assignmentId)
      .select(`
        *,
        timetables:timetable_id (
          *,
          levels:level_id (name),
          subjects:subject_id (name),
          teachers:teacher_id (teacher_id, users:user_id (first_name, last_name))
        ),
        users:student_id (first_name, last_name, email)
      `)
      .single();

    if (error) {
      throw errorHandler.createError('DATABASE_ERROR', 'Failed to update student timetable assignment', error as unknown as Record<string, unknown>);
    }

    // Clear related caches
    // cache.delete(cache.keys.studentTimetables(existing.student_id));
    // cache.delete(cache.keys.studentTimetableView(existing.student_id));

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const errorResponse = errorHandler.handleSupabaseError(error, 'update_student_timetable');
    return NextResponse.json({ error: errorResponse.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      throw errorHandler.createError('VALIDATION_ERROR', 'Assignment ID is required');
    }

    // Get student_id before deletion for cache clearing
    const { data: existing, error: fetchError } = await supabase
      .from('student_timetables')
      .select('student_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !existing) {
      throw errorHandler.createError('NOT_FOUND', 'Student timetable assignment not found');
    }

    const { error } = await supabase
      .from('student_timetables')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      throw errorHandler.createError('DATABASE_ERROR', 'Failed to delete student timetable assignment', error as unknown as Record<string, unknown>);
    }

    // Clear related caches
    // cache.delete(cache.keys.studentTimetables(existing.student_id));
    // cache.delete(cache.keys.studentTimetableView(existing.student_id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorResponse = errorHandler.handleSupabaseError(error, 'delete_student_timetable');
    return NextResponse.json({ error: errorResponse.message }, { status: 500 });
  }
}
