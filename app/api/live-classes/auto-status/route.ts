import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClassStatus } from '@/utils/timeValidation';

export async function POST(request: NextRequest) {
  try {
    // Check if service role key is properly configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const supabase = createServerClient();
    
    // Get all live classes that are not already completed, cancelled, or ongoing
    const { data: liveClasses, error } = await supabase
      .from('live_classes')
      .select('*')
      .in('status', ['scheduled'])
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching live classes:', error);
      return NextResponse.json({ error: 'Failed to fetch live classes' }, { status: 500 });
    }

    if (!liveClasses || liveClasses.length === 0) {
      return NextResponse.json({ message: 'No classes to update', updated: 0 });
    }

    // Check each class and update status if needed
    const updatePromises = liveClasses.map(async (liveClass: any) => {
      const newStatus = getClassStatus(
        liveClass.scheduled_date,
        liveClass.start_time,
        liveClass.end_time,
        liveClass.status
      );

      // Only update if status has changed
      if (newStatus !== liveClass.status) {
        const { error: updateError } = await supabase
          .from('live_classes')
          .update({ 
            status: newStatus
          })
          .eq('live_class_id', liveClass.live_class_id);

        if (updateError) {
          console.error(`Error updating class ${liveClass.live_class_id}:`, updateError);
          return { success: false, classId: liveClass.live_class_id, error: updateError.message };
        }

        return { success: true, classId: liveClass.live_class_id, oldStatus: liveClass.status, newStatus };
      }

      return { success: true, classId: liveClass.live_class_id, noChange: true };
    });

    const results = await Promise.all(updatePromises);
    const successful = results.filter((r: any) => r.success && !r.noChange);
    const failed = results.filter((r: any) => !r.success);

    return NextResponse.json({
      message: `Updated ${successful.length} classes`,
      updated: successful.length,
      failed: failed.length,
      results: successful,
      errors: failed
    });

  } catch (error) {
    console.error('Error in auto-status update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}