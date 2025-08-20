import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress?: string;
  userAgent: string;
}

export interface SessionInfo {
  session_id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  login_time: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'classbridge_session_id';
  private static readonly DEVICE_KEY = 'classbridge_device_id';

  /**
   * Generate a unique device identifier
   */
  private static generateDeviceId(): string {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem(this.DEVICE_KEY);
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = uuidv4();
      localStorage.setItem(this.DEVICE_KEY, deviceId);
    }
    
    return deviceId;
  }

  /**
   * Detect device information from browser
   */
  private static detectDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const deviceId = this.generateDeviceId();
    
    // Detect device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceType = /iPad/i.test(userAgent) ? 'tablet' : 'mobile';
    }
    
    // Detect browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Detect OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    // Generate device name
    const deviceName = `${os} ${deviceType} - ${browser}`;
    
    return {
      deviceId,
      deviceName,
      deviceType,
      browser,
      os,
      userAgent
    };
  }

  /**
   * Create a new session for the current user
   */
  static async createSession(userId: string): Promise<SessionInfo | null> {
    try {
      const deviceInfo = this.detectDeviceInfo();
      
      // First, deactivate any existing active sessions for this user
      const { error: deactivateError } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (deactivateError) {
        console.warn('Warning: Could not deactivate existing sessions:', deactivateError);
        // Continue anyway - the unique constraint will handle conflicts
      }
      
      // Create new session in database
      let { data: session, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          device_id: deviceInfo.deviceId,
          device_name: deviceInfo.deviceName,
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          user_agent: deviceInfo.userAgent,
          expires_at: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString() // 2.5 hours
        })
        .select()
        .single();

      // If insert fails due to unique constraint, try upsert approach
      if (error && error.code === '23505') { // Unique constraint violation
        
        const { data: upsertSession, error: upsertError } = await supabase
          .from('user_sessions')
          .upsert({
            user_id: userId,
            device_id: deviceInfo.deviceId,
            device_name: deviceInfo.deviceName,
            device_type: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            user_agent: deviceInfo.userAgent,
            expires_at: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
            is_active: true
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (upsertError) {
          return null;
        }
        
        session = upsertSession;
        error = null;
      }

      if (error || !session) {
        return null;
      }

      // Store session ID in localStorage
      localStorage.setItem(this.SESSION_KEY, session.session_id);
      
      // Transform database response to match interface
      return {
        session_id: session.session_id,
        device_id: session.device_id,
        device_name: session.device_name,
        device_type: session.device_type,
        browser: session.browser,
        os: session.os,
        login_time: session.login_time,
        last_activity: session.last_activity,
        expires_at: session.expires_at,
        is_active: session.is_active,
        ip_address: session.ip_address ?? null,
        user_agent: session.user_agent ?? null,
        created_at: session.created_at ?? null,
        updated_at: session.updated_at ?? null
      };
    } catch {
      return null;
    }
  }

  /**
   * Get current session information
   */
  static async getCurrentSession(): Promise<SessionInfo | null> {
    try {
      const sessionId = localStorage.getItem(this.SESSION_KEY);
      if (!sessionId) return null;

      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

             if (sessionError || !session) {
         // Session not found or inactive, clear from localStorage
         localStorage.removeItem(this.SESSION_KEY);
         return null;
       }

       // Transform database response to match interface
       return {
         session_id: session.session_id,
         device_id: session.device_id,
         device_name: session.device_name,
         device_type: session.device_type,
         browser: session.browser,
         os: session.os,
         login_time: session.login_time,
         last_activity: session.last_activity,
         expires_at: session.expires_at,
         is_active: session.is_active,
         ip_address: session.ip_address ?? null,
         user_agent: session.user_agent ?? null,
         created_at: session.created_at ?? null,
         updated_at: session.updated_at ?? null
       };
         } catch {
       return null;
     }
  }

  /**
   * Update session activity (called periodically)
   */
  static async updateSessionActivity(): Promise<boolean> {
    try {
      const sessionId = localStorage.getItem(this.SESSION_KEY);
      if (!sessionId) return false;

      const { error } = await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('is_active', true);

      if (error) {
        console.error('Error updating session activity:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating session activity:', error);
      return false;
    }
  }

  /**
   * End current session (logout)
   */
  static async endSession(): Promise<boolean> {
    try {
      const sessionId = localStorage.getItem(this.SESSION_KEY);
      if (!sessionId) return true;

      // Deactivate session in database
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error ending session:', error);
      }

      // Clear from localStorage
      localStorage.removeItem(this.SESSION_KEY);
      
      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      return false;
    }
  }

  /**
   * Check if current session is valid
   */
  static async isSessionValid(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session) return false;

             // Check if session has expired
       const now = new Date();
       const expiresAt = new Date(session.expires_at);
       
       if (now > expiresAt) {
         // Session expired, deactivate it
         await this.endSession();
         return false;
       }

      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Force logout from all other devices
   */
  static async forceLogoutOtherDevices(): Promise<boolean> {
    try {
      const sessionId = localStorage.getItem(this.SESSION_KEY);
      if (!sessionId) return false;

      // Get current user ID from session
      const { data: currentSession } = await supabase
        .from('user_sessions')
        .select('user_id')
        .eq('session_id', sessionId)
        .single();

      if (!currentSession) return false;

      // Deactivate all other active sessions for this user
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', currentSession.user_id)
        .neq('session_id', sessionId)
        .eq('is_active', true);

      if (error) {
        console.error('Error force logging out other devices:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error force logging out other devices:', error);
      return false;
    }
  }

  /**
   * Get all active sessions for current user
   */
  static async getActiveSessions(): Promise<SessionInfo[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('login_time', { ascending: false });

      if (error) {
        console.error('Error getting active sessions:', error);
        return [];
      }

             // Transform database responses to match interface
       return (sessions || []).map(session => ({
         session_id: session.session_id,
         device_id: session.device_id,
         device_name: session.device_name,
         device_type: session.device_type,
         browser: session.browser,
         os: session.os,
         login_time: session.login_time,
         last_activity: session.last_activity,
         expires_at: session.expires_at,
         is_active: session.is_active,
         ip_address: session.ip_address ?? null,
         user_agent: session.user_agent ?? null,
         created_at: session.created_at ?? null,
         updated_at: session.updated_at ?? null
       }));
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  /**
   * Extend session expiration
   */
  static async extendSession(hours: number = 2.5): Promise<boolean> {
    try {
      const sessionId = localStorage.getItem(this.SESSION_KEY);
      if (!sessionId) return false;

      const newExpiry = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('user_sessions')
        .update({ expires_at: newExpiry })
        .eq('session_id', sessionId)
        .eq('is_active', true);

      if (error) {
        console.error('Error extending session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  }> {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('is_active, expires_at');

      if (error) {
        console.error('Error getting session stats:', error);
        return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 };
      }

      const now = new Date();
      const totalSessions = sessions?.length || 0;
      const activeSessions = sessions?.filter(s => s.is_active).length || 0;
      const expiredSessions = sessions?.filter(s => 
        new Date(s.expires_at) < now
      ).length || 0;

      return { totalSessions, activeSessions, expiredSessions };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return { totalSessions: 0, activeSessions: 0, expiredSessions: 0 };
    }
  }
}
