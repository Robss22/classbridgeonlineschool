'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any
  }
}

export default function TeacherJoinLiveClassPage() {
  const params = useParams() as { liveClassId?: string }
  const router = useRouter()
  const liveClassId = params?.liveClassId
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [meetingLink, setMeetingLink] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      if (!liveClassId) return

      // Get current user and token
      const { data: userData } = await supabase.auth.getUser()
      const fullName = userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Teacher'
      setDisplayName(fullName)

      // Resolve meeting link
      const { data, error } = await supabase
        .from('live_classes')
        .select('meeting_link, title')
        .eq('live_class_id', liveClassId)
        .single()

      if (error || !data?.meeting_link) {
        router.push('/teachers/live-classes')
        return
      }
      setMeetingLink(data.meeting_link)

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

        // If the meeting link is a Jitsi room, embed it. Otherwise redirect to the external provider.
        let domain = 'meet.jit.si'
        let room = 'ClassBridgeRoom'
        try {
          const url = new URL(meetingLink)
          if (url.hostname.includes('jit.si')) {
            domain = url.hostname
            room = url.pathname.replace(/^\//, '') || room
          } else {
            window.location.href = meetingLink
            return
          }
        } catch {
          // Fallback to default Jitsi
        }

        const api = new window.JitsiMeetExternalAPI(domain, {
          roomName: room,
          parentNode: containerRef.current,
          userInfo: { displayName },
          configOverwrite: {
            prejoinPageEnabled: false,
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
          if (typeof (api as any).enableLobby === 'function') {
            (api as any).enableLobby(false)
          }
        } catch (_) {}

        api.addListener('videoConferenceLeft', () => {
          router.push('/teachers/live-classes')
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


