'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Video, Trash2 } from 'lucide-react';
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
          levels: item.levels ?? null,
          subjects: item.subjects ?? null,
          programs: item.programs ?? null,
          papers: item.papers ?? null
        }))
      );
    } catch (error: any) {
      setDebugLog(log => [...log, `Error: ${error?.message}`]);
      const appError = errorHandler.handleSupabaseError(error, 'fetch_teacher_live_classes', user?.id || '');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    
    // Set up automatic status checking every 30 seconds
    const interval = setInterval(() => {
      // Trigger auto status update
      fetch('/api/live-classes/auto-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(() => {
        // Refresh data after status update
        fetchData();
      }).catch(console.error);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [fetchData]);


  // handleUpdateStatus removed as it was unused

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
    } catch (error: any) {
      setError(error?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMeetingLink = async (liveClassId: string) => {
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // fetch is already handled above when dependencies change

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading live classes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Live Classes</h1>
          <p className="text-gray-600">Schedule and manage your live class sessions</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {/* Debug Log */}
        {debugLog && debugLog.length > 0 && (
          <details className="mb-6 p-4 bg-gray-100 border border-gray-300 text-gray-800 rounded text-xs whitespace-pre-wrap">
            <summary>Debug Log</summary>
            {debugLog.map((line, i) => <div key={i}>{line}</div>)}
          </details>
        )}
  {/* Action Buttons removed for teachers */}

        {/* Live Classes Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            My Live Classes
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Title</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Start</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">End</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Level</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Subject</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Program</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {liveClasses.map((liveClass) => (
                  <tr key={liveClass.live_class_id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{liveClass.title}</td>
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{liveClass.scheduled_date}</td>
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{liveClass.start_time}</td>
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{liveClass.end_time}</td>
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{liveClass.levels?.name || ''}</td>
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{liveClass.subjects?.name || ''}</td>
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{liveClass.programs?.name || ''}</td>
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(liveClass.status)}`}>{liveClass.status}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                      <div className="flex gap-2 items-center flex-wrap">
                        {liveClass.status === 'ongoing' && (
                          liveClass.meeting_link ? (
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
                          )
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

  {/* Create Live Class Modal removed for teachers */}
      </div>
    </div>
  );
}
