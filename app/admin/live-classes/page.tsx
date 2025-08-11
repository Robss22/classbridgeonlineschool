'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Video, Play, Pause, Trash2 } from 'lucide-react';
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

  // form state handled inside AdminLiveClassModal

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

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
      const appError = errorHandler.handleSupabaseError(error, 'fetch_admin_live_classes', 'admin');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  // creation handled inside AdminLiveClassModal

  const handleUpdateStatus = async (liveClassId: string, newStatus: string) => {
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
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Classes Management</h1>
          <p className="text-gray-600">Schedule and manage live class sessions and attendance</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule Live Class
          </button>
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
                {liveClasses.map((liveClass) => (
                  <tr key={liveClass.live_class_id} className="border-b">
                    <td className="p-3">
                      <div className="font-medium">{liveClass.title}</div>
                      <div className="text-sm text-gray-500">{liveClass.description}</div>
                    </td>
                    <td className="p-3">
                      <div>{new Date(liveClass.scheduled_date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{liveClass.start_time} - {liveClass.end_time}</div>
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
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {liveClass.status === 'scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(liveClass.live_class_id, 'ongoing')}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Start Class"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {liveClass.status === 'ongoing' && (
                          <button
                            onClick={() => handleUpdateStatus(liveClass.live_class_id, 'completed')}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="End Class"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
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
