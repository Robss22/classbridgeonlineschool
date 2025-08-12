'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any
  }
}

export default function JoinLiveClassPage() {
  const params = useParams() as { liveClassId?: string }
  const router = useRouter()
  const liveClassId = params?.liveClassId
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [meetingLink, setMeetingLink] = useState<string>('')
  const [jaas, setJaas] = useState<{ jwt: string; domain: string; room: string } | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [jwt, setJwt] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      if (!liveClassId) return

      // Get current user and token for attendance API
      const { data: userData } = await supabase.auth.getUser()
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      setJwt(token || '')

      const fullName = userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Student'
      setDisplayName(fullName)

      // Resolve meeting link for this live class
      const { data, error } = await supabase
        .from('live_classes')
        .select('meeting_link, title')
        .eq('live_class_id', liveClassId)
        .single()

      if (error || !data?.meeting_link) {
        router.push('/students/live-classes')
        return
      }
      setMeetingLink(data.meeting_link)

      // Force: do not use JaaS for students to avoid lobby/knock – rely on public Jitsi link
      setJaas(null)

      // Load Jitsi script
      if (!document.getElementById('jitsi-script')) {
        const script = document.createElement('script')
        script.id = 'jitsi-script'
        script.src = (jaas ? `https://${jaas.domain}/external_api.js` : 'https://meet.jit.si/external_api.js')
        script.async = true
        script.onload = () => initJitsi()
        document.body.appendChild(script)
      } else {
        initJitsi()
      }

      async function sendAttendance(event: 'join' | 'leave') {
        try {
          await fetch('/api/attendance/event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
            },
            body: JSON.stringify({ live_class_id: liveClassId, event }),
          })
        } catch (_) {}
      }

      function initJitsi() {
        if (!window.JitsiMeetExternalAPI || !containerRef.current) return

        // Extract room name from the Jitsi link or use JaaS room
        const url = new URL(meetingLink)
        const domain = url.hostname || 'meet.jit.si'
        const room = url.pathname.replace(/^\//, '') || 'ClassBridgeRoom'

        const api = new window.JitsiMeetExternalAPI(domain, {
          roomName: room,
          parentNode: containerRef.current,
          userInfo: { displayName },
          configOverwrite: { prejoinPageEnabled: false },
          interfaceConfigOverwrite: {
            // Hide Security/Invite to avoid adding passwords or sharing links externally
            // Full list: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe#interfaceconfigoverwrite
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'chat',
              'desktop',
              'tileview',
              'hangup'
            ]
          },
          // No JWT for public meet.jit.si rooms
        })

        api.addListener('videoConferenceJoined', () => {
          sendAttendance('join')
        })

        api.addListener('videoConferenceLeft', () => {
          sendAttendance('leave')
          router.push('/students/live-classes')
        })
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveClassId])

  return (
    <div className="min-h-screen bg-black">
      <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />
    </div>
  )
}


