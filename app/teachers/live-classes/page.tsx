'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Plus, Trash2, Video } from 'lucide-react';

export default function TeacherLiveClassesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [liveClasses, setLiveClasses] = useState<any[]>([
    {
      id: 1,
      start_time: '09:00',
      end_time: '10:00',
      created_at: new Date().toISOString(),
      subjects: { name: 'Mathematics' },
      levels: { name: 'Grade 1' }
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<any[]>([
    { program_id: 1, name: 'Primary Education', description: 'Primary level education' },
    { program_id: 2, name: 'Secondary Education', description: 'Secondary level education' }
  ]);
  const [levels, setLevels] = useState<any[]>([
    { level_id: 1, name: 'Grade 1', description: 'First grade' },
    { level_id: 2, name: 'Grade 2', description: 'Second grade' }
  ]);
  const [subjects, setSubjects] = useState<any[]>([
    { subject_id: 1, name: 'Mathematics', description: 'Math subject' },
    { subject_id: 2, name: 'Science', description: 'Science subject' }
  ]);

  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    program_id: '',
    level_id: '',
    subject_id: ''
  });

  const fetchData = useCallback(async () => {
    // Check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using existing mock data');
      return; // Keep existing mock data
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch programs, levels, and subjects
      const [programsResponse, levelsResponse, subjectsResponse] = await Promise.all([
        supabase.from('programs').select('*').order('name'),
        supabase.from('levels').select('*').order('name'),
        supabase.from('subjects').select('*').order('name')
      ]);

      if (programsResponse.error) throw programsResponse.error;
      if (levelsResponse.error) throw levelsResponse.error;
      if (subjectsResponse.error) throw subjectsResponse.error;

      setPrograms(programsResponse.data || []);
      setLevels(levelsResponse.data || []);
      setSubjects(subjectsResponse.data || []);

      // Fetch live classes
      const liveClassesResponse = await supabase
        .from('live_classes')
        .select(`
          *,
          subjects!subject_id (name),
          levels!level_id (name)
        `)
        .order('created_at', { ascending: false });

      if (liveClassesResponse.error) throw liveClassesResponse.error;

      setLiveClasses(liveClassesResponse.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.log('Using fallback mock data due to Supabase error');
      
      // Fallback to mock data if Supabase fails
      setPrograms([
        { program_id: 1, name: 'Primary Education', description: 'Primary level education' },
        { program_id: 2, name: 'Secondary Education', description: 'Secondary level education' }
      ]);
      setLevels([
        { level_id: 1, name: 'Grade 1', description: 'First grade' },
        { level_id: 2, name: 'Grade 2', description: 'Second grade' }
      ]);
      setSubjects([
        { subject_id: 1, name: 'Mathematics', description: 'Math subject' },
        { subject_id: 2, name: 'Science', description: 'Science subject' }
      ]);
      setLiveClasses([
        {
          id: 1,
          start_time: '09:00',
          end_time: '10:00',
          created_at: new Date().toISOString(),
          subjects: { name: 'Mathematics' },
          levels: { name: 'Grade 1' }
        }
      ]);
      
      // Ensure loading is set to false
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    
    try {
      const response = await fetch('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create live class');
      }

      // Close form and reset data
      setShowCreateForm(false);
      setFormData({
        start_time: '',
        end_time: '',
        program_id: '',
        level_id: '',
        subject_id: ''
      });
      
      // Refresh data to show the new live class
      fetchData();
      alert('Live class created successfully!');
    } catch (error: any) {
      console.error('Error creating live class:', error);
      alert('Failed to create live class: ' + (error?.message || 'Unknown error'));
    }
  };

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

      // Refresh data to remove the deleted live class
      fetchData();
      alert('Live class deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting live class:', error);
      alert('Failed to delete live class: ' + (error?.message || 'Unknown error'));
    }
  };

  console.log('Component rendering with data:', { programs: programs.length, levels: levels.length, subjects: subjects.length });

  // Show loading state only if we have no data at all
  if (programs.length === 0 && levels.length === 0 && subjects.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Live Classes</h1>
          <p className="text-gray-600">Schedule and manage your live class sessions</p>
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
            My Live Classes
          </h2>
          
          {liveClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No live classes scheduled yet. Click "Schedule Live Class" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-semibold">Time</th>
                    <th className="p-3 text-left font-semibold">Subject</th>
                    <th className="p-3 text-left font-semibold">Level</th>
                    <th className="p-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liveClasses.map((liveClass) => (
                    <tr key={liveClass.id} className="border-b">
                      <td className="p-3">
                        <div className="font-medium">{liveClass.start_time} - {liveClass.end_time}</div>
                        <div className="text-sm text-gray-500">{new Date(liveClass.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-3">{liveClass.subjects?.name}</td>
                      <td className="p-3">{liveClass.levels?.name}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteLiveClass(liveClass.id)}
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
          )}
        </div>

        {/* Create Live Class Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Schedule Live Class</h3>
              <form onSubmit={handleCreateLiveClass} className="space-y-4">
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
                  <label className="block text-sm font-medium mb-1">Program</label>
                  <select
                    value={formData.program_id || ''}
                    onChange={(e) => setFormData({...formData, program_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map((program: any) => (
                      <option key={program.program_id} value={program.program_id}>{program.name}</option>
                    ))}
                  </select>
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
