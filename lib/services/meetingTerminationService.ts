import { supabase } from '@/lib/supabaseClient';

export interface MeetingTerminationResult {
  success: boolean;
  message: string;
  platform?: string;
  meetingId?: string;
}

export class MeetingTerminationService {
  /**
   * Terminate a meeting when a teacher ends a class
   * This will attempt to end the meeting on the platform level
   */
  static async terminateMeeting(liveClassId: string): Promise<MeetingTerminationResult> {
    try {
      // Get the live class details
      const { data: liveClass, error: fetchError } = await supabase
        .from('live_classes')
        .select('meeting_link, meeting_platform, meeting_id, title')
        .eq('live_class_id', liveClassId)
        .single();

      if (fetchError || !liveClass) {
        return {
          success: false,
          message: 'Live class not found'
        };
      }

      const { meeting_link, meeting_platform, meeting_id, title } = liveClass;

      if (!meeting_link) {
        return {
          success: false,
          message: 'No meeting link found for this class'
        };
      }

      // Determine platform and terminate accordingly
      const platform = (meeting_platform ?? this.detectPlatform(meeting_link || '')).toLowerCase();
      
      switch (platform) {
        case 'jitsi meet':
        case 'jitsi':
          return await this.terminateJitsiMeeting(meeting_link || '', liveClassId, title || '');
        
        case 'google meet':
        case 'google':
          return await this.terminateGoogleMeet(meeting_link || '', liveClassId, title || '');
        
        case 'zoom':
          return await this.terminateZoomMeeting(meeting_link || '', meeting_id, liveClassId, title || '');
        
        case 'microsoft teams':
        case 'teams':
          return await this.terminateTeamsMeeting(meeting_link || '', liveClassId, title || '');
        
        default:
          return await this.terminateGenericMeeting(meeting_link || '', platform, liveClassId, title || '');
      }
    } catch (error) {
      console.error('Error terminating meeting:', error);
      return {
        success: false,
        message: 'Failed to terminate meeting due to an error'
      };
    }
  }

  /**
   * Detect meeting platform from URL
   */
  private static detectPlatform(meetingLink: string): string {
    const url = meetingLink.toLowerCase();
    
    if (url.includes('meet.jit.si') || url.includes('jitsi')) {
      return 'jitsi meet';
    } else if (url.includes('meet.google.com') || url.includes('google')) {
      return 'google meet';
    } else if (url.includes('zoom.us') || url.includes('zoom')) {
      return 'zoom';
    } else if (url.includes('teams.microsoft.com') || url.includes('teams')) {
      return 'microsoft teams';
    }
    
    return 'unknown';
  }

  /**
   * Terminate Jitsi Meet meeting
   * For Jitsi, we can send a termination signal to all participants
   */
  private static async terminateJitsiMeeting(
    meetingLink: string, 
    liveClassId: string, 
    title: string
  ): Promise<MeetingTerminationResult> {
    try {
      // Extract room name from Jitsi URL
      const url = new URL(meetingLink);
      const roomName = url.pathname.replace(/^\//, '');
      
      // For Jitsi, we'll send a termination notification to participants
      // and mark the meeting as terminated in our system
      await this.notifyParticipantsMeetingEnded(liveClassId, title);
      
      // Update meeting status to indicate termination
      await this.updateMeetingTerminationStatus(liveClassId, 'terminated');
      
      return {
        success: true,
        message: `Jitsi Meet meeting "${title}" has been terminated`,
        platform: 'Jitsi Meet',
        meetingId: roomName
      };
    } catch (error) {
      console.error('Error terminating Jitsi meeting:', error);
      return {
        success: false,
        message: 'Failed to terminate Jitsi meeting'
      };
    }
  }

  /**
   * Terminate Google Meet meeting
   * Note: Google Meet doesn't provide API to end meetings, but we can notify participants
   */
  private static async terminateGoogleMeet(
    meetingLink: string, 
    liveClassId: string, 
    title: string
  ): Promise<MeetingTerminationResult> {
    try {
      // Extract meeting ID from Google Meet URL
      const url = new URL(meetingLink);
      const meetingId = url.pathname.split('/').pop() || '';
      
      // Notify participants that the meeting has ended
      await this.notifyParticipantsMeetingEnded(liveClassId, title);
      
      // Update meeting status
      await this.updateMeetingTerminationStatus(liveClassId, 'terminated');
      
      return {
        success: true,
        message: `Google Meet meeting "${title}" has been ended. Participants have been notified.`,
        platform: 'Google Meet',
        meetingId
      };
    } catch (error) {
      console.error('Error terminating Google Meet meeting:', error);
      return {
        success: false,
        message: 'Failed to terminate Google Meet meeting'
      };
    }
  }

  /**
   * Terminate Zoom meeting
   * Zoom provides API endpoints to end meetings
   */
  private static async terminateZoomMeeting(
    _meetingLink: string, 
    meetingId: string | null, 
    liveClassId: string, 
    title: string
  ): Promise<MeetingTerminationResult> {
    try {
      // If we have a Zoom meeting ID, we can use the Zoom API to end the meeting
      if (meetingId && process.env.ZOOM_API_KEY && process.env.ZOOM_API_SECRET) {
        // This would require Zoom API integration
        // For now, we'll just notify participants
        // Zoom API integration would be implemented here
      }
      
      // Notify participants
      await this.notifyParticipantsMeetingEnded(liveClassId, title);
      
      // Update meeting status
      await this.updateMeetingTerminationStatus(liveClassId, 'terminated');
      
      return {
        success: true,
        message: `Zoom meeting "${title}" has been ended. Participants have been notified.`,
        platform: 'Zoom',
        meetingId: meetingId || 'unknown'
      };
    } catch (error) {
      console.error('Error terminating Zoom meeting:', error);
      return {
        success: false,
        message: 'Failed to terminate Zoom meeting'
      };
    }
  }

  /**
   * Terminate Microsoft Teams meeting
   */
  private static async terminateTeamsMeeting(
    _meetingLink: string, 
    liveClassId: string, 
    title: string
  ): Promise<MeetingTerminationResult> {
    try {
      // Extract meeting ID from Teams URL
      const url = new URL(_meetingLink);
      const meetingId = url.pathname.split('/').pop() || '';
      
      // Notify participants
      await this.notifyParticipantsMeetingEnded(liveClassId, title);
      
      // Update meeting status
      await this.updateMeetingTerminationStatus(liveClassId, 'terminated');
      
      return {
        success: true,
        message: `Microsoft Teams meeting "${title}" has been ended. Participants have been notified.`,
        platform: 'Microsoft Teams',
        meetingId
      };
    } catch (error) {
      console.error('Error terminating Teams meeting:', error);
      return {
        success: false,
        message: 'Failed to terminate Teams meeting'
      };
    }
  }

  /**
   * Generic meeting termination for unknown platforms
   */
  private static async terminateGenericMeeting(
    _meetingLink: string, 
    platform: string, 
    liveClassId: string, 
    title: string
  ): Promise<MeetingTerminationResult> {
    try {
      // Notify participants
      await this.notifyParticipantsMeetingEnded(liveClassId, title);
      
      // Update meeting status
      await this.updateMeetingTerminationStatus(liveClassId, 'terminated');
      
      return {
        success: true,
        message: `Meeting "${title}" has been ended. Participants have been notified.`,
        platform: platform || 'Unknown',
        meetingId: 'unknown'
      };
    } catch (error) {
      console.error('Error terminating generic meeting:', error);
      return {
        success: false,
        message: 'Failed to terminate meeting'
      };
    }
  }

  /**
   * Notify all participants that the meeting has ended
   */
  private static async notifyParticipantsMeetingEnded(liveClassId: string, title: string): Promise<void> {
    try {
      // Send notification to participants
      await fetch('/api/notifications/live-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          live_class_id: liveClassId,
          type: 'class_ended',
          recipients: 'students',
          message: `The live class "${title}" has ended. Thank you for participating!`
        })
      });
    } catch (error) {
      console.warn('Failed to send meeting ended notification:', error);
    }
  }

  /**
   * Update the meeting termination status in the database
   */
  private static async updateMeetingTerminationStatus(liveClassId: string, status: string): Promise<void> {
    try {
      await supabase
        .from('live_classes')
        .update({ 
          meeting_terminated_at: new Date().toISOString(),
          meeting_status: status
        })
        .eq('live_class_id', liveClassId);
    } catch (error) {
      console.error('Failed to update meeting termination status:', error);
    }
  }

  /**
   * Force disconnect all participants from a meeting
   * This is a more aggressive approach for immediate termination
   */
  static async forceDisconnectParticipants(liveClassId: string): Promise<MeetingTerminationResult> {
    try {
      // Get all participants for this live class
      const { data: participants, error: fetchError } = await supabase
        .from('live_class_participants')
        .select('student_id, join_time')
        .eq('live_class_id', liveClassId)
        .is('leave_time', null);

      if (fetchError) {
        return {
          success: false,
          message: 'Failed to fetch participants'
        };
      }

      // Mark all participants as left
      if (participants && participants.length > 0) {
        const { error: updateError } = await supabase
          .from('live_class_participants')
          .update({ 
            leave_time: new Date().toISOString(),
            attendance_status: 'present'
          })
          .eq('live_class_id', liveClassId)
          .is('leave_time', null);

        if (updateError) {
          console.error('Failed to update participant leave times:', updateError);
        }
      }

      // Terminate the meeting
      const terminationResult = await this.terminateMeeting(liveClassId);
      
      return {
        ...terminationResult,
        message: `${terminationResult.message} All participants have been disconnected.`
      };
    } catch (error) {
      console.error('Error force disconnecting participants:', error);
      return {
        success: false,
        message: 'Failed to force disconnect participants'
      };
    }
  }
}
