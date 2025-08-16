'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Video, Play, Pause, Trash2, TrendingUp, Clock, Users, Bell } from 'lucide-react';
import AdminLiveClassModal from '@/components/AdminLiveClassModal';
import { errorHandler } from '@/lib/errorHandler';

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
  teachers?: { teacher_id: string; users?: { first_name: string; last_name: string } };
  levels?: { name: string };
  subjects?: { name: string };
  programs?: { name: string };
  papers?: { paper_name: string; paper_code: string };
}

export default function AdminLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [levels, setLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [generatingLinks, setGeneratingLinks] = useState<Set<string>>(new Set());
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(false);
  const [nextClassCountdown, setNextClassCountdown] = useState<number | null>(null);

  // form state handled inside AdminLiveClassModal

  const fetchData = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Fetch reference data first
      const [levelsRes, subjectsRes, teachersRes, programsRes, papersRes] = await Promise.all([
        supabase.from('levels').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('teachers').select('*, users(first_name, last_name)'),
        supabase.from('programs').select('*'),
        supabase.from('subject_papers').select('*')
      ]);

      // Check for errors in reference data
      if (levelsRes.error) throw new Error('Error fetching levels: ' + levelsRes.error.message);
      if (subjectsRes.error) throw new Error('Error fetching subjects: ' + subjectsRes.error.message);
      if (teachersRes.error) throw new Error('Error fetching teachers: ' + teachersRes.error.message);
      if (programsRes.error) throw new Error('Error fetching programs: ' + programsRes.error.message);
      if (papersRes.error) throw new Error('Error fetching papers: ' + papersRes.error.message);

      // Set reference data
      setLevels(levelsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
      setPrograms(programsRes.data || []);
      setPapers(papersRes.data || []);

      // Now fetch live classes with proper relations
      const { data: liveClassData, error: liveClassError } = await supabase
        .from('live_classes')
        .select(`
          *,
          teachers:teacher_id (
            *,
            users (
              first_name,
              last_name
            )
          ),
          subjects:subject_id (
            *
          ),
          levels:level_id (
            *
          ),
          programs:program_id (
            *
          ),
          papers:paper_id (
            *
          )
        `)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (liveClassError) throw liveClassError;

      // Normalize rows to match LiveClass interface
      const normalizedLiveClasses: LiveClass[] = (liveClassData || []).map((row: any) => ({
        live_class_id: row.live_class_id ?? '',
        title: row.title ?? '',
        description: row.description ?? '',
        scheduled_date: row.scheduled_date ?? '',
        start_time: row.start_time ?? '',
        end_time: row.end_time ?? '',
        meeting_link: row.meeting_link ?? '',
        meeting_platform: row.meeting_platform ?? 'Zoom',
        status: row.status ?? 'scheduled',
        started_at: row.started_at ?? null,
        ended_at: row.ended_at ?? null,
        max_participants: typeof row.max_participants === 'number' ? row.max_participants : 0,
        teacher_id: row.teacher_id ?? '',
        level_id: row.level_id ?? '',
        subject_id: row.subject_id ?? '',
        program_id: row.program_id ?? '',
        paper_id: row.paper_id ?? '',
        teachers: row.teachers ?? undefined,
        levels: row.levels ?? undefined,
        subjects: row.subjects ?? undefined,
        programs: row.programs ?? undefined,
        papers: row.papers ?? undefined,
      }));

      setLiveClasses(normalizedLiveClasses);

    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Handle authentication errors specifically
      if (error instanceof Error && error.message.includes('Authentication required')) {
        setError('Your session has expired. Please log in again.');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        const appError = errorHandler.handleSupabaseError(error, 'fetch_admin_live_classes', 'admin');
        setError(appError.message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);



  // creation handled inside AdminLiveClassModal

  const handleUpdateStatus = useCallback(async (liveClassId: string, newStatus: string) => {
    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const handleDeleteLiveClass = async (liveClassId: string) => {
    if (!confirm('Are you sure you want to delete this live class?')) return;

    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

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

  const handleAutoStatusUpdate = useCallback(async () => {
    // Don't run if there's already an error
    if (error) {
      console.log('[handleAutoStatusUpdate] Skipping due to existing error:', error);
      return;
    }

    try {
      const response = await fetch('/api/live-classes/auto-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update statuses');
      }
      
      await fetchData(true); // silent refresh to avoid disrupting forms
    } catch (error) {
      console.error('[handleAutoStatusUpdate] Error:', error);
      // Only set error if it's not an authentication issue
      if (error instanceof Error && !error.message.includes('Authentication required')) {
        setError(error.message || 'An error occurred during status update');
      }
    } finally {
      // keep UI state as-is during background refresh
    }
  }, [fetchData, error]);

  // Auto-join functionality
  const handleAutoJoin = useCallback(async (liveClass: LiveClass) => {
    if (!liveClass.meeting_link) {
      // Generate link first
      await handleGenerateMeetingLink(liveClass.live_class_id);
      // Wait a moment for the link to be generated
      setTimeout(() => {
        fetchData(true);
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

  // Memoized countdown calculation to avoid circular dependencies
  const calculateCountdown = useCallback(() => {
    if (liveClasses.length > 0) {
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
    }
  }, [liveClasses]);

  useEffect(() => {
    // Only fetch data if we don't have an error
    if (!error) {
      fetchData();
    }
    
    // Set up automatic status checking every 30 seconds
    const interval = setInterval(() => {
      // Do not auto-refresh while the scheduling modal is open or if there's an error
      if (!showCreateForm && !error) {
        handleAutoStatusUpdate();
      }
    }, 30000); // Check every 30 seconds

    // Set up countdown timer every minute
    const countdownInterval = setInterval(() => {
      calculateCountdown();
    }, 60000); // Update every minute

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [fetchData, handleAutoStatusUpdate, showCreateForm, calculateCountdown, error]);

  // Update countdown when liveClasses change - separate effect to avoid circular dependency
  useEffect(() => {
    calculateCountdown();
  }, [calculateCountdown]);

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
        <div className="text-lg">Loading live classes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Live Classes Management</h1>
          <p className="text-lg text-gray-600">Schedule and manage live class sessions and attendance</p>
          
          {/* Next Class Countdown */}
          {nextClassCountdown !== null && nextClassCountdown > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">
                  Next class starts in {nextClassCountdown} minutes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => {
                  setError('');
                  fetchData();
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule Live Class
          </button>
          
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
          
          <a
            href="/admin/live-classes/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            View Analytics
          </a>
        </div>

        {/* Live Classes Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Live Classes
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold">Title</th>
                  <th className="p-3 text-left font-semibold">Date & Time</th>
                  <th className="p-3 text-left font-semibold">Subject</th>
                  <th className="p-3 text-left font-semibold">Level</th>
                  <th className="p-3 text-left font-semibold">Teacher</th>
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
                      <td className="p-3">
                        {liveClass.teachers?.users?.first_name} {liveClass.teachers?.users?.last_name}
                      </td>
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
                                <div className="flex gap-1">
                                  <a
                                    href={liveClass.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                    title="Join as Teacher (opens in new tab)"
                                  >
                                    <Video className="w-3.5 h-3.5" /> Join
                                  </a>
                                  <a
                                    href={liveClass.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                                    title="Join as Student (opens in new tab)"
                                  >
                                    <Video className="w-3.5 h-3.5" /> Student
                                  </a>
                                </div>
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
                                onClick={() => handleUpdateStatus(liveClass.live_class_id, 'completed')}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="End Class"
                              >
                                <Pause className="w-4 h-4" />
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
        </div>

        {/* Create Live Class Modal */}
        {showCreateForm && (
          <AdminLiveClassModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchData();
            }}
            programs={programs}
            levels={levels}
            subjects={subjects}
            teachers={teachers}
            papers={papers}
          />
        )}
      </div>
    </div>
  );
}
