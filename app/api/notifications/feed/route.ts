import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { requireAuthUserIdFromBearer } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthUserIdFromBearer(request as unknown as Request);

    const { data: userRow } = await supabaseAdmin.from('users').select('program_id').eq('id', userId).single();
    const programId = userRow?.program_id;

    const now = new Date();
    const yyyy = now.toISOString().slice(0, 10);
    const hhmmss = now.toTimeString().slice(0, 8);

    const { data: classes } = await supabaseAdmin
      .from('live_classes')
      .select('live_class_id, title, scheduled_date, start_time, end_time, meeting_link, subjects:subject_id(name), teachers:teacher_id(users: user_id(first_name,last_name))')
      .eq('program_id', programId || '')
      .eq('scheduled_date', yyyy)
      .gte('start_time', hhmmss)
      .lte('start_time', new Date(now.getTime() + 30 * 60000).toTimeString().slice(0,8))
      .eq('status', 'scheduled')
      .order('start_time', { ascending: true });

    const feed = (classes || []).map((lc: Record<string, unknown>) => ({
      id: `live_${lc.live_class_id}`,
      type: 'live_class',
      title: 'Live Class Starting Soon',
      message: `${lc.title || 'Live Class'} starts soon`,
      timestamp: new Date().toISOString(),
      read: false,
      action_url: lc.meeting_link,
      live_class: lc
    }));

    return NextResponse.json({ data: feed }, { status: 200 });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to fetch notifications';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}


