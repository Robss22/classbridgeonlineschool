import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { errorHandler } from '@/lib/errorHandler';

export async function POST() {
  try {
    const now = new Date();
    
    // Update classes that should be ongoing
    const { error: ongoingError } = await supabase
      .from('live_classes')
      .update({ 
        status: 'ongoing',
        started_at: now.toISOString()
      } as any)
      .eq('status', 'scheduled')
      .lte('scheduled_date', now.toISOString().split('T')[0])
      .lte('start_time', now.toTimeString().split(' ')[0])
      .gte('end_time', now.toTimeString().split(' ')[0]);

    if (ongoingError) {
      console.error('Error updating ongoing classes:', ongoingError);
      // Don't throw error, continue with completion check
    }

    // Update classes that should be completed
    const { error: completedError } = await supabase
      .from('live_classes')
      .update({ 
        status: 'completed',
        ended_at: now.toISOString()
      } as any)
      .eq('status', 'ongoing')
      .or(`scheduled_date.lt.${now.toISOString().split('T')[0]},and(scheduled_date.eq.${now.toISOString().split('T')[0]},end_time.lt.${now.toTimeString().split(' ')[0]})`);

    if (completedError) {
      console.error('Error updating completed classes:', completedError);
      // Don't throw error, return success with warnings
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Status updates completed',
      timestamp: now.toISOString(),
      ongoingError: ongoingError?.message || null,
      completedError: completedError?.message || null
    });
  } catch (error) {
    const appError = errorHandler.handleSupabaseError(error, 'auto_status_update', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}
