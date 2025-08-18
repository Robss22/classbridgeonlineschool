'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { SessionInfo } from '@/lib/services/sessionManager';
import { Monitor, Smartphone, Tablet, MonitorSmartphone, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';

interface SessionManagerProps {
  showDeviceInfo?: boolean;
  allowForceLogout?: boolean;
  className?: string;
}

export default function SessionManager({
  showDeviceInfo = true,
  allowForceLogout = true,
  className = ''
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    getCurrentSession,
    getActiveSessions,
    forceLogoutOtherDevices,
    endCurrentSession,
    extendSession
  } = useSessionManagement();

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[SessionManager] Loading sessions...');
      
      const [current, allSessions] = await Promise.all([
        getCurrentSession(),
        getActiveSessions()
      ]);
      
      console.log('[SessionManager] Current session:', current);
      console.log('[SessionManager] All sessions:', allSessions);
      
      setCurrentSession(current);
      setSessions(allSessions);
    } catch (error) {
      console.error('[SessionManager] Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [getCurrentSession, getActiveSessions]);

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleForceLogoutOthers = async () => {
    if (!confirm('Are you sure you want to log out from all other devices? This will end all other active sessions.')) {
      return;
    }

    try {
      const success = await forceLogoutOtherDevices();
      if (success) {
        alert('Successfully logged out from all other devices!');
        await loadSessions(); // Refresh the list
      } else {
        alert('Failed to log out from other devices. Please try again.');
      }
    } catch (error) {
      console.error('Error force logging out other devices:', error);
      alert('An error occurred while logging out from other devices.');
    }
  };

  const handleEndCurrentSession = async () => {
    if (!confirm('Are you sure you want to end your current session? You will be logged out immediately.')) {
      return;
    }

    try {
      const success = await endCurrentSession();
      if (success) {
        // Redirect to login page
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error ending current session:', error);
      alert('An error occurred while ending the session.');
    }
  };

  const handleExtendSession = async () => {
    try {
      const success = await extendSession(2.5); // Extend by 2.5 hours
      if (success) {
        alert('Session extended successfully!');
        await loadSessions(); // Refresh the list
      } else {
        alert('Failed to extend session. Please try again.');
      }
    } catch (error) {
      console.error('Error extending session:', error);
      alert('An error occurred while extending the session.');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <MonitorSmartphone className="w-4 h-4" />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const getTimeAgo = (timeString: string) => {
    const now = new Date();
    const time = new Date(timeString);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg p-4">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={isExpanded ? "Hide sessions" : "Show sessions"}
            >
              <svg 
                className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
              <p className="text-sm text-gray-600">
                Manage your login sessions across devices
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isExpanded && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh sessions"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                {allowForceLogout && sessions.length > 1 && (
                  <button
                    onClick={handleForceLogoutOthers}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                  >
                    <LogOut className="w-4 h-4 inline mr-1" />
                    Logout Others
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Session Content */}
      {isExpanded && (
        <>
          {/* Current Session */}
          {currentSession && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                                           {getDeviceIcon(currentSession.device_type)}
                  </div>
                  <div>
                                         <h4 className="font-medium text-blue-900">Current Session</h4>
                     <p className="text-sm text-blue-700">
                       {currentSession.device_name} • {currentSession.browser} on {currentSession.os}
                     </p>
                     <p className="text-xs text-blue-600">
                       Logged in {getTimeAgo(currentSession.login_time)}
                     </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExtendSession}
                    className="px-3 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                  >
                    Extend Session
                  </button>
                  <button
                    onClick={handleEndCurrentSession}
                    className="px-3 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                  >
                    End Session
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All Sessions List */}
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div key={session.session_id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                                         <div className={`p-2 rounded-lg ${
                       session.session_id === currentSession?.session_id 
                         ? 'bg-blue-100 text-blue-600' 
                         : 'bg-gray-100 text-gray-600'
                     }`}>
                       {getDeviceIcon(session.device_type)}
                     </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {session.device_name}
                          {session.session_id === currentSession?.session_id && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Current
                            </span>
                          )}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {session.browser} on {session.os}
                      </p>
                      <p className="text-xs text-gray-500">
                        Logged in {getTimeAgo(session.login_time)} • 
                        Last activity {getTimeAgo(session.last_activity)}
                      </p>
                    </div>
                  </div>
                  
                                     {showDeviceInfo && (
                     <div className="text-right text-xs text-gray-500">
                       <div>IP: {session.ip_address || 'Unknown'}</div>
                       <div>Expires: {formatTime(session.expires_at)}</div>
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {sessions.length === 0 && (
            <div className="px-6 py-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Sessions</h3>
              <p className="text-gray-600">You don&apos;t have any active login sessions.</p>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{sessions.length} active session{sessions.length !== 1 ? 's' : ''}</span>
          <span className="text-xs">
            Sessions automatically expire after 2.5 hours of inactivity
          </span>
        </div>
      </div>
    </div>
  );
}
