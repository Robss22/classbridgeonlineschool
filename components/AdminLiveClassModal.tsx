"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AdminLiveClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
  programs: Array<Record<string, unknown>>;
  levels: Array<Record<string, unknown>>;
  subjects: Array<Record<string, unknown>>;
  teachers: Array<Record<string, unknown>>;
  papers: Array<Record<string, unknown>>;
}

export default function AdminLiveClassModal({
  onClose,
  onSuccess,
  programs,
  levels,
  subjects,
  teachers,
  papers,
}: AdminLiveClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchedPapers, setFetchedPapers] = useState<Array<Record<string, unknown>>>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Array<Record<string, unknown>>>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  

  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    meeting_link: '',
    meeting_platform: 'Jitsi Meet',
    max_participants: 50,
    teacher_id: '',
    program_id: '',
    level_id: '',
    subject_id: '',
    paper_id: '',
    status: 'scheduled',
  });

  // Function to fetch teachers based on level and subject
  const fetchTeachersForLevelAndSubject = async (levelId: string, subjectId: string) => {
    if (!levelId || !subjectId) {
      setFilteredTeachers([]);
      return;
    }

    setLoadingTeachers(true);
    try {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select(`
          teacher_id,
          teachers!inner (
            teacher_id,
            users!inner (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('level_id', levelId)
        .eq('subject_id', subjectId);

      if (error) {
        console.error('Error fetching teachers:', error);
        setFilteredTeachers([]);
        return;
      }

      // Transform the data and remove duplicates based on teacher_id
      const teacherMap = new Map();
      (data || []).forEach((assignment: Record<string, unknown>) => {
        const teacherId = assignment.teacher_id;
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            teacher_id: assignment.teacher_id,
            users: (assignment.teachers as Record<string, unknown>)?.users
          });
        }
      });

      const transformedTeachers = Array.from(teacherMap.values());
      setFilteredTeachers(transformedTeachers);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setFilteredTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Effect to fetch teachers when level or subject changes
  useEffect(() => {
    if (formData.level_id && formData.subject_id) {
      fetchTeachersForLevelAndSubject(formData.level_id, formData.subject_id);
    } else {
      setFilteredTeachers([]);
    }
  }, [formData.level_id, formData.subject_id]);

  // Effect to clear teacher selection when level or subject changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, teacher_id: '' }));
  }, [formData.level_id, formData.subject_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await fetch('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create live class');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Try to fetch papers on-demand for selected subject if none were passed in props
  useEffect(() => {
    const loadPapersIfMissing = async () => {
      if (!formData.subject_id) return;
      const hasLocal = papers.some((p: Record<string, unknown>) => String(p.subject_id) === String(formData.subject_id));
      const hasFetched = fetchedPapers.some(
        (p: Record<string, unknown>) => String(p.subject_id) === String(formData.subject_id)
      );
      if (hasLocal || hasFetched) return;
      try {
        const { data, error } = await supabase
          .from('subject_papers')
          .select('paper_id, paper_name, paper_code, subject_id')
          .eq('subject_id', formData.subject_id);
        if (error) throw error;
        setFetchedPapers((prev) => [...prev, ...(data || [])]);
      } catch {
        // non-fatal; keep modal working without papers
      }
    };
    loadPapersIfMissing();
  }, [formData.subject_id]);

  const allPapers = useMemo(() => [...papers, ...fetchedPapers], [papers, fetchedPapers]);

  // Get the teachers to display (filtered or all if no filtering applied)
  const teachersToDisplay = formData.level_id && formData.subject_id ? filteredTeachers : teachers;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg w-[92vw] sm:w-full max-w-lg sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden mt-4 sm:mt-8">
        <div className="px-6 py-5 sm:py-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Schedule Live Class</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28">
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <form id="live-class-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Participants</label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) =>
                  setFormData({ ...formData, max_participants: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full border rounded-lg px-3 py-2"
                min={1}
                max={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Program</label>
              <select
                value={formData.program_id}
                onChange={(e) =>
                  setFormData({ ...formData, program_id: e.target.value, level_id: '', subject_id: '', paper_id: '' })
                }
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select Program</option>
                {programs.map((program: Record<string, unknown>) => (
                  <option key={program.program_id as string} value={program.program_id as string}>
                    {program.name as string}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <select
                value={formData.level_id}
                onChange={(e) =>
                  setFormData({ ...formData, level_id: e.target.value, subject_id: '', paper_id: '' })
                }
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select Level</option>
                {levels
                  .filter((level: Record<string, unknown>) => !formData.program_id || level.program_id === formData.program_id)
                  .map((level: Record<string, unknown>) => (
                    <option key={level.level_id as string} value={level.level_id as string}>
                      {level.name as string}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value, paper_id: '' })}
                className="w-full border rounded-lg px-3 py-2"
                required
                disabled={!formData.level_id}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject: Record<string, unknown>) => (
                  <option key={subject.subject_id as string} value={subject.subject_id as string}>
                    {subject.name as string}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Paper (Optional)</label>
              <select
                value={formData.paper_id}
                onChange={(e) => setFormData({ ...formData, paper_id: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                disabled={!formData.subject_id}
              >
                <option value="">Select Paper</option>
                {allPapers
                  .filter((p: Record<string, unknown>) => String(p.subject_id) === String(formData.subject_id))
                  .map((p: Record<string, unknown>) => (
                    <option key={p.paper_id as string} value={p.paper_id as string}>
                      {p.paper_name as string} ({p.paper_code as string})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Teacher
              {formData.level_id && formData.subject_id && (
                <span className="text-sm text-gray-500 ml-2">
                  (Filtered for {(levels.find(l => l.level_id === formData.level_id) as Record<string, unknown>)?.name as string} - {(subjects.find(s => s.subject_id === formData.subject_id) as Record<string, unknown>)?.name as string})
                </span>
              )}
            </label>
            <select
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
              disabled={!formData.level_id || !formData.subject_id || loadingTeachers}
            >
              <option value="">
                {loadingTeachers 
                  ? 'Loading teachers...' 
                  : formData.level_id && formData.subject_id 
                    ? 'Select Teacher' 
                    : 'Select Level and Subject first'
                }
              </option>
              {teachersToDisplay.map((teacher: Record<string, unknown>) => (
                <option key={teacher.teacher_id as string} value={teacher.teacher_id as string}>
                  {(teacher.users as Record<string, unknown>)?.first_name as string} {(teacher.users as Record<string, unknown>)?.last_name as string}
                </option>
              ))}
            </select>
            {formData.level_id && formData.subject_id && teachersToDisplay.length === 0 && !loadingTeachers && (
              <p className="text-sm text-orange-600 mt-1">
                ⚠️ No teachers are currently assigned to teach {(subjects.find(s => s.subject_id === formData.subject_id) as Record<string, unknown>)?.name as string} at {(levels.find(l => l.level_id === formData.level_id) as Record<string, unknown>)?.name as string} level. 
                Please assign a teacher first in the Admin → Users section.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Platform</label>
              <select
                value={formData.meeting_platform}
                onChange={(e) => setFormData({ ...formData, meeting_platform: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Jitsi Meet">Jitsi Meet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meeting Link</label>
            <input
              type="url"
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="https://meet.google.com/..."
            />
          </div>
        </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="live-class-form"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Scheduling...' : 'Schedule Class'}
          </button>
        </div>
      </div>
    </div>
  );
}


