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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [technicalData, setTechnicalData] = useState<any>({})
  // reserved for future checks ui
  const [, setPrecheck] = useState<{ ok: boolean; reason?: string }>({ ok: false })

  useEffect(() => {
    const load = async () => {
      if (!liveClassId) return

      try {
        setIsLoading(true)

        // Get current user and token for attendance API
        const { data: userData } = await supabase.auth.getUser()
        const { data: session } = await supabase.auth.getSession()
        const token = session?.session?.access_token
        setJwt(token || '')

        const fullName = userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Student'
        setDisplayName(fullName)

        // Collect device and connection information
        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          connection: (navigator as any).connection ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt
          } : null
        }

        // Test connection quality
        const connectionQuality = await testConnectionQuality()
        
        setTechnicalData({
          device_info: deviceInfo,
          technical_data: {
            connection_quality: connectionQuality,
            audio_enabled: false,
            video_enabled: false,
            screen_shared: false
          }
        })

        // Pre-join checks: verify user enrollment and class status
        try {
          const { data: lc } = await supabase
            .from('live_classes')
            .select('status, scheduled_date, start_time, end_time')
            .eq('live_class_id', liveClassId)
            .single()
          if (!lc) {
            setError('Live class not found')
            return
          }
          const now = new Date()
          const classStart = new Date(`${lc.scheduled_date}T${lc.start_time}`)
          const classEnd = new Date(`${lc.scheduled_date}T${lc.end_time}`)
          const windowOpenMs = 15 * 60 * 1000 // allow join 15 minutes early
          if (now.getTime() < classStart.getTime() - windowOpenMs) {
            setError('This class has not started yet. Please try again closer to the start time.')
            return
          }
          if (now.getTime() > classEnd.getTime()) {
            setError('This class has already ended.')
            return
          }
          setPrecheck({ ok: true })
        } catch (preErr) {
          console.warn('Pre-join checks failed:', preErr)
          setPrecheck({ ok: true })
        }

        // Resolve or ensure meeting link for this live class
        const { data, error } = await supabase
          .from('live_classes')
          .select('meeting_link, title')
          .eq('live_class_id', liveClassId)
          .single()

        let link = data?.meeting_link || ''
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
          } catch (_) {}
        }

        if (!link) {
          setError('Live class not found or meeting link not available')
          return
        }
        setMeetingLink(link)

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
              body: JSON.stringify({ 
                live_class_id: liveClassId, 
                event,
                device_info: technicalData.device_info,
                technical_data: technicalData.technical_data
              }),
            })
          } catch (err) {
            console.error('Failed to send attendance:', err)
          }
        }

        function initJitsi() {
          if (!window.JitsiMeetExternalAPI || !containerRef.current) return

          // Extract room name from the Jitsi link or use JaaS room
          const url = new URL(meetingLink)
          // Force domain to public meet.jit.si to avoid lobby/auth on custom domains
          const domain = 'meet.jit.si'
          let room = url.pathname.replace(/^\//, '') || `ClassBridge-${liveClassId}`
          room = room.replace(/[^A-Za-z0-9_-]/g, '') || `ClassBridge-${liveClassId}`

          const api = new window.JitsiMeetExternalAPI(domain, {
            roomName: room,
            parentNode: containerRef.current,
            userInfo: { displayName },
            configOverwrite: { 
              prejoinPageEnabled: false,
              startWithAudioMuted: true,
              startWithVideoMuted: false,
              disableModeratorIndicator: false,
              enableClosePage: true,
              lobby: { enabled: false, autoKnock: false }
            },
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

          // Track technical events
          api.addListener('audioMuteStatusChanged', (audio: any) => {
            setTechnicalData((prev: any) => ({
              ...prev,
              technical_data: {
                ...prev.technical_data,
                audio_enabled: !audio.muted
              }
            }))
          })

          api.addListener('videoMuteStatusChanged', (video: any) => {
            setTechnicalData((prev: any) => ({
              ...prev,
              technical_data: {
                ...prev.technical_data,
                video_enabled: !video.muted
              }
            }))
          })

          api.addListener('screenSharingStatusChanged', (screen: any) => {
            setTechnicalData((prev: any) => ({
              ...prev,
              technical_data: {
                ...prev.technical_data,
                screen_shared: screen.on
              }
            }))
          })

          api.addListener('videoConferenceJoined', () => {
            sendAttendance('join')
          })

          let hasJoined = false
          api.addListener('videoConferenceJoined', () => {
            hasJoined = true
            sendAttendance('join')
          })

          api.addListener('videoConferenceLeft', () => {
            sendAttendance('leave')
            if (hasJoined) router.push('/students/live-classes')
          })

          // Monitor connection quality
          api.addListener('connectionQualityChanged', (quality: any) => {
            const qualityMap: { [key: string]: 'good' | 'fair' | 'poor' } = {
              'good': 'good',
              'fair': 'fair',
              'poor': 'poor'
            }
            
            setTechnicalData((prev: any) => ({
              ...prev,
              technical_data: {
                ...prev.technical_data,
                connection_quality: qualityMap[quality] || 'fair'
              }
            }))
          })
        }
      } catch (err) {
        console.error('Error loading live class:', err)
        setError('Failed to load live class')
      } finally {
        setIsLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveClassId])

  // Test connection quality
  async function testConnectionQuality(): Promise<'good' | 'fair' | 'poor'> {
    try {
      const startTime = performance.now()
      await fetch('/api/health', { method: 'HEAD' })
      const endTime = performance.now()
      const latency = endTime - startTime

      if (latency < 100) return 'good'
      if (latency < 300) return 'fair'
      return 'poor'
    } catch {
      return 'poor'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Joining live class...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/students/live-classes')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Live Classes
          </button>
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


