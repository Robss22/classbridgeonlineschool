'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Video, Play, Pause, Trash2 } from 'lucide-react';
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
  max_participants: number;
  teacher_id: string;
  level_id: string;
  subject_id: string;
  academic_year: string;
  teachers?: { teacher_id: string; users?: { first_name: string; last_name: string } };
  levels?: { name: string };
  subjects?: { name: string };
}

export default function AdminLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [levels, setLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    meeting_link: '',
    meeting_platform: 'Zoom',
    max_participants: 50,
    teacher_id: '',
    level_id: '',
    subject_id: '',
    academic_year: new Date().getFullYear().toString(),
    status: 'scheduled'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch live classes
      const { data: liveClassData, error: liveClassError } = await supabase
        .from('live_classes')
        .select(`
          *,
          teachers:teacher_id (teacher_id, users:user_id (first_name, last_name)),
          levels:level_id (name),
          subjects:subject_id (name)
        `)
        .order('scheduled_date, start_time');

      if (liveClassError) throw liveClassError;

      // Fetch reference data
      const [levelsRes, subjectsRes, teachersRes] = await Promise.all([
        supabase.from('levels').select('level_id, name'),
        supabase.from('subjects').select('subject_id, name'),
        supabase.from('teachers').select('teacher_id, users:user_id (first_name, last_name)')
      ]);

      setLiveClasses(liveClassData || []);
      setLevels(levelsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);

    } catch (error) {
      const appError = errorHandler.handleSupabaseError(error, 'fetch_admin_live_classes', 'admin');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await fetch('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create live class');
      }

      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        scheduled_date: '',
        start_time: '',
        end_time: '',
        meeting_link: '',
        meeting_platform: 'Zoom',
        max_participants: 50,
        teacher_id: '',
        level_id: '',
        subject_id: '',
        academic_year: new Date().getFullYear().toString(),
        status: 'scheduled'
      });
      
      fetchData(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Schedule Live Class</h3>
              <form onSubmit={handleCreateLiveClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={formData.academic_year}
                      onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Level</label>
                  <select
                    value={formData.level_id}
                    onChange={(e) => setFormData({...formData, level_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Level</option>
                    {levels.map((level: any) => (
                      <option key={level.level_id} value={level.level_id}>{level.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject: any) => (
                      <option key={subject.subject_id} value={subject.subject_id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Teacher</label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher: any) => (
                      <option key={teacher.teacher_id} value={teacher.teacher_id}>
                        {teacher.users?.first_name} {teacher.users?.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Meeting Platform</label>
                    <select
                      value={formData.meeting_platform}
                      onChange={(e) => setFormData({...formData, meeting_platform: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="Zoom">Zoom</option>
                      <option value="Google Meet">Google Meet</option>
                      <option value="Teams">Teams</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Participants</label>
                    <input
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                      className="w-full border rounded-lg px-3 py-2"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Meeting Link</label>
                  <input
                    type="url"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Schedule Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
