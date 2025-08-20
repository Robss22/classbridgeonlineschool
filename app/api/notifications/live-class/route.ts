import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { errorHandler } from '@/lib/errorHandler';

interface NotificationData {
  live_class_id: string;
  type: 'reminder_30min' | 'reminder_5min' | 'class_starting' | 'class_ended';
  recipients: 'teachers' | 'students' | 'both';
  message?: string; // Optional custom message for class_ended notifications
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationData = await request.json();
    const { live_class_id, type, recipients, message } = body;

    // Get live class details
    const { data: liveClass, error: classError } = await supabase
      .from('live_classes')
      .select(`
        *,
        subjects:subject_id (name),
        levels:level_id (name)
      `)
      .eq('live_class_id', live_class_id)
      .single();

    if (classError || !liveClass) {
      throw new Error('Live class not found');
    }

    const notifications: Array<Record<string, unknown>> = [];

    // Teacher notifications (commented out until teacher_id field is added)
    if (recipients === 'teachers' || recipients === 'both') {
      // if (liveClass.teacher_id) {
      //   notifications.push({
      //     user_id: liveClass.teacher_id,
      //     type: 'live_class_notification',
      //     title: getNotificationTitle(type),
      //     message: getNotificationMessage(type, liveClass),
      //     data: {
      //       live_class_id,
      //       notification_type: type,
      //       class_title: liveClass.title,
      //       scheduled_date: liveClass.scheduled_date,
      //       start_time: liveClass.start_time
      //     },
      //     created_at: new Date().toISOString()
      //   });
      // }
    }

    // Student notifications
    if (recipients === 'students' || recipients === 'both') {
      // Get students enrolled in this program/level
      const { data: students, error: studentsError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('role', 'student');

      if (!studentsError && students) {
        students.forEach(student => {
          notifications.push({
            user_id: student.id,
            type: 'live_class_notification',
            title: getNotificationTitle(type),
            message: getNotificationMessage(type, liveClass, message),
            data: {
              live_class_id,
              notification_type: type,
              class_title: liveClass.title,
              scheduled_date: liveClass.scheduled_date,
              start_time: liveClass.start_time
            },
            created_at: new Date().toISOString()
          });
        });
      }
    }

    // Insert notifications (commented out until notifications table is created)
    if (notifications.length > 0) {
      // const { error: insertError } = await supabase
      //   .from('notifications')
      //   .insert(notifications);

      // if (insertError) throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      notifications_sent: notifications.length 
    });
  } catch (error) {
    const appError = errorHandler.handleSupabaseError(error, 'send_live_class_notification', '');
    return NextResponse.json(
      { error: appError.message, success: false },
      { status: 500 }
    );
  }
}

function getNotificationTitle(type: string): string {
  switch (type) {
    case 'reminder_30min': return 'Live Class Reminder - 30 minutes';
    case 'reminder_5min': return 'Live Class Starting Soon - 5 minutes';
    case 'class_starting': return 'Live Class Starting Now';
    case 'class_ended': return 'Live Class Ended';
    default: return 'Live Class Notification';
  }
}

function getNotificationMessage(type: string, liveClass: Record<string, unknown>, customMessage?: string): string {
  const subject = (liveClass.subjects as { name?: string } | undefined)?.name || 'Subject';
  const level = (liveClass.levels as { name?: string } | undefined)?.name || 'Level';
  
  switch (type) {
    case 'reminder_30min': 
      return `Your ${subject} class for ${level} starts in 30 minutes. Please prepare your materials and test your connection.`;
    case 'reminder_5min': 
      return `Your ${subject} class for ${level} starts in 5 minutes. Click to join now!`;
    case 'class_starting': 
      return `Your ${subject} class for ${level} is starting now. Click to join!`;
    case 'class_ended': 
      return customMessage || `Your ${subject} class for ${level} has ended. Check for any assignments or recordings.`;
    default: 
      return `Update for your ${subject} class: ${liveClass.title}`;
  }
}
