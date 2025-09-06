'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Video, Play, Pause, Trash2, TrendingUp, Clock, Users, Bell, AlertCircle } from 'lucide-react';
import AdminLiveClassModal from '@/components/AdminLiveClassModal';
import { useToast } from '@/components/ui/ToastProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { canStartLiveClass, getStartTimeMessage, getClassStatus, getTimeUntilClass } from '@/utils/timeValidation';

export interface LiveClass {
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
  teachers?: { users?: { first_name: string; last_name: string } };
  levels?: { name: string };
  subjects?: { name: string };
  programs?: { name: string };
  papers?: { paper_name: string; paper_code: string };
}

interface Props {
  initialLiveClasses: LiveClass[];
  levels: Array<Record<string, unknown>>;
  subjects: Array<Record<string, unknown>>;
  teachers: Array<Record<string, unknown>>;
  programs: Array<Record<string, unknown>>;
  papers: Array<Record<string, unknown>>;
}

export default function AdminLiveClassesClient({ initialLiveClasses, levels, subjects, teachers, programs, papers }: Props) {
  const { toast } = useToast();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>(initialLiveClasses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [generatingLinks, setGeneratingLinks] = useState<Set<string>>(new Set());
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; liveClassId: string | null }>({ isOpen: false, liveClassId: null });
  // countdown is computed from data to avoid desync

  const fetchData = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/live-classes?expand=1', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch live classes');
      setLiveClasses(json.data || []);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage || 'Failed to fetch');
      toast({ title: 'Error', description: errorMessage || 'Failed to fetch', variant: 'error' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  const handleUpdateStatus = useCallback(async (liveClassId: string, newStatus: string, scheduledDate?: string, startTime?: string, endTime?: string) => {
    try {
      // If trying to start a class, validate the time first
      if (newStatus === 'ongoing' && scheduledDate && startTime && endTime) {
        const validation = canStartLiveClass(scheduledDate, startTime, endTime, false);
        
        if (!validation.canStart) {
          setError(validation.reason);
          toast({ title: 'Cannot Start Class', description: validation.reason, variant: 'error' });
          return;
        }
      }

      setLoading(true);
      const response = await fetch(`/api/live-classes?id=${liveClassId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'Failed to update status');
      toast({ title: 'Updated', description: 'Class status updated' });
      fetchData(true);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage || 'Failed to update');
      toast({ title: 'Error', description: errorMessage || 'Failed to update', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchData, toast]);

  const handleDeleteLiveClass = useCallback(async (liveClassId: string) => {
    setDeleteConfirm({ isOpen: true, liveClassId });
  }, []);

  const confirmDeleteLiveClass = useCallback(async () => {
    if (!deleteConfirm.liveClassId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/live-classes?id=${deleteConfirm.liveClassId}`, { method: 'DELETE' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'Failed to delete');
      toast({ title: 'Deleted', description: 'Live class removed', variant: 'success' });
      fetchData(true);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage || 'Failed to delete');
      toast({ title: 'Error', description: errorMessage || 'Failed to delete', variant: 'error' });
    } finally {
      setLoading(false);
      setDeleteConfirm({ isOpen: false, liveClassId: null });
    }
  }, [deleteConfirm.liveClassId, fetchData, toast]);

  const handleGenerateMeetingLink = useCallback(async (liveClassId: string) => {
    try {
      setGeneratingLinks(prev => new Set(prev).add(liveClassId));
      const response = await fetch('/api/live-classes/generate-meeting-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_class_id: liveClassId, platform: 'Jitsi Meet' })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'Failed to generate meeting link');
      toast({ title: 'Link generated', description: 'Meeting link is ready' });
      await fetchData(true);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage || 'Failed to generate');
      toast({ title: 'Error', description: errorMessage || 'Failed to generate', variant: 'error' });
    } finally {
      setGeneratingLinks(prev => { const next = new Set(prev); next.delete(liveClassId); return next; });
    }
  }, [fetchData, toast]);

  const handleAutoStatusUpdate = useCallback(async () => {
    if (error || loading) return;
    try {
      const response = await fetch('/api/live-classes/auto-status', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Failed to update statuses');
      await fetchData(true);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Auto update failed', description: errorMessage || 'Failed', variant: 'error' });
    }
  }, [error, loading, fetchData, toast]);

  const handleAutoJoin = useCallback(async (lc: LiveClass) => {
    if (!lc.meeting_link) {
      await handleGenerateMeetingLink(lc.live_class_id);
      setTimeout(() => fetchData(true), 1000);
      return;
    }
    window.open(lc.meeting_link, '_blank');
    if (lc.status === 'scheduled') await handleUpdateStatus(lc.live_class_id, 'ongoing', lc.scheduled_date, lc.start_time);
  }, [handleGenerateMeetingLink, handleUpdateStatus, fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const nextClassCountdown = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0] || now.toISOString();
    const currentTime = now.toTimeString().split(' ')[0] || '';
    const nextClass = liveClasses.find(lc => lc.status === 'scheduled' && lc.scheduled_date === today && lc.start_time > currentTime);
    if (!nextClass) return null as number | null;
    const [h, m] = nextClass.start_time.split(':');
    if (!h || !m) return null as number | null;
    const t = new Date(); t.setHours(parseInt(h), parseInt(m), 0, 0);
    const diffMin = Math.floor((t.getTime() - now.getTime()) / (1000 * 60));
    return diffMin > 0 ? diffMin : null;
  }, [liveClasses]);

  useEffect(() => {
    const interval = setInterval(() => handleAutoStatusUpdate(), 30000);
    return () => clearInterval(interval);
  }, [handleAutoStatusUpdate]);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Live Classes Management</h1>
          <p className="text-lg text-gray-600">Schedule and manage live class sessions and attendance</p>
          {nextClassCountdown !== null && nextClassCountdown > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Next class starts in {nextClassCountdown} minutes</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setError(''); setLoading(true); fetchData(); }} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">Retry</button>
                <button onClick={() => setError('')} className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">Dismiss</button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex gap-4 flex-wrap">
          <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Schedule Live Class
          </button>
          <button onClick={handleAutoStatusUpdate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Play className="w-4 h-4" /> Update Statuses
          </button>
          <button onClick={() => setAutoJoinEnabled(!autoJoinEnabled)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${autoJoinEnabled ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-600 text-white hover:bg-gray-700'}`}>
            <Bell className="w-4 h-4" /> {autoJoinEnabled ? 'Auto-Join Enabled' : 'Enable Auto-Join'}
          </button>
          <a href="/admin/live-classes/analytics" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <TrendingUp className="w-4 h-4" /> View Analytics
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Video className="w-5 h-5" /> Live Classes</h2>
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
                {liveClasses.map(lc => {
                  const timeUntilClass = getTimeUntilClass(lc.scheduled_date, lc.start_time);
                  const isStartingNow = lc.status === 'scheduled' && timeUntilClass.includes('Starting now');
                  return (
                    <tr key={lc.live_class_id} className={`border-b ${isStartingNow ? 'bg-yellow-50' : ''}`}>
                      <td className="p-3">
                        <div className="font-medium">{lc.title}</div>
                        <div className="text-sm text-gray-500">{lc.description}</div>
                        {isStartingNow && <div className="text-xs text-yellow-600 font-medium mt-1">⚡ Starting now!</div>}
                      </td>
                      <td className="p-3">
                        <div>{new Date(lc.scheduled_date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{lc.start_time} - {lc.end_time}</div>
                        {lc.status === 'scheduled' && <div className="text-xs text-blue-600 font-medium mt-1">{timeUntilClass}</div>}
                      </td>
                      <td className="p-3">
                        {lc.subjects?.name || lc.papers?.paper_name || 'Not specified'}
                      </td>
                      <td className="p-3">{lc.levels?.name}</td>
                      <td className="p-3">{lc.teachers?.users?.first_name} {lc.teachers?.users?.last_name}</td>
                      <td className="p-3">{lc.meeting_platform}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lc.status)}`}>{lc.status}</span>
                        {lc.started_at && <div className="text-xs text-gray-500 mt-1">Started: {new Date(lc.started_at).toLocaleTimeString()}</div>}
                        {lc.status === 'scheduled' && (
                          <div className="text-xs text-blue-600 mt-1">
                            {getStartTimeMessage(lc.scheduled_date, lc.start_time, lc.end_time)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 flex-wrap">
                          {lc.status === 'scheduled' && (
                            <>
                              {(() => {
                                const validation = canStartLiveClass(lc.scheduled_date, lc.start_time, lc.end_time, false);
                                return (
                                  <button 
                                    onClick={() => handleUpdateStatus(lc.live_class_id, 'ongoing', lc.scheduled_date, lc.start_time)} 
                                    className={`p-1 ${validation.canStart ? 'text-green-600 hover:text-green-800' : 'text-gray-400 cursor-not-allowed'}`} 
                                    title={getStartTimeMessage(lc.scheduled_date, lc.start_time, lc.end_time)}
                                    disabled={!validation.canStart}
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                );
                              })()}
                              {autoJoinEnabled && isStartingNow && (
                                <button onClick={() => handleAutoJoin(lc)} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-purple-600 text-white hover:bg-purple-700" title="Auto-Join Class"><Users className="w-3.5 h-3.5" /> Auto-Join</button>
                              )}
                            </>
                          )}
                          {lc.status === 'ongoing' && (
                            <>
                              {lc.meeting_link ? (
                                <div className="flex gap-1">
                                  <a href={lc.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700" title="Join Teacher"><Video className="w-3.5 h-3.5" /> Join</a>
                                  <a href={lc.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700" title="Join Student"><Video className="w-3.5 h-3.5" /> Student</a>
                                </div>
                              ) : (
                                <button onClick={() => handleGenerateMeetingLink(lc.live_class_id)} disabled={generatingLinks.has(lc.live_class_id)} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50" title="Generate meeting link">{generatingLinks.has(lc.live_class_id) ? 'Generating…' : 'Generate Link'}</button>
                              )}
                              <button onClick={() => handleUpdateStatus(lc.live_class_id, 'completed')} className="p-1 text-blue-600 hover:text-blue-800" title="End Class"><Pause className="w-4 h-4" /></button>
                            </>
                          )}
                          {lc.status === 'completed' && (
                            <div className="text-xs text-gray-500">{lc.ended_at ? `Ended at ${new Date(lc.ended_at).toLocaleTimeString()}` : 'Completed'}</div>
                          )}
                          <button onClick={() => handleDeleteLiveClass(lc.live_class_id)} className="p-1 text-red-600 hover:text-red-800" title="Delete Class"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showCreateForm && (
          <AdminLiveClassModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => { setShowCreateForm(false); fetchData(); }}
            programs={programs}
            levels={levels}
            subjects={subjects}
            teachers={teachers}
            papers={papers}
          />
        )}

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, liveClassId: null })}
          onConfirm={confirmDeleteLiveClass}
          title="Delete Live Class"
          message="Are you sure you want to delete this live class? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={loading}
        />
      </div>
    </div>
  );
}


