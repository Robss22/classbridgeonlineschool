'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
      addListener: (event: string, callback: (payload?: Record<string, unknown>) => void) => void;
    }
  }
}

export default function TeacherJoinLiveClassPage() {
  const params = useParams() as { liveClassId?: string }
  const router = useRouter()
  const liveClassId = params?.liveClassId
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [meetingLink, setMeetingLink] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      if (!liveClassId) return

      // Get current user and token
      const { data: userData } = await supabase.auth.getUser()
      const fullName = userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Teacher'
      setDisplayName(fullName)

      // Pre-join: teacher can start within allowed window
      try {
        const { data: lc } = await supabase
          .from('live_classes')
          .select('status, scheduled_date, start_time, end_time')
          .eq('live_class_id', liveClassId)
          .single()
        if (lc) {
          const now = new Date()
          const start = new Date(`${lc.scheduled_date}T${lc.start_time}`)
          const end = new Date(`${lc.scheduled_date}T${lc.end_time}`)
          const earlyMs = 30 * 60 * 1000
          if (now.getTime() < start.getTime() - earlyMs) {
            setError('Too early to start this class')
            return
          }
          if (now.getTime() > end.getTime()) {
            setError('This class has already ended')
            return
          }
        }
      } catch {}

      // Resolve or generate meeting link
      const { data, error } = await supabase
        .from('live_classes')
        .select('meeting_link, title')
        .eq('live_class_id', liveClassId)
        .single()

      let link = data?.meeting_link || ''

      // If no link, generate one via API (avoids falling back to a shared room)
      if (!error && (!link || link.trim().length === 0)) {
        try {
          const resp = await fetch('/api/live-classes/generate-meeting-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ live_class_id: liveClassId, platform: 'Jitsi Meet' })
          })
          const json = await resp.json().catch(() => ({}))
          if (resp.ok && json?.meeting_link) {
            link = json.meeting_link
          }
        } catch {}
      }

      if (!link) { setError('No meeting link available'); return }
      setMeetingLink(link)

      // Load Jitsi script
      if (!document.getElementById('jitsi-script')) {
        const script = document.createElement('script')
        script.id = 'jitsi-script'
        // Always load from meet.jit.si; API can embed other Jitsi domains via domain option
        script.src = 'https://meet.jit.si/external_api.js'
        script.async = true
        script.onload = () => initJitsi()
        document.body.appendChild(script)
      } else {
        initJitsi()
      }

      function initJitsi() {
        if (!window.JitsiMeetExternalAPI || !containerRef.current) return

        // Normalize meeting link to a room on meet.jit.si
        const domain = 'meet.jit.si'
        let room = ''
        try {
          const url = new URL(meetingLink)
          // Always force to public Jitsi to avoid auth/lobby on custom/self-hosted domains
          room = url.pathname.replace(/^\//, '') || `ClassBridge-${liveClassId}`
        } catch {
          // Fallback to unique room on meet.jit.si
          room = `ClassBridge-${liveClassId}`
        }
        // Sanitize room name (avoid spaces/special chars that may trigger auth flows)
        room = room.replace(/[^A-Za-z0-9_-]/g, '') || `ClassBridge-${liveClassId}`

        const api = new window.JitsiMeetExternalAPI!(domain, {
          roomName: room,
          parentNode: containerRef.current,
          userInfo: { displayName },
          configOverwrite: {
            prejoinPageEnabled: false,
            lobby: { enabled: false, autoKnock: false },
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'chat',
              'desktop',
              'tileview',
              'hangup'
            ],
          },
          // Public Jitsi room; no JWT
        })

        // Ensure lobby is disabled if available (first participant is moderator on meet.jit.si)
        try {
          const anyApi = api as unknown as { enableLobby?: (enabled: boolean) => void }
          if (typeof anyApi.enableLobby === 'function') {
            anyApi.enableLobby(false)
          }
        } catch {}

        let hasJoined = false
        api.addListener('videoConferenceJoined', () => {
          hasJoined = true
        })
        api.addListener('videoConferenceLeft', () => {
          if (hasJoined) router.push('/teachers/live-classes')
        })
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveClassId])

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.push('/teachers/live-classes')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />
    </div>
  )
}


