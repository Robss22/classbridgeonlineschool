import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_JWT_SECRET) {
  throw new Error('Missing Supabase environment variables for attendance endpoint')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type AttendanceEventBody = {
  live_class_id: string
  event: 'join' | 'leave'
  timestamp?: string
}

function verifyToken(token: string): string {
  const payload = jwt.verify(token, SUPABASE_JWT_SECRET) as { sub?: string }
  if (!payload?.sub) throw new Error('Invalid token payload')
  return payload.sub
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const userId = verifyToken(token)

    const body: AttendanceEventBody = await request.json()
    const { live_class_id, event, timestamp } = body

    if (!live_class_id || !event) {
      return NextResponse.json({ error: 'live_class_id and event are required' }, { status: 400 })
    }

    const occurredAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()

    if (event === 'join') {
      const { error } = await supabaseAdmin
        .from('live_class_participants')
        .upsert(
          {
            live_class_id,
            student_id: userId,
            join_time: occurredAt,
            attendance_status: 'present',
          },
          { onConflict: 'live_class_id,student_id' }
        )

      if (error) throw error
    } else if (event === 'leave') {
      const { error } = await supabaseAdmin
        .from('live_class_participants')
        .update({ leave_time: occurredAt })
        .eq('live_class_id', live_class_id)
        .eq('student_id', userId)

      if (error) throw error
    } else {
      return NextResponse.json({ error: 'Unsupported event' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Attendance event error:', error)
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 400 })
  }
}


