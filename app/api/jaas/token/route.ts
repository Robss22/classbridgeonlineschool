import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Env requirements
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!

const JAAS_APP_ID = process.env.JAAS_APP_ID // e.g., your vpaas-magic-cookie app id
const JAAS_KID = process.env.JAAS_KID // key id from JaaS API key
const JAAS_PRIVATE_KEY = process.env.JAAS_PRIVATE_KEY // PEM private key (can be single-line with \n)
const JAAS_JWT_ALG = (process.env.JAAS_JWT_ALG as jwt.Algorithm) || 'RS256'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_JWT_SECRET) {
  throw new Error('Missing Supabase env for JaaS token endpoint')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function verifySupabaseToken(token: string): { sub: string } {
  const payload = jwt.verify(token, SUPABASE_JWT_SECRET) as { sub?: string }
  if (!payload?.sub) throw new Error('Invalid or expired token')
  return { sub: payload.sub }
}

type TokenRequest = {
  live_class_id: string
}



interface UserProfile {
  email: string
  first_name: string | null
  last_name: string | null
  role: string
}

export async function POST(req: NextRequest) {
  try {
    if (!JAAS_APP_ID || !JAAS_PRIVATE_KEY || !JAAS_KID) {
      return NextResponse.json(
        { error: 'JaaS not configured on server', code: 'JAAS_CONFIG_MISSING' },
        { status: 500 }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    const { sub: userId } = verifySupabaseToken(authHeader.replace('Bearer ', ''))

    const { live_class_id }: TokenRequest = await req.json()
    if (!live_class_id) {
      return NextResponse.json({ error: 'live_class_id is required' }, { status: 400 })
    }

    // Fetch live class and resolve teacher's user id
    const { data: liveClass, error: lcError } = await supabaseAdmin
      .from('live_classes')
      .select(
        `live_class_id, title, teacher_id,
         teachers:teacher_id ( teacher_id, user_id )`
      )
      .eq('live_class_id', live_class_id)
      .single()

    if (lcError || !liveClass) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 })
    }

    const teacherUserId = Array.isArray((liveClass as Record<string, unknown>)?.teachers)
      ? ((liveClass as Record<string, unknown>)?.teachers as Array<Record<string, unknown>>)[0]?.user_id as string | undefined
      : (liveClass as { teachers?: { user_id?: string } })?.teachers?.user_id

    // Fetch current user profile for display name/email
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('email, first_name, last_name, role')
      .eq('id', userId)
      .single()

    const isAdmin = (userProfile as UserProfile)?.role === 'admin'
    const isModerator = isAdmin || (!!teacherUserId && teacherUserId === userId)

    const displayName = userProfile
      ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.email || 'User'
      : 'User'

    // Build JaaS room path and token
    const roomName = `ClassBridge-${live_class_id}`
    const roomPath = `vpaas-magic-cookie-${JAAS_APP_ID}/${roomName}`

    const nowSec = Math.floor(Date.now() / 1000)
    const payload: jwt.JwtPayload = {
      aud: 'jitsi',
      iss: 'chat',
      sub: '8x8.vc',
      room: roomPath,
      nbf: nowSec - 10,
      exp: nowSec + 2 * 60 * 60,
      context: {
        user: {
          name: displayName,
          email: userProfile?.email || undefined,
          moderator: isModerator ? 'true' : 'false',
        },
        features: {
          livestreaming: 'true',
          recording: 'true',
          screensharing: 'true',
          transcription: 'false',
        },
      },
    }

    const privateKey = (JAAS_PRIVATE_KEY as string).replace(/\\n/g, '\n')
    const token = jwt.sign(payload, privateKey, {
      algorithm: JAAS_JWT_ALG,
      keyid: JAAS_KID,
    })

    return NextResponse.json({
      jwt: token,
      domain: '8x8.vc',
      room: roomPath,
      isModerator,
      displayName,
    })
  } catch (error: unknown) {
    console.error('JaaS token error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}


