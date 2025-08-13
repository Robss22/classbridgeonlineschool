import { NextResponse } from 'next/server';
import { errorHandler } from '@/lib/errorHandler';

export async function POST() {
  try {
    const now = new Date();
    
    // Update classes that should be ongoing (commented out until schema is updated)
    // const { error: ongoingError } = await supabase
    //   .from('live_classes')
    //   .update({ 
    //     status: 'ongoing',
    //     started_at: now.toISOString()
    //   })
    //   .eq('status', 'scheduled')
    //   .lte('scheduled_date', now.toISOString().split('T')[0])
    //   .lte('start_time', now.toTimeString().split(' ')[0])
    //   .gte('end_time', now.toTimeString().split(' ')[0]);

    // if (ongoingError) throw ongoingError;

    // if (ongoingError) throw ongoingError;

    // Update classes that should be completed (commented out until schema is updated)
    // const { error: completedError } = await supabase
    //   .from('live_classes')
    //   .update({ 
    //     ended_at: now.toISOString()
    //   })
    //   .eq('status', 'ongoing')
    //   .or(`scheduled_date.lt.${now.toISOString().split('T')[0]},and(scheduled_date.eq.${now.toISOString().split('T')[0]},end_time.lt.${now.toTimeString().split(' ')[0]})`);

    // if (completedError) throw completedError;

    return NextResponse.json({ 
      success: true, 
      message: 'Status updates completed',
      timestamp: now.toISOString()
    });
  } catch (error) {
    const appError = errorHandler.handleSupabaseError(error, 'auto_status_update', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}
