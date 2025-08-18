import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  try {
    const nowIso = new Date().toISOString()

    // Deactivate expired sessions
    const { error: deactivateErr } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .lt('expires_at', nowIso)
      .eq('is_active', true)

    if (deactivateErr) {
      console.warn('Sessions cleanup warning (deactivate):', deactivateErr.message)
    }

    // Optionally delete very old sessions (>30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error: deleteErr } = await supabase
      .from('user_sessions')
      .delete()
      .lt('created_at', thirtyDaysAgo)

    if (deleteErr) {
      console.warn('Sessions cleanup warning (delete):', deleteErr.message)
    }

    return NextResponse.json({ success: true, timestamp: nowIso })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}


