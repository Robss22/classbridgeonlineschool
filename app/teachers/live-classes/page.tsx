'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Video, Trash2, Play, Clock, Users, Bell, AlertCircle } from 'lucide-react';
import { errorHandler } from '@/lib/errorHandler';
import { useAuth } from '@/contexts/AuthContext';

interface LiveClass {
  live_class_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string;
  meeting_platform: string;
  status: string;
  started_at?: string | null;
  ended_at?: string | null;
  teacher_id: string;
  program_id: string;
  level_id: string;
  subject_id: string;
  paper_id: string;
  levels?: { name: string };
  subjects?: { name: string };
  programs?: { name: string };
  papers?: { paper_name: string; paper_code: string };
}

export default function TeacherLiveClassesPage() {
  const { user } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [generatingLinks, setGeneratingLinks] = useState<Set<string>>(new Set());
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(false);
  const [nextClassCountdown, setNextClassCountdown] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // If auth context hasn't provided a user yet, exit quietly and try again on next effect
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      // Get teacher_id from user
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacherData) {
        setError('Teacher profile not found');
        setLoading(false);
        return;
      }

      // Fetch teacher's live classes
      const { data: liveClassData, error: liveClassError } = await supabase
        .from('live_classes')
        .select(`
          *,
          levels:level_id(name),
          subjects:subject_id(name),
          programs:program_id(name),
          papers:paper_id(paper_name, paper_code)
        `)
        .eq('teacher_id', teacherData.teacher_id)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (liveClassError) throw liveClassError;
      setLiveClasses(
        (liveClassData || []).map((item: any) => ({
          meeting_platform: item.meeting_platform ?? '',
          status: item.status ?? '',
          max_participants: item.max_participants ?? 0,
          teacher_id: item.teacher_id ?? '',
          level_id: item.level_id ?? '',
          subject_id: item.subject_id ?? '',
          program_id: item.program_id ?? '',
          paper_id: item.paper_id ?? '',
          live_class_id: item.live_class_id ?? '',
          title: item.title ?? '',
          description: item.description ?? '',
          scheduled_date: item.scheduled_date ?? '',
          start_time: item.start_time ?? '',
          end_time: item.end_time ?? '',
          meeting_link: item.meeting_link ?? '',
          started_at: item.started_at ?? null,
          ended_at: item.ended_at ?? null,
          levels: item.levels ?? null,
          subjects: item.subjects ?? null,
          programs: item.programs ?? null,
          papers: item.papers ?? null
        }))
      );
    } catch (error: any) {
      setDebugLog(log => [...log, `Error: ${error?.message}`]);
      const appError = errorHandler.handleSupabaseError(error, 'fetch_teacher_live_classes', 'teacher');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);



  const handleGenerateMeetingLink = useCallback(async (liveClassId: string) => {
    try {
      setGeneratingLinks(prev => new Set(prev).add(liveClassId));
      const response = await fetch('/api/live-classes/generate-meeting-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_class_id: liveClassId, platform: 'Jitsi Meet' })
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.error || 'Failed to generate meeting link');
      }
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to generate meeting link');
    } finally {
      setGeneratingLinks(prev => {
        const next = new Set(prev);
        next.delete(liveClassId);
        return next;
      });
    }
  }, [fetchData]);

  const handleUpdateStatus = useCallback(async (liveClassId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/live-classes?id=${liveClassId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update status');
      }

      fetchData(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, [fetchData]);

  // New function to end class and terminate meeting
  const handleEndClassWithMeetingTermination = useCallback(async (liveClassId: string) => {
    if (!confirm('Are you sure you want to end this class? This will terminate the meeting and disconnect all participants.')) {
      return;
    }

    try {
      setError(''); // Clear any previous errors
      
      // First, terminate the meeting
      const terminationResponse = await fetch('/api/live-classes/terminate-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          live_class_id: liveClassId,
          force_disconnect: true
        })
      });

      if (!terminationResponse.ok) {
        const terminationResult = await terminationResponse.json();
        throw new Error(terminationResult.error || 'Failed to terminate meeting');
      }

      const terminationResult = await terminationResponse.json();
      
      // Show success message
      alert(`Class ended successfully! ${terminationResult.message}`);
      
      // Refresh data to show updated status
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while ending the class';
      setError(errorMessage);
      console.error('Error ending class with meeting termination:', error);
    }
  }, [fetchData]);

  // Auto-join functionality
  const handleAutoJoin = useCallback(async (liveClass: LiveClass) => {
    if (!liveClass.meeting_link) {
      // Generate link first
      await handleGenerateMeetingLink(liveClass.live_class_id);
      // Wait a moment for the link to be generated
      setTimeout(() => {
        fetchData();
      }, 1000);
      return;
    }

    // Open meeting in new tab
    window.open(liveClass.meeting_link, '_blank');
    
    // Update status to ongoing if not already
    if (liveClass.status === 'scheduled') {
      await handleUpdateStatus(liveClass.live_class_id, 'ongoing');
    }
  }, [handleGenerateMeetingLink, handleUpdateStatus, fetchData]);

  const handleDeleteLiveClass = async (liveClassId: string) => {
    if (!confirm('Are you sure you want to delete this live class?')) return;

    try {
      const response = await fetch(`/api/live-classes?id=${liveClassId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete live class');
      }

      fetchData(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleAutoStatusUpdate = useCallback(async () => {
    try {
      const response = await fetch('/api/live-classes/auto-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update statuses');
      }
      
      await fetchData(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, [fetchData]);

  // Memoized countdown calculation function
  const calculateNextClassCountdown = useCallback(() => {
    if (liveClasses.length === 0) return;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];
    
    const nextClass = liveClasses.find(lc => {
      if (lc.status !== 'scheduled') return false;
      if (lc.scheduled_date !== today) return false;
      return lc.start_time > currentTime;
    });
    
    if (nextClass) {
      const [hours, minutes] = nextClass.start_time.split(':');
      const classTime = new Date();
      classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const diffMs = classTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes > 0) {
        setNextClassCountdown(diffMinutes);
      } else {
        setNextClassCountdown(null);
      }
    } else {
      setNextClassCountdown(null);
    }
  }, [liveClasses]);

  // Initial data fetch - only run once on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Include fetchData to satisfy ESLint

  // Set up automatic status checking every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoStatusUpdate();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [handleAutoStatusUpdate]);

  // Set up countdown timer every minute
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      if (liveClasses.length > 0) {
        calculateNextClassCountdown();
      }
    }, 60000); // Update every minute

    return () => clearInterval(countdownInterval);
  }, [liveClasses.length, calculateNextClassCountdown]);

  // Update countdown when liveClasses change
  useEffect(() => {
    calculateNextClassCountdown();
  }, [calculateNextClassCountdown]);

  // Update countdown when liveClasses change
  useEffect(() => {
    calculateNextClassCountdown();
  }, [calculateNextClassCountdown]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeUntilClass = (scheduledDate: string, startTime: string) => {
    const now = new Date();
    const classDate = new Date(scheduledDate);
    const [hours, minutes] = startTime.split(':');
    classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const diffMs = classDate.getTime() - now.getTime();
    if (diffMs <= 0) return 'Starting now';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `in ${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `in ${diffHours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Loading your live classes...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your schedule</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        Please log in to view your live classes.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Live Classes</h1>
          <p className="text-gray-600">Manage and join your scheduled live class sessions</p>
          
          {/* Next Class Countdown */}
          {nextClassCountdown !== null && nextClassCountdown > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">
                  Your next class starts in {nextClassCountdown} minutes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setError('');
                    fetchData();
                  }}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => setError('')}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={handleAutoStatusUpdate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            Update Statuses
          </button>
          
          <button
            onClick={() => setAutoJoinEnabled(!autoJoinEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              autoJoinEnabled 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            {autoJoinEnabled ? 'Auto-Join Enabled' : 'Enable Auto-Join'}
          </button>
        </div>

        {/* Live Classes Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Your Live Classes
          </h2>
          
          {liveClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No live classes scheduled yet.</p>
              <p className="text-sm">Contact an administrator to schedule your first live class.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-semibold">Title</th>
                    <th className="p-3 text-left font-semibold">Date & Time</th>
                    <th className="p-3 text-left font-semibold">Subject</th>
                    <th className="p-3 text-left font-semibold">Level</th>
                    <th className="p-3 text-left font-semibold">Platform</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                    <th className="p-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liveClasses.map((liveClass) => {
                    const timeUntilClass = getTimeUntilClass(liveClass.scheduled_date, liveClass.start_time);
                    const isStartingSoon = liveClass.status === 'scheduled' && timeUntilClass.includes('Starting now');
                    
                    return (
                      <tr key={liveClass.live_class_id} className={`border-b ${isStartingSoon ? 'bg-yellow-50' : ''}`}>
                        <td className="p-3">
                          <div className="font-medium">{liveClass.title}</div>
                          <div className="text-sm text-gray-500">{liveClass.description}</div>
                          {isStartingSoon && (
                            <div className="text-xs text-yellow-600 font-medium mt-1">
                              ⚡ Starting now!
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div>{new Date(liveClass.scheduled_date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500">{liveClass.start_time} - {liveClass.end_time}</div>
                          {liveClass.status === 'scheduled' && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              {timeUntilClass}
                            </div>
                          )}
                        </td>
                        <td className="p-3">{liveClass.subjects?.name}</td>
                        <td className="p-3">{liveClass.levels?.name}</td>
                        <td className="p-3">{liveClass.meeting_platform}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(liveClass.status)}`}>
                            {liveClass.status}
                          </span>
                          {liveClass.started_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              Started: {new Date(liveClass.started_at).toLocaleTimeString()}
                            </div>
                          )}
                          {/* TODO: Uncomment when meeting_terminated_at field is added to database
                          {liveClass.status === 'completed' && liveClass.meeting_terminated_at && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              ✓ Meeting terminated
                            </div>
                          )}
                          */}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 flex-wrap">
                            {liveClass.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(liveClass.live_class_id, 'ongoing')}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Start Class"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                                {autoJoinEnabled && isStartingSoon && (
                                  <button
                                    onClick={() => handleAutoJoin(liveClass)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-purple-600 text-white hover:bg-purple-700"
                                    title="Auto-Join Class"
                                  >
                                    <Users className="w-3.5 h-3.5" /> Auto-Join
                                  </button>
                                )}
                              </>
                            )}
                            {liveClass.status === 'ongoing' && (
                              <>
                                {liveClass.meeting_link ? (
                                  <a
                                    href={liveClass.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                    title="Join Class (opens in new tab)"
                                  >
                                    <Video className="w-3.5 h-3.5" /> Join
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => handleGenerateMeetingLink(liveClass.live_class_id)}
                                    disabled={generatingLinks.has(liveClass.live_class_id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
                                    title="Generate meeting link"
                                  >
                                    {generatingLinks.has(liveClass.live_class_id) ? 'Generating…' : 'Generate Link'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEndClassWithMeetingTermination(liveClass.live_class_id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                                  title="End Class & Terminate Meeting"
                                >
                                  <Play className="w-3.5 h-3.5 rotate-90" /> End Class
                                </button>
                              </>
                            )}
                            {liveClass.status === 'completed' && (
                              <div className="text-xs text-gray-500">
                                {liveClass.ended_at ? 
                                  `Ended at ${new Date(liveClass.ended_at).toLocaleTimeString()}` : 
                                  'Completed'
                                }
                              </div>
                            )}
                            <button
                              onClick={() => handleDeleteLiveClass(liveClass.live_class_id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete Class"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Debug Log (only show in development) */}
        {process.env.NODE_ENV === 'development' && debugLog.length > 0 && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Debug Log:</h3>
            <div className="text-sm font-mono">
              {debugLog.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
