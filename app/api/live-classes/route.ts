import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { errorHandler } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subject_id');

    let query = supabase
      .from('live_classes')
      .select(`
        *,
        subjects:subject_id (name),
        levels:level_id (name)
      `)
      .order('created_at', { ascending: false });

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
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
    const { start_time, end_time, subject_id, level_id, program_id } = body;

    // Validate required fields
    if (!start_time || !end_time || !subject_id || !level_id || !program_id) {
      return NextResponse.json(
        { error: 'Missing required fields: start_time, end_time, subject_id, level_id, program_id', success: false },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('live_classes')
      .insert([{
        start_time,
        end_time,
        subject_id,
        level_id,
        program_id,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing live class ID', success: false },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('live_classes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const appError = errorHandler.handleSupabaseError(error, 'delete_live_class', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}
