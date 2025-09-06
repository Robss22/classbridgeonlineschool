import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    // Note: Secrets starting with "SUPABASE_" are reserved and cannot be set via `supabase secrets set`.
    // We use a custom secret name (e.g., FUNCTION_SERVICE_ROLE_KEY) and keep a fallback for local dev.
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL') ||
      Deno.env.get('PUBLIC_SUPABASE_URL') ||
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ||
      ''

    const supabaseServiceKey =
      Deno.env.get('FUNCTION_SERVICE_ROLE_KEY') ||
      Deno.env.get('SERVICE_ROLE_KEY') ||
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      ''

    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL in Edge Function environment')
    }
    if (!supabaseServiceKey) {
      throw new Error('Missing FUNCTION_SERVICE_ROLE_KEY (service role) in Edge Function environment')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current time in configured local timezone (default Africa/Kampala)
    const timeZone =
      Deno.env.get('LOCAL_TIMEZONE') ||
      Deno.env.get('TIME_ZONE') ||
      'Africa/Kampala'

    // Build a zoned date/time using Intl parts to avoid UTC conversion issues
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((p) => p.type === type)?.value || ''

    const currentDate = `${getPart('year')}-${getPart('month')}-${getPart('day')}` // YYYY-MM-DD
    const currentTime = `${getPart('hour')}:${getPart('minute')}` // HH:MM

    console.log(
      `Checking for classes to start at ${currentTime} on ${currentDate} (timezone: ${timeZone})`,
    )

    // Find classes that should start now (or were missed earlier this minute)
    const { data: classesToStart, error: fetchError } = await supabase
      .from('live_classes')
      .select(`
        *,
        teachers:teacher_id (
          teacher_id,
          users:user_id (
            first_name,
            last_name
          )
        ),
        levels:level_id (name),
        subjects:subject_id (name),
        programs:program_id (name)
      `)
      .eq('scheduled_date', currentDate)
      .lte('start_time', currentTime)
      .eq('status', 'scheduled')

    if (fetchError) {
      console.error('Error fetching classes:', fetchError)
      throw fetchError
    }

    if (!classesToStart || classesToStart.length === 0) {
      console.log('No classes to start at this time')
      return new Response(
        JSON.stringify({ message: 'No classes to start', classesStarted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${classesToStart.length} classes to start`)

    // Start each class
    const startedClasses = []
    for (const liveClass of classesToStart) {
      try {
        // Update class status to 'ongoing'
        const { error: updateError } = await supabase
          .from('live_classes')
          .update({ 
            status: 'ongoing',
            started_at: new Date().toISOString()
          })
          .eq('live_class_id', liveClass.live_class_id)

        if (updateError) {
          console.error(`Error updating class ${liveClass.live_class_id}:`, updateError)
          continue
        }

        // Generate meeting link if not exists
        let meetingLink = liveClass.meeting_link
        let meetingPlatform = liveClass.meeting_platform || 'Google Meet'
        
        if (!meetingLink) {
          const generatedMeeting = generateMeetingLink(meetingPlatform)
          meetingLink = generatedMeeting.link
          meetingPlatform = generatedMeeting.platform
          
          // Update both the meeting link and platform
          const { error: linkUpdateError } = await supabase
            .from('live_classes')
            .update({ 
              meeting_link: meetingLink,
              meeting_platform: meetingPlatform
            })
            .eq('live_class_id', liveClass.live_class_id)

          if (linkUpdateError) {
            console.error(`Error updating meeting link for class ${liveClass.live_class_id}:`, linkUpdateError)
          } else {
            console.log(`Generated ${meetingPlatform} link for class ${liveClass.live_class_id}: ${meetingLink}`)
          }
        }

        // Get enrolled students for this class
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('student_enrollments')
          .select(`
            student_id,
            students:student_id (
              user_id,
              users:user_id (
                email,
                first_name,
                last_name
              )
            )
          `)
          .eq('program_id', liveClass.program_id)
          .eq('level_id', liveClass.level_id)

        if (enrollmentError) {
          console.error(`Error fetching enrollments for class ${liveClass.live_class_id}:`, enrollmentError)
        }

        // Send notifications to enrolled students
        if (enrollments && enrollments.length > 0) {
          for (const enrollment of enrollments) {
            if (enrollment.students?.users) {
              // Create notification record
              const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                  user_id: enrollment.students.user_id,
                  title: `Class Started: ${liveClass.subjects?.name || 'Live Class'}`,
                  message: `Your ${liveClass.subjects?.name || 'live class'} has started. Click to join!`,
                  type: 'class_started',
                  data: {
                    live_class_id: liveClass.live_class_id,
                    meeting_link: meetingLink,
                    subject: liveClass.subjects?.name,
                    teacher: `${liveClass.teachers?.users?.first_name} ${liveClass.teachers?.users?.last_name}`,
                    start_time: liveClass.start_time
                  },
                  is_read: false
                })

              if (notificationError) {
                console.error(`Error creating notification for user ${enrollment.students.user_id}:`, notificationError)
              }
            }
          }
        }

        startedClasses.push({
          live_class_id: liveClass.live_class_id,
          subject: liveClass.subjects?.name,
          teacher: `${liveClass.teachers?.users?.first_name} ${liveClass.teachers?.users?.last_name}`,
          meeting_link: meetingLink,
          students_notified: enrollments?.length || 0
        })

        console.log(`Successfully started class: ${liveClass.subjects?.name}`)

      } catch (classError) {
        console.error(`Error processing class ${liveClass.live_class_id}:`, classError)
      }
    }

    // Check for classes that should end (allow catching up if a minute was missed)
    const { data: classesToEnd, error: endFetchError } = await supabase
      .from('live_classes')
      .select('live_class_id, subjects:subject_id (name)')
      .eq('scheduled_date', currentDate)
      .lte('end_time', currentTime)
      .eq('status', 'ongoing')

    if (!endFetchError && classesToEnd && classesToEnd.length > 0) {
      for (const liveClass of classesToEnd) {
        const { error: endUpdateError } = await supabase
          .from('live_classes')
          .update({ 
            status: 'completed',
            ended_at: new Date().toISOString()
          })
          .eq('live_class_id', liveClass.live_class_id)

        if (endUpdateError) {
          console.error(`Error ending class ${liveClass.live_class_id}:`, endUpdateError)
        } else {
          console.log(`Successfully ended class: ${liveClass.subjects?.name}`)
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Classes processed successfully',
        classesStarted: startedClasses.length,
        classesEnded: classesToEnd?.length || 0,
        startedClasses,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in auto-start-classes function:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Generate a random meeting ID for Google Meet
function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  result += '-'
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate a joinable meeting link without provider APIs by defaulting to Jitsi
function generateMeetingLink(platform: string = 'Jitsi Meet'): { link: string, platform: string } {
  switch ((platform || 'Jitsi Meet').toLowerCase()) {
    case 'jitsi':
    case 'jitsi meet':
      return {
        link: `https://meet.jit.si/${generateMeetingId()}`,
        platform: 'Jitsi Meet'
      }
    case 'google meet':
    case 'google':
    case 'zoom':
    case 'teams':
      // Fallback to Jitsi unless integrated with the provider API
      return {
        link: `https://meet.jit.si/${generateMeetingId()}`,
        platform: 'Jitsi Meet'
      }
    default:
      return {
        link: `https://meet.jit.si/${generateMeetingId()}`,
        platform: 'Jitsi Meet'
      }
  }
}
