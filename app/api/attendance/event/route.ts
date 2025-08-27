import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET

// Avoid build-time throws; lazily init client if env present
let supabaseAdmin: SupabaseClient | null = null
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

type AttendanceEventBody = {
  live_class_id: string
  event: 'join' | 'leave'
  timestamp?: string
  device_info?: {
    userAgent: string
    platform: string
    connection?: Record<string, unknown>
  }
  technical_data?: {
    connection_quality?: 'good' | 'fair' | 'poor'
    audio_enabled?: boolean
    video_enabled?: boolean
    screen_shared?: boolean
  }
}

function verifyToken(token: string): string | null {
  if (!SUPABASE_JWT_SECRET) return null
  const payload = jwt.verify(token, SUPABASE_JWT_SECRET) as { sub?: string }
  return payload?.sub || null
}

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_JWT_SECRET || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Attendance endpoint not configured' }, { status: 503 })
    }
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const userId = verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body: AttendanceEventBody = await request.json()
    const { live_class_id, event, timestamp } = body

    if (!live_class_id || !event) {
      return NextResponse.json({ error: 'live_class_id and event are required' }, { status: 400 })
    }

    const occurredAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()

    if (event === 'join') {
      try {
        const { error } = await supabaseAdmin!
          .from('live_class_participants')
          .upsert(
            {
              live_class_id,
              student_id: userId,
              join_time: occurredAt,
              attendance_status: 'present',
              // Optional fields if columns exist
              connection_quality: body.technical_data?.connection_quality,
              audio_enabled: body.technical_data?.audio_enabled,
              video_enabled: body.technical_data?.video_enabled,
              screen_shared: body.technical_data?.screen_shared
            },
            { onConflict: 'live_class_id,student_id' }
          )

        if (error) {
          // If table/columns don't exist yet, log the error but don't fail
          const msg = (error as Error)?.message || ''
          if (msg.includes('relation "live_class_participants" does not exist') || msg.includes('column') || msg.includes('does not exist')) {
            // live_class_participants table missing; return soft success
            return NextResponse.json({ success: true, message: 'Attendance tracking not available' });
          }
          throw error;
        }

        // Send notification to teacher about student joining (commented out until notifications table is created)
        try {
          // Student joined notification would be sent
          // await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/live-class`, {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({
          //     live_class_id,
          //     type: 'student_joined',
          //     recipients: 'teachers'
          //   })
          // })
        } catch (notifError) {
          console.warn('Failed to send join notification:', notifError)
        }

      } catch (dbError: unknown) {
        // Database error
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
        return NextResponse.json({ 
          success: false, 
          error: 'Attendance tracking unavailable',
          details: errorMessage 
        }, { status: 500 });
      }

    } else if (event === 'leave') {
      try {
        // Compute duration if possible
        let durationMinutes: number | undefined = undefined
        try {
          const { data: existing } = await supabaseAdmin!
            .from('live_class_participants')
            .select('join_time')
            .eq('live_class_id', live_class_id)
            .eq('student_id', userId)
            .single()
          if (existing?.join_time) {
            const start = new Date(existing.join_time).getTime()
            const end = new Date(occurredAt).getTime()
            if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
              durationMinutes = Math.round((end - start) / 60000)
            }
          }
        } catch {}

        const { error } = await supabaseAdmin!
          .from('live_class_participants')
          .update({ 
            leave_time: occurredAt,
            // Optional if column exists
            duration_minutes: durationMinutes
          })
          .eq('live_class_id', live_class_id)
          .eq('student_id', userId)

        if (error) {
          // If table/columns don't exist, log the error but don't fail
          const msg = (error as Error)?.message || ''
          if (msg.includes('relation "live_class_participants" does not exist') || msg.includes('column') || msg.includes('does not exist')) {
            // live_class_participants table missing; return soft success
            return NextResponse.json({ success: true, message: 'Attendance tracking not available' });
          }
          throw error;
        }

      } catch (dbError: unknown) {
        // Database error
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
        return NextResponse.json({ 
          success: false, 
          error: 'Attendance tracking unavailable',
          details: errorMessage 
        }, { status: 500 });
      }

    } else {
      return NextResponse.json({ error: 'Unsupported event' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}

// function calculateParticipationScore(duration_minutes: number, technical_data?: Record<string, unknown>): number {
//   let score = 0
//   
//   // Base score from duration (assuming 60-minute class)
//   const durationScore = Math.min((duration_minutes / 60) * 100, 100)
//   score += durationScore * 0.6 // 60% weight for duration
//   
//   // Technical engagement score
//   if (technical_data) {
//     let engagementScore = 0
//     if (technical_data.audio_enabled) engagementScore += 20
//     if (technical_data.video_enabled) engagementScore += 20
//     if (technical_data.screen_shared) engagementScore += 20
//     if (technical_data.connection_quality === 'good') engagementScore += 20
//     else if (technical_data.connection_quality === 'fair') engagementScore += 10
//     
//     score += engagementScore * 0.4 // 40% weight for engagement
//   }
//   
//   return Math.round(Math.min(score, 100))
// }


